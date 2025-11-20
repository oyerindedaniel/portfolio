"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  cubicBezier,
  useMotionValue,
  useMotionTemplate,
  useTransform,
  animate,
} from "motion/react";
import { flushSync } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "./ui/button";
import {
  SignatureCanvas,
  SignatureControls,
  SignaturePath,
  SignatureRoot,
} from "./signature";
import SignaturePad from "signature_pad";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FocusTrap } from "./focus-trap";
import { useIsoLayoutEffect } from "@/hooks/use-Isomorphic-layout-effect";

interface ExpandedPaperProps {
  onClose: () => void;
}

const PAPER_WIDTH = 700;
const PAPER_HEIGHT = 550;
const FOLDER_WIDTH = 838;
const FOLDER_HEIGHT = 636;

const PAD_WIDTH = 580;
const PAD_HEIGHT = 200;

const springEasing = cubicBezier(0.34, 1.56, 0.64, 1);
const smoothEasing = "easeInOut";

const TRANSITIONS = {
  smooth: { duration: 0.3, ease: smoothEasing },
  smoothLong: { duration: 0.5, ease: smoothEasing },
  spring: { duration: 0.7, ease: springEasing },
  springMedium: { duration: 0.6, ease: springEasing },
  springLong: { duration: 0.8, ease: springEasing },
  springShort: { duration: 0.5, ease: springEasing },
  fade: { duration: 0.3 },
} as const;

const createFolderVariants = (
  isSmallScreen: boolean,
  skipAnimations: boolean
) => {
  const mobileOpen = {
    y: FOLDER_HEIGHT * 0.2,
    z: 0,
    rotateX: 0,
    opacity: 1,
  };

  const desktopOpen = {
    y: FOLDER_HEIGHT * 0.5,
    z: 0,
    rotateX: 0,
    opacity: 1,
  };

  const desktopExpanded = {
    y: FOLDER_HEIGHT * 0.5,
    z: -800,
    rotateX: 35,
    opacity: 0.5,
  };

  const closed = {
    y: FOLDER_HEIGHT,
    z: 0,
    rotateX: 0,
    opacity: 1,
  };

  return {
    closed: {
      ...closed,
      transition: skipAnimations ? { duration: 0 } : TRANSITIONS.smoothLong,
    },
    open: {
      ...(isSmallScreen ? mobileOpen : desktopOpen),
      transition: skipAnimations ? { duration: 0 } : TRANSITIONS.spring,
    },
    expanded: {
      ...(isSmallScreen ? mobileOpen : desktopExpanded),
      transition: skipAnimations ? { duration: 0 } : TRANSITIONS.springLong,
    },
    exit: {
      ...closed,
      opacity: 0,
      transition: TRANSITIONS.smoothLong,
    },
  };
};

const createPaperSlideVariants = (
  isSmallScreen: boolean,
  skipAnimations: boolean
) => {
  const openY = isSmallScreen ? -60 : -80;
  const closedY = 0;

  return {
    closed: {
      y: closedY,
      transition: skipAnimations ? { duration: 0 } : TRANSITIONS.smooth,
    },
    open: {
      y: openY,
      transition: skipAnimations ? { duration: 0 } : TRANSITIONS.springMedium,
    },
  };
};

const createPaperExpandVariants = (
  isSmallScreen: boolean,
  skipAnimations: boolean
) => {
  const mobileInitial = { y: "100%", opacity: 1 };
  const desktopInitial = { scale: 0.8, z: -1000, opacity: 0 };
  const final = { scale: 1, z: 0, opacity: 1 };

  return {
    initial: skipAnimations
      ? isSmallScreen
        ? { y: 0, opacity: 1 }
        : final
      : isSmallScreen
      ? mobileInitial
      : desktopInitial,
    animate: skipAnimations
      ? {}
      : isSmallScreen
      ? {
          y: 0,
          opacity: 1,
          transition: TRANSITIONS.springMedium,
        }
      : {
          ...final,
          transition: TRANSITIONS.springShort,
        },
    animateValues: final, // Values only, for use with set()
    exit: isSmallScreen
      ? {
          y: "100%",
          opacity: 1,
          transition: TRANSITIONS.smoothLong,
        }
      : {
          ...desktopInitial,
          transition: TRANSITIONS.smoothLong,
        },
  };
};

const toastVariants = {
  initial: { y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" },
  animate: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" },
};

const controlsVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

interface ExpandedPaperProps {
  onClose: () => void;
}

const ExpandedPaper: React.FC<ExpandedPaperProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signaturePath, setSignaturePath] = useState<string>("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSmallScreen = useMediaQuery("(max-width: 680px)");

  const contentRef = useRef<HTMLDivElement>(null);

  const clipPercentage = useMotionValue(30);
  const clipPath = useMotionTemplate`inset(0 0 ${clipPercentage}% 0 round 0.5rem)`;

  const borderHeight = useTransform(
    clipPercentage,
    (value) => `${100 - value}%`
  );

  useIsoLayoutEffect(() => {
    if (!contentRef.current || showAnimation) return;

    let rafId: number | null = null;

    const calculateClipPercentage = () => {
      if (!contentRef.current || !canvasRef.current) return;

      const paperHeight = contentRef.current.offsetHeight;
      const canvasHeight = canvasRef.current.offsetHeight;

      const titleHeight = 28;
      const buttonsHeight = 40;
      const gaps = 24 * 3;
      const padding = 48;

      const nonAnimatedHeight =
        titleHeight + canvasHeight + buttonsHeight + gaps + padding;

      const clipAmount =
        ((paperHeight - nonAnimatedHeight) / paperHeight) * 100;

      const targetValue = showAnimation
        ? 0
        : Math.max(20, Math.min(clipAmount, 45));

      animate(clipPercentage, targetValue, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    };

    calculateClipPercentage();

    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        calculateClipPercentage();
      });
    });

    observer.observe(contentRef.current);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showAnimation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      backgroundColor: "transparent",
      penColor: "oklch(0.5 0 0)",
      minWidth: 1.5,
      maxWidth: 3.5,
    });

    // Patch: Override _createPoint
    // Reason: Fix misalignment when canvas CSS size differs from its intrinsic pixel size.
    // Need Signature Canvas === Signature Pad Canvas.

    const padAny = pad as any;
    const originalCreatePoint = padAny._createPoint.bind(pad);

    padAny._createPoint = function (x: number, y: number, pressure: number) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const scaledX = rect.left + (x - rect.left);
      const scaledY = rect.top + (y - rect.top);

      const point = originalCreatePoint(scaledX, scaledY, pressure);

      point.x = (x - rect.left) * scaleX;
      point.y = (y - rect.top) * scaleY;

      return point;
    };

    signaturePadRef.current = pad;

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
    });

    return () => {
      pad.off();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      showToastMessage();
      return;
    }
    signaturePadRef.current?.clear();
    setSignaturePath("");
    setShowAnimation(false);
    setIsEmpty(true);
  };

  const showToastMessage = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setShowToast(true);

    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const handleAnimate = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      showToastMessage();
      return;
    }

    const data = signaturePadRef.current.toData();
    const paths = data.map((stroke) => {
      const points = stroke.points;
      if (points.length === 0) return "";

      let pathData = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      }
      return pathData;
    });

    const combinedPath = paths.join(" ");
    setSignaturePath(combinedPath);
    setShowAnimation(true);

    animate(clipPercentage, 0, {
      type: "spring",
      stiffness: 200,
      damping: 30,
    });
  };

  const handleDrawAgain = () => {
    setShowAnimation(false);
    handleClear();
  };

  const aspectRatio = isSmallScreen ? 3 / 3.8 : PAPER_WIDTH / PAPER_HEIGHT;

  const widthLimit = `min(90vw, ${(90 * aspectRatio).toFixed(4)}vh)`;
  const heightLimit = `min(90vh, ${(90 / aspectRatio).toFixed(4)}vw)`;
  const width = `min(${widthLimit}, ${PAPER_WIDTH}px)`;
  const height = `min(${heightLimit}, ${PAPER_HEIGHT}px)`;

  const maxWidth = `${PAPER_WIDTH}px`;
  const maxHeight = `${PAPER_HEIGHT}px`;

  return (
    <FocusTrap>
      <div>
        <AnimatePresence>
          {showToast && isEmpty && !showAnimation && (
            <motion.div
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={TRANSITIONS.fade}
              className="fixed top-0 left-1/2 -translate-x-1/2 px-4 py-2 z-50 bg-slate-200 border border-slate-200 rounded-lg shadow-sm text-center"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-sm text-slate-600">
                Draw something to get started
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="group relative rounded-lg overflow-hidden">
          <motion.div
            className="absolute inset-0 rounded-lg bg-transparent overflow-hidden z-20 pointer-events-none border-2 border-gray-300"
            style={{ height: borderHeight }}
          />
          <motion.div
            ref={contentRef}
            className="relative pointer-events-auto bg-white flex flex-col gap-6 p-6 z-4 rounded-lg overflow-hidden"
            style={{
              width,
              height,
              maxWidth,
              maxHeight,
              clipPath,
            }}
          >
            <div className="relative z-10 text-center text-foreground-muted text-xl font-medium">
              Draw your signature
            </div>

            <div className="relative z-10 w-full bg-slate-50 border border-slate-200 border-dashed rounded">
              <canvas
                ref={canvasRef}
                width={PAD_WIDTH}
                height={PAD_HEIGHT}
                className={cn(
                  "cursor-crosshair w-full touch-none",
                  showAnimation ? "hidden" : "block"
                )}
                style={{ aspectRatio: PAD_WIDTH / PAD_HEIGHT }}
              />
              <SignatureRoot
                key={signaturePath}
                duration={2000}
                autoPlay
                loop={false}
              >
                {showAnimation && signaturePath && (
                  <div className="w-full h-full">
                    <SignatureCanvas
                      viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full"
                      style={{ aspectRatio: PAD_WIDTH / PAD_HEIGHT }}
                    >
                      <SignaturePath
                        d={signaturePath}
                        strokeWidth={3.5}
                        color="oklch(0.5 0 0)"
                      />
                    </SignatureCanvas>
                  </div>
                )}

                <div className="absolute z-10 w-full space-y-4 mt-6">
                  <AnimatePresence mode="wait">
                    {showAnimation ? (
                      <motion.div
                        key="controls"
                        variants={controlsVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={TRANSITIONS.fade}
                        className="w-full space-y-4"
                      >
                        <SignatureControls.Root className="w-full">
                          <SignatureControls.Seek.Root>
                            <SignatureControls.Seek.Track>
                              <SignatureControls.Seek.Progress />
                              <SignatureControls.Seek.Thumb />
                            </SignatureControls.Seek.Track>
                            <SignatureControls.Seek.TimeDisplay className="text-foreground-muted text-base" />
                          </SignatureControls.Seek.Root>

                          <SignatureControls.Speed className="text-foreground-muted mt-2" />

                          <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="flex justify-center w-full gap-4">
                              <SignatureControls.PlayPause
                                variant="solid"
                                size="sm"
                              />
                              <Button
                                onClick={handleDrawAgain}
                                variant="outline"
                                size="sm"
                              >
                                Draw Again
                              </Button>
                            </div>

                            <div className="flex justify-center w-full gap-4">
                              <SignatureControls.Download.Button
                                className="text-brand-blue border-brand-blue hover:bg-white"
                                variant="brand"
                                format="png"
                                size="sm"
                              />

                              <SignatureControls.Download.Button
                                className="text-brand-blue border-brand-blue"
                                variant="brand"
                                format="svg"
                                size="sm"
                                downloadOptions={{ animated: true }}
                              />
                            </div>
                          </div>
                        </SignatureControls.Root>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="buttons"
                        variants={controlsVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={TRANSITIONS.fade}
                        className="flex justify-center gap-4"
                      >
                        <Button
                          onClick={handleClear}
                          variant="outline"
                          size="sm"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleAnimate}
                          variant="solid"
                          size="sm"
                        >
                          Animate
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SignatureRoot>
            </div>

            <Button
              onClick={() => {
                setShowToast(false);
                onClose();
              }}
              variant="solid"
              size="icon"
              className="absolute top-4 right-4 z-20"
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </motion.div>
        </div>
      </div>
    </FocusTrap>
  );
};

export function Path() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaperExpanded, setIsPaperExpanded] = useState(false);
  const [skipAnimations, setSkipAnimations] = useState(false);

  const folderRef = useRef<HTMLDivElement>(null);
  const folderControls = useAnimationControls();
  const paperSlideControls = useAnimationControls();
  const paperExpandControls = useAnimationControls();
  const [showClickButton, setShowClickButton] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 680px)");
  const prevIsSmallScreen = useRef(isSmallScreen);

  const folderVariants = createFolderVariants(isSmallScreen, skipAnimations);
  const paperSlideVariants = createPaperSlideVariants(
    isSmallScreen,
    skipAnimations
  );
  const paperExpandVariants = createPaperExpandVariants(
    isSmallScreen,
    skipAnimations
  );

  useIsoLayoutEffect(() => {
    const signatureParam = searchParams.get("signature");
    if (signatureParam === "open") {
      setSkipAnimations(true);
      setIsOpen(true);
      setIsPaperExpanded(true);
      setShowClickButton(false);

      // Set initial states without animation
      const { transition: _, ...folderExpandedValues } =
        folderVariants.expanded;
      const { transition: __, ...paperSlideOpenValues } =
        paperSlideVariants.open;
      folderControls.set(folderExpandedValues);
      paperSlideControls.set(paperSlideOpenValues);
      paperExpandControls.set(paperExpandVariants.animateValues);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      prevIsSmallScreen.current = isSmallScreen;
      return;
    }

    if (prevIsSmallScreen.current !== isSmallScreen) {
      const currentFolderVariants = createFolderVariants(isSmallScreen, true);
      const currentPaperSlideVariants = createPaperSlideVariants(
        isSmallScreen,
        true
      );

      if (isPaperExpanded) {
        const { transition: _, ...expandedValues } =
          currentFolderVariants.expanded;
        folderControls.start({
          ...expandedValues,
          transition: { duration: 0 },
        });
      } else {
        const { transition: __, ...openValues } = currentFolderVariants.open;
        const { transition: ___, ...slideOpenValues } =
          currentPaperSlideVariants.open;
        folderControls.start({
          ...openValues,
          transition: { duration: 0 },
        });
        paperSlideControls.start({
          ...slideOpenValues,
          transition: { duration: 0 },
        });
      }
    }

    prevIsSmallScreen.current = isSmallScreen;
  }, [isSmallScreen, isOpen, isPaperExpanded]);

  const handleToggle = async () => {
    if (isOpen) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("signature");
      router.replace(`?${params.toString()}`, { scroll: false });

      flushSync(() => {
        setIsPaperExpanded(false);
        setShowClickButton(false);
        setSkipAnimations(false);
      });

      if (skipAnimations) {
        setIsOpen(false);
        return;
      }

      await paperSlideControls.start(paperSlideVariants.closed);
      await folderControls.start(folderVariants.closed);
      setIsOpen(false);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("signature", "open");
      router.replace(`?${params.toString()}`, { scroll: false });

      flushSync(() => setIsOpen(true));

      if (skipAnimations) {
        setShowClickButton(false);
        setIsPaperExpanded(true);
        return;
      }

      await folderControls.start(folderVariants.open);
      await paperSlideControls.start(paperSlideVariants.open);
      setShowClickButton(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) {
        handleToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePaperClick = async () => {
    if (!isPaperExpanded) {
      flushSync(() => {
        setShowClickButton(false);
        setIsPaperExpanded(true);
      });

      if (skipAnimations) {
        const { transition: _, ...folderExpandedValues } =
          folderVariants.expanded;
        folderControls.set(folderExpandedValues);
        paperExpandControls.set(paperExpandVariants.animateValues);
        return;
      }

      if (isSmallScreen) {
        // Mobile: folder stays in place, paper slides up from it
        await new Promise((resolve) => setTimeout(resolve, 100));
        await paperExpandControls.start(paperExpandVariants.animate);
      } else {
        // Desktop: folder moves back in 3D space, paper zooms forward
        const folderAnimation = folderControls.start(folderVariants.expanded);
        setTimeout(() => {
          paperExpandControls.start(paperExpandVariants.animate);
        }, 400);
        await folderAnimation;
      }
    }
  };

  return (
    <>
      <Button
        className="!text-lg"
        aria-label="your signature"
        onClick={handleToggle}
      >
        Signature
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 backdrop-blur-xl z-40 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITIONS.fade}
            onClick={handleToggle}
            role="button"
            tabIndex={0}
            aria-label="Close signature view"
          />
        )}
      </AnimatePresence>

      <FocusTrap>
        <div className="fixed inset-0 pointer-events-none z-50">
          <div
            className={cn(
              "fixed inset-0 flex items-end justify-center",
              "[perspective:2000px] [transform-style:preserve-3d]",
              "pointer-events-none"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Signature document viewer"
          >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key="folder"
                  ref={folderRef}
                  className="absolute pointer-events-auto w-full max-w-[838px] aspect-[838/636] bottom-0 left-1/2 -translate-x-1/2 [transform-style:preserve-3d] [transform-origin:center_bottom]"
                  initial={
                    skipAnimations
                      ? isPaperExpanded
                        ? folderVariants.expanded
                        : folderVariants.open
                      : folderVariants.closed
                  }
                  animate={skipAnimations ? {} : folderControls}
                  exit={folderVariants.exit}
                >
                  <svg
                    viewBox="0 0 838 636"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <path
                      d="M271 0.700806L49.5 0C24.5 0.299197 15 15 15 37V606.5C15 630.5 21 635.5 48.5 635.5H787C816 635.5 823 627.5 823 606.5V119.5C823 94 810.5 87 786 87H379L339.5 37C317.972 7.84734 304 0.700806 271 0.700806Z"
                      fill="var(--brand-blue)"
                    />

                    <motion.g
                      animate={skipAnimations ? {} : paperSlideControls}
                      initial={
                        skipAnimations
                          ? paperSlideVariants.open
                          : paperSlideVariants.closed
                      }
                    >
                      <rect
                        x="69"
                        y="150"
                        width="700"
                        height="550"
                        rx="8"
                        fill="white"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                        className="[filter:drop-shadow(0_4px_12px_rgba(0,0,0,0.15))]"
                      />

                      {Array.from({ length: 12 }).map((_, i) => (
                        <line
                          key={i}
                          x1="129"
                          y1={230 + i * 35}
                          x2="709"
                          y2={230 + i * 35}
                          stroke="var(--brand-blue)"
                          strokeWidth="1.5"
                        />
                      ))}
                    </motion.g>

                    <g filter="url(#filter0_d_120_34)">
                      <path
                        d="M823 125.977C823 107.495 805.717 102 785.725 102C629.961 102 543.63 102.5 387.867 102.5C370.373 102.5 360.162 111.491 346.881 120.482C331.387 130.972 311.894 145.458 297.399 145.458H48.488H47.4884C27.4955 145.458 15 156.448 15 175.429V595.026C15 614.507 50.9871 622 70.98 622H769.73C793.5 622 823.5 608.481 823 589V125.977Z"
                        fill="#FFEAAF"
                      />
                    </g>

                    <path
                      d="M823 165.955C823 149.665 808.37 121 789.521 121H391.267C374.774 121 363.413 135.099 350.891 143.251C335.802 153.074 317.904 162.459 304.238 162.459H44.9815C26.1317 162.459 15 187.707 15 204.916C15 357.849 15.4997 595.027 15 595.027C15 616.5 31.4898 622 70.9654 622H773.5C817.5 622 823 604 823 579L823 165.955Z"
                      fill="#FFE290"
                    />

                    <defs>
                      <filter
                        id="filter0_d_120_34"
                        x="0"
                        y="78"
                        width="838.006"
                        height="550"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                      >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix
                          in="SourceAlpha"
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                          result="hardAlpha"
                        />
                        <feOffset dy="-9" />
                        <feGaussianBlur stdDeviation="7.5" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                        />
                        <feBlend
                          in2="BackgroundImageFix"
                          result="effect1_dropShadow_120_34"
                        />
                        <feBlend
                          in="SourceGraphic"
                          in2="effect1_dropShadow_120_34"
                          result="shape"
                        />
                      </filter>
                    </defs>
                  </svg>
                </motion.div>
              )}

              {isPaperExpanded && (
                <motion.div
                  key="paper"
                  className="absolute pointer-events-none inset-0 flex items-center justify-center"
                  initial={paperExpandVariants.initial}
                  animate={skipAnimations ? {} : paperExpandControls}
                  exit={paperExpandVariants.exit}
                >
                  <ExpandedPaper onClose={handleToggle} />
                </motion.div>
              )}
            </AnimatePresence>

            {showClickButton && (
              <Button
                variant="red"
                onClick={handlePaperClick}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-auto px-8 py-3 font-semibold shadow-lg z-10"
                aria-label="Click to view"
                style={{
                  bottom: isSmallScreen
                    ? `calc(${FOLDER_HEIGHT * 0.2}px + 60px - 100px)`
                    : `calc(${FOLDER_HEIGHT * 0.5}px + 80px - 125px)`,
                }}
              >
                Click to View
              </Button>
            )}
          </div>
        </div>
      </FocusTrap>
    </>
  );
}
