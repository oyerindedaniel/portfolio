"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  cubicBezier,
} from "motion/react";
import { flushSync } from "react-dom";
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

interface ExpandedPaperProps {
  onClose: () => void;
}

const PAPER_WIDTH = 700;
const PAPER_HEIGHT = 550;
const FOLDER_WIDTH = 838;
const FOLDER_HEIGHT = 636;

const PAD_WIDTH = 580;
const PAD_HEIGHT = 200;

interface ExpandedPaperProps {
  onClose: () => void;
}

const ExpandedPaper: React.FC<ExpandedPaperProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signaturePath, setSignaturePath] = useState<string>("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const [hasInteracted, setHasInteracted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSmallScreen = useMediaQuery("(max-width: 680px)");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      backgroundColor: "transparent",
      penColor: "oklch(0.5 0 0)",
      minWidth: 1.5,
      maxWidth: 3.5,
    });

    signaturePadRef.current = pad;

    pad.addEventListener("beginStroke", () => {
      setHasInteracted(true);
    });

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
    signaturePadRef.current?.clear();
    setSignaturePath("");
    setShowAnimation(false);
    setIsEmpty(true);

    if (hasInteracted) {
      showToastMessage();
    }
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

  const aspectRatio = isSmallScreen ? 3 / 4 : PAPER_WIDTH / PAPER_HEIGHT;

  const widthLimit = `min(90vw, ${(90 * aspectRatio).toFixed(4)}vh)`;
  const heightLimit = `min(90vh, ${(90 / aspectRatio).toFixed(4)}vw)`;
  const width = `min(${widthLimit}, ${PAPER_WIDTH}px)`;
  const height = `min(${heightLimit}, ${PAPER_HEIGHT}px)`;

  const maxWidth = `${PAPER_WIDTH}px`;
  const maxHeight = `${PAPER_HEIGHT}px`;

  return (
    <FocusTrap>
      <div
        className={cn(
          "relative flex items-center justify-center w-screen h-screen pointer-events-none"
        )}
      >
        <AnimatePresence>
          {showToast && isEmpty && !showAnimation && (
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-2 z-50 bg-slate-200 border border-slate-200 rounded-lg shadow-sm text-center"
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
        <div
          className="relative bg-transparent"
          style={{
            width,
            height,
            maxWidth,
            maxHeight,
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-transparent overflow-hidden border-2 z-2 pointer-events-none border-gray-300 shadow-[0_20px_60px_rgba(0,0,0,0.3)]" />
          <div
            data-animate={showAnimation}
            className={cn(
              "relative bg-transparent pointer-events-auto flex flex-col gap-6 p-6 transition-[clip-path] duration-1000 ease-in-out",
              "data-[animate=true]:[clip-path:inset(0_0_0_0)]",
              "data-[animate=false]:[clip-path:inset(0_0_30%_0)]"
            )}
            style={{
              width,
              height,
              maxWidth,
              maxHeight,
            }}
          >
            <div className="text-center text--foreground-muted text-xl font-medium">
              Draw your signature
            </div>

            <div className="relative w-full bg-slate-50 border border-slate-200 border-dashed rounded">
              <canvas
                ref={canvasRef}
                width={PAD_WIDTH}
                height={PAD_HEIGHT}
                className={cn(
                  "cursor-crosshair w-full",
                  showAnimation ? "hidden" : "block"
                )}
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
                    >
                      <SignaturePath
                        d={signaturePath}
                        strokeWidth={2.5}
                        color="oklch(0.5 0 0)"
                      />
                    </SignatureCanvas>
                  </div>
                )}

                <div className="w-full space-y-4 absolute mt-6">
                  <AnimatePresence mode="wait">
                    {showAnimation ? (
                      <motion.div
                        key="controls"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
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
              onClick={onClose}
              variant="solid"
              size="icon"
              className="absolute top-4 right-4"
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
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export function Path() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaperExpanded, setIsPaperExpanded] = useState(false);

  const folderRef = useRef<HTMLDivElement>(null);
  const folderControls = useAnimationControls();
  const paperSlideControls = useAnimationControls();
  const paperExpandControls = useAnimationControls();
  const [showClickButton, setShowClickButton] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 680px)");
  const prevIsSmallScreen = useRef(isSmallScreen);

  const springEasing = cubicBezier(0.34, 1.56, 0.64, 1);
  const smoothEasing = "easeInOut";

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
      if (isPaperExpanded) {
        if (isSmallScreen) {
          folderControls.start({
            y: FOLDER_HEIGHT * 0.2,
            z: 0,
            rotateX: 0,
            opacity: 1,
            transition: { duration: 0 },
          });
        } else {
          folderControls.start({
            y: FOLDER_HEIGHT * 0.5,
            z: -800,
            rotateX: 35,
            opacity: 0.5,
            transition: { duration: 0 },
          });
        }
      } else {
        if (isSmallScreen) {
          folderControls.start({
            y: FOLDER_HEIGHT * 0.2,
            z: 0,
            rotateX: 0,
            opacity: 1,
            transition: { duration: 0 },
          });

          paperSlideControls.start({
            y: -60,
            transition: { duration: 0 },
          });
        } else {
          folderControls.start({
            y: FOLDER_HEIGHT * 0.5,
            z: 0,
            rotateX: 0,
            opacity: 1,
            transition: { duration: 0 },
          });

          paperSlideControls.start({
            y: -80,
            transition: { duration: 0 },
          });
        }
      }
    }

    prevIsSmallScreen.current = isSmallScreen;
  }, [isSmallScreen, isOpen, isPaperExpanded]);

  const handleToggle = async () => {
    if (isOpen) {
      flushSync(() => {
        setIsPaperExpanded(false);
        setShowClickButton(false);
      });

      await paperSlideControls.start({
        y: 0,
        transition: { duration: 0.3, ease: smoothEasing },
      });

      await folderControls.start({
        y: FOLDER_HEIGHT,
        z: 0,
        rotateX: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: smoothEasing },
      });

      setIsOpen(false);
    } else {
      flushSync(() => setIsOpen(true));

      await folderControls.start({
        y: FOLDER_HEIGHT * (isSmallScreen ? 0.2 : 0.5),
        transition: {
          duration: 0.7,
          ease: springEasing,
        },
      });

      await paperSlideControls.start({
        y: isSmallScreen ? -60 : -80,
        transition: {
          duration: 0.6,
          ease: springEasing,
        },
      });

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

      if (isSmallScreen) {
        // Mobile: folder stays in place, paper slides up from it
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        // Desktop: folder moves back in 3D space, paper zooms forward
        const folderAnimation = folderControls.start({
          z: -800,
          rotateX: 35,
          opacity: 0.5,
          transition: {
            duration: 0.8,
            ease: springEasing,
          },
        });

        setTimeout(() => {
          paperExpandControls.start({
            scale: 1,
            z: 0,
            opacity: 1,
            transition: {
              duration: 0.5,
              ease: springEasing,
            },
          });
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
            transition={{ duration: 0.3 }}
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
                  initial={{
                    y: FOLDER_HEIGHT,
                    z: 0,
                    rotateX: 0,
                    opacity: 1,
                  }}
                  animate={folderControls}
                  exit={{
                    y: FOLDER_HEIGHT,
                    opacity: 0,
                    transition: { duration: 0.5, ease: smoothEasing },
                  }}
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

                    <motion.g animate={paperSlideControls} initial={{ y: 0 }}>
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
                  className="absolute pointer-events-none inset-0"
                  initial={
                    isSmallScreen
                      ? { y: "100%", opacity: 1 }
                      : { scale: 0.8, z: -1000, opacity: 0 }
                  }
                  animate={
                    isSmallScreen
                      ? {
                          y: 0,
                          opacity: 1,
                          transition: { duration: 0.6, ease: springEasing },
                        }
                      : paperExpandControls
                  }
                  exit={
                    isSmallScreen
                      ? {
                          y: "100%",
                          opacity: 1,
                          transition: { duration: 0.5, ease: smoothEasing },
                        }
                      : {
                          scale: 0.8,
                          z: -1000,
                          opacity: 0,
                          transition: { duration: 0.5, ease: smoothEasing },
                        }
                  }
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
