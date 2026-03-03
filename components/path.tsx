"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  cubicBezier,
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
  useSignature,
} from "./signature";
import SignaturePad from "signature_pad";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FocusTrap } from "./focus-trap";
import { useIsoLayoutEffect } from "@/hooks/use-Isomorphic-layout-effect";

const PAPER_WIDTH = 700;
const PAPER_HEIGHT = 550;
const FOLDER_WIDTH = 838;
const FOLDER_HEIGHT = 636;

const PAPER_WIDTH_DESKTOP = 700;
const PAPER_WIDTH_MOBILE = 778;

const PAD_WIDTH = 580;
const PAD_HEIGHT = 200;

const getPaperConstraints = (isSmallScreen: boolean) => {
  const paperSvgWidth = isSmallScreen ? PAPER_WIDTH_MOBILE : PAPER_WIDTH_DESKTOP;
  const fillPercentage = (paperSvgWidth / FOLDER_WIDTH) * 100;
  const aspectRatio = isSmallScreen ? 3 / 3.8 : PAPER_WIDTH / PAPER_HEIGHT;

  return {
    fillPercentage,
    aspectRatio,
  };
};

const smoothEasing = cubicBezier(0.4, 0, 0.2, 1);
const exitEasing = cubicBezier(0.32, 0, 0.67, 0);

const TRANSITIONS = {
  smooth: { duration: 0.25, ease: smoothEasing },
  smoothLong: { duration: 0.35, ease: smoothEasing },
  exit: { duration: 0.3, ease: exitEasing },
  spring: { type: "spring", stiffness: 200, damping: 28, mass: 1 },
  springMedium: { type: "spring", stiffness: 220, damping: 26, mass: 1 },
  springLong: { type: "spring", stiffness: 150, damping: 24, mass: 1 },
  springShort: { type: "spring", stiffness: 250, damping: 22, mass: 1 },
  fade: { duration: 0.2 },
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
      transition: TRANSITIONS.exit,
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
  const desktopInitial = { scale: 0.8, z: -1000, opacity: 0 };
  const final = { scale: 1, z: 0, opacity: 1 };

  return {
    initial: skipAnimations
      ? isSmallScreen
        ? { y: 0, opacity: 1 }
        : final
      : isSmallScreen
        ? { y: 350, opacity: 0.5, scale: 0.95 }
        : desktopInitial,
    animate: skipAnimations
      ? {}
      : isSmallScreen
        ? {
          y: 0,
          opacity: 1,
          scale: 1,
          z: 0,
          transition: TRANSITIONS.springMedium,
        }
        : {
          ...final,
          transition: TRANSITIONS.springShort,
        },
    animateValues: final,
    exit: isSmallScreen
      ? {
        y: "40vh",
        opacity: 0,
        transition: TRANSITIONS.exit,
      }
      : {
        ...desktopInitial,
        transition: TRANSITIONS.exit,
      },
  };
};

const toastVariants = {
  initial: { y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" },
  animate: { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" },
};

const controlsVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" },
};

function AutoPlay({ active }: { active: boolean }) {
  const controller = useSignature();
  useEffect(() => {
    if (active) {
      controller.reset();
      controller.play();
    }
  }, [active]);
  return null;
}

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      backgroundColor: "transparent",
      penColor: "oklch(0 0 0)",
      minWidth: 1.5,
      maxWidth: 3.5,
    });

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
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
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
  };

  const handleDrawAgain = () => {
    setShowAnimation(false);
    handleClear();
  };

  const { fillPercentage, aspectRatio } = useMemo(
    () => getPaperConstraints(isSmallScreen),
    [isSmallScreen]
  );

  const widthLimit = `min(${fillPercentage}vw, ${(fillPercentage * aspectRatio).toFixed(4)}vh)`;
  const width = `min(${widthLimit}, ${PAPER_WIDTH}px)`;
  const maxWidth = `${PAPER_WIDTH}px`;

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

        <div className="group relative rounded-lg">
          <motion.div
            layout
            ref={contentRef}
            className="relative pointer-events-auto bg-white flex flex-col z-4 rounded-lg overflow-hidden border-2 border-gray-300"
            style={{
              width,
              maxWidth,
            }}
          >
            <div className="relative z-10 text-center text-foreground-muted text-xl font-medium p-6 pb-2">
              Draw your signature
            </div>

            <SignatureRoot
              duration={2000}
              autoPlay
              loop={false}
            >
              <AutoPlay active={showAnimation} />
              <motion.div layout className="flex flex-col px-6 pb-6 gap-6">
                <div
                  className="relative w-full bg-slate-50 border border-slate-200 border-dashed rounded overflow-hidden"
                  style={{ aspectRatio: PAD_WIDTH / PAD_HEIGHT }}
                >
                  <canvas
                    ref={canvasRef}
                    width={PAD_WIDTH}
                    height={PAD_HEIGHT}
                    className={cn(
                      "cursor-crosshair w-full h-full touch-none absolute inset-0",
                      showAnimation ? "hidden" : "block"
                    )}
                  />
                  {showAnimation && signaturePath && (
                    <div className="absolute inset-0" key={signaturePath}>
                      <SignatureCanvas
                        viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
                        preserveAspectRatio="xMidYMid meet"
                        className="w-full h-full"
                      >
                        <SignaturePath
                          d={signaturePath}
                          strokeWidth={3.5}
                          color="oklch(0 0 0)"
                        />
                      </SignatureCanvas>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="popLayout">
                  {showAnimation ? (
                    <motion.div
                      layout
                      key={signaturePath + "-controls"}
                      variants={controlsVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={TRANSITIONS.fade}
                      className="w-full space-y-6"
                    >
                      <div className="space-y-4">
                        <SignatureControls.Seek.Root>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <SignatureControls.Seek.Track>
                                <SignatureControls.Seek.Progress />
                                <SignatureControls.Seek.Thumb />
                              </SignatureControls.Seek.Track>
                            </div>
                            <SignatureControls.Seek.TimeDisplay className="min-w-[70px] tabular-nums font-sans text-xs text-slate-400" />
                          </div>
                        </SignatureControls.Seek.Root>

                        <SignatureControls.Speed className="px-0.5" />
                      </div>

                      <div className="flex flex-col gap-5 pt-5 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-4">
                          <SignatureControls.PlayPause />
                          <Button
                            onClick={handleDrawAgain}
                            variant="outline"
                            size="lg"
                            font="bold"
                            className="bg-white text-slate-500 border-slate-200 hover:text-brand-blue hover:border-brand-blue/30 uppercase"
                          >
                            Draw Again
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <SignatureControls.Download.Button
                            variant="subtle"
                            format="png"
                            size="sm"
                            font="bold"
                            className="flex-1 h-10 rounded-lg"
                          >
                            <div className="flex items-center justify-center gap-1.5 font-bold uppercase tracking-[0.02em] text-[10px] whitespace-nowrap px-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              PNG
                            </div>
                          </SignatureControls.Download.Button>

                          <SignatureControls.Download.Button
                            variant="subtle"
                            format="svg"
                            size="sm"
                            font="bold"
                            downloadOptions={{ animated: true }}
                            className="flex-1 h-10 rounded-lg hover:border-brand-red/30 hover:text-brand-red hover:bg-brand-red/[0.02]"
                          >
                            <div className="flex items-center justify-center gap-1.5 font-bold uppercase tracking-[0.02em] text-[10px] whitespace-nowrap px-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity">
                                <circle cx="12" cy="12" r="10" />
                                <path d="m11 8-4 4 4 4" />
                                <path d="M7 12h10" />
                              </svg>
                              SVG
                            </div>
                          </SignatureControls.Download.Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      layout
                      key="buttons"
                      variants={controlsVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={TRANSITIONS.fade}
                      className="flex justify-center gap-4"
                    >
                      <Button onClick={handleClear} variant="outline" size="sm">
                        Clear
                      </Button>
                      <Button onClick={handleAnimate} variant="solid" size="sm">
                        Animate
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </SignatureRoot>

            <Button
              onClick={() => {
                setShowToast(false);
                onClose();
              }}
              variant="ghost"
              size="icon"
              font="sans"
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
    </FocusTrap >
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

  const folderVariants = useMemo(
    () => createFolderVariants(isSmallScreen, skipAnimations),
    [isSmallScreen, skipAnimations]
  );
  const paperSlideVariants = useMemo(
    () => createPaperSlideVariants(isSmallScreen, skipAnimations),
    [isSmallScreen, skipAnimations]
  );
  const paperExpandVariants = useMemo(
    () => createPaperExpandVariants(isSmallScreen, skipAnimations),
    [isSmallScreen, skipAnimations]
  );

  useIsoLayoutEffect(() => {
    const signatureParam = searchParams.get("signature");
    if (signatureParam === "open") {
      setSkipAnimations(true);
      setIsOpen(true);
      setIsPaperExpanded(true);
      setShowClickButton(false);

      folderControls.set(folderVariants.expanded);
      paperSlideControls.set(paperSlideVariants.open);
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
        folderControls.start({
          ...currentFolderVariants.expanded,
          transition: { duration: 0 },
        });
      } else {
        folderControls.start({
          ...currentFolderVariants.open,
          transition: { duration: 0 },
        });
        paperSlideControls.start({
          ...currentPaperSlideVariants.open,
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

      await Promise.all([
        paperSlideControls.start(paperSlideVariants.closed),
        folderControls.start(folderVariants.closed),
      ]);
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
        folderControls.set(folderVariants.expanded);
        paperExpandControls.set(paperExpandVariants.animateValues);
        return;
      }

      if (isSmallScreen) {
        await paperExpandControls.start(paperExpandVariants.animate);
      } else {
        const folderAnimation = folderControls.start(folderVariants.expanded);
        setTimeout(() => {
          paperExpandControls.start(paperExpandVariants.animate);
        }, 300);
        await folderAnimation;
      }
    }
  };

  return (
    <div>
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

                    {!isPaperExpanded && (
                      <motion.g
                        key="svg-paper"
                        layoutId="paper-document"
                        animate={skipAnimations ? {} : paperSlideControls}
                        initial={
                          skipAnimations
                            ? paperSlideVariants.open
                            : paperSlideVariants.closed
                        }
                        transition={TRANSITIONS.spring}
                      >
                        <rect
                          x={(FOLDER_WIDTH - (isSmallScreen ? PAPER_WIDTH_MOBILE : PAPER_WIDTH_DESKTOP)) / 2}
                          y="150"
                          width={isSmallScreen ? PAPER_WIDTH_MOBILE : PAPER_WIDTH_DESKTOP}
                          height="550"
                          rx="8"
                          fill="white"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                          className="[filter:drop-shadow(0_4px_12px_rgba(0,0,0,0.15))]"
                        />

                        {Array.from({ length: 12 }).map((_, i) => {
                          const width = isSmallScreen ? PAPER_WIDTH_MOBILE : PAPER_WIDTH_DESKTOP;
                          const x = (FOLDER_WIDTH - width) / 2;
                          const linePadding = isSmallScreen ? 60 : 60; // Relative to paper edge
                          return (
                            <line
                              key={i}
                              x1={x + linePadding}
                              y1={230 + i * 35}
                              x2={x + width - linePadding}
                              y2={230 + i * 35}
                              stroke="var(--brand-blue)"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </motion.g>
                    )}

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
                  layoutId="paper-document"
                  className="absolute pointer-events-none inset-0 flex items-center justify-center z-50 will-change-[transform,opacity]"
                  initial={paperExpandVariants.initial}
                  animate={skipAnimations ? {} : paperExpandControls}
                  exit={paperExpandVariants.exit}
                >
                  <ExpandedPaper onClose={handleToggle} />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showClickButton && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={TRANSITIONS.smooth}
                  className="absolute left-1/2 -translate-x-1/2 z-10"
                  style={{
                    bottom: isSmallScreen
                      ? `calc(${FOLDER_HEIGHT * 0.2}px + 60px - 100px)`
                      : `calc(${FOLDER_HEIGHT * 0.5}px + 80px - 125px)`,
                  }}
                >
                  <Button
                    variant="red"
                    onClick={handlePaperClick}
                    className="pointer-events-auto px-8 py-3 font-semibold shadow-lg"
                    aria-label="Click to view"
                  >
                    Click to View
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
