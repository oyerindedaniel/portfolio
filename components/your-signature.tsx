"use client";

import React, {
  useState,
  useLayoutEffect,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  cubicBezier,
} from "motion/react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/cn";
import { Button } from "./ui/button";
import { SignatureCanvas, SignaturePath, SignatureRoot } from "./signature";
import SignaturePad from "signature_pad";

const PAPER_WIDTH = 700;
const PAPER_HEIGHT = 550;
const FOLDER_WIDTH = 838;
const FOLDER_HEIGHT = 636;

const PAD_X = 60;
const PAD_Y = 50;
const PAD_WIDTH = 580;
const PAD_HEIGHT = 200;
const PAD_CORNER_RADIUS = 4;

const LINE_START_Y = PAD_Y + PAD_HEIGHT + 30;
const LINE_SPACING = 35;
const LINE_COUNT = 7;
const LINE_X1 = 60;
const LINE_X2 = 640;

const LABEL_Y = PAD_Y - 15;
const LABEL_X = PAPER_WIDTH / 2;

interface ExpandedPaperProps {
  onClose: () => void;
}

const ExpandedPaper: React.FC<ExpandedPaperProps> = ({ onClose }) => {
  const aspectRatio = PAPER_WIDTH / PAPER_HEIGHT;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signaturePath, setSignaturePath] = useState<string>("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const ref = useRef<HTMLDivElement | null>(null);

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

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
    });

    return () => {
      pad.off();
    };
  }, []);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setSignaturePath("");
    setShowAnimation(false);
    setIsEmpty(true);
  };

  const handleAnimate = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
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

    setSignaturePath(paths.join(" "));
    setShowAnimation(true);
  };

  const handleDrawAgain = () => {
    setShowAnimation(false);
    handleClear();
  };

  const getFocusable = useCallback((container: HTMLElement | null) => {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
    );
  }, []);

  const handleFocusTrapBefore = useCallback(() => {
    const focusables = getFocusable(ref.current);
    focusables[focusables.length - 1]?.focus();
  }, [getFocusable]);

  const handleFocusTrapAfter = useCallback(() => {
    const focusables = getFocusable(ref.current);
    focusables[0]?.focus();
  }, [getFocusable]);

  const svgHeight = `${(100 / aspectRatio).toFixed(2)}dvw`;
  const svgWidth = `100dvw`;
  const svgMaxHeight = `90dvh`;
  const svgMaxWidth = `${(90 * aspectRatio).toFixed(2)}dvh`;

  return (
    <>
      <div tabIndex={0} aria-hidden="true" onFocus={handleFocusTrapBefore} />

      <div
        ref={ref}
        className="relative flex items-center justify-center w-screen h-screen"
      >
        <div
          className="relative"
          style={{
            width: svgMaxWidth,
            height: svgMaxHeight,
            maxWidth: svgWidth,
            maxHeight: svgHeight,
          }}
        >
          <svg
            viewBox={`0 0 ${PAPER_WIDTH} ${PAPER_HEIGHT}`}
            className="w-full h-full drop-shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect
              x="0"
              y="0"
              width={PAPER_WIDTH}
              height={PAPER_HEIGHT}
              rx="8"
              fill="white"
              stroke="#d1d5db"
              strokeWidth="2"
            />

            <rect
              x={PAD_X}
              y={PAD_Y}
              width={PAD_WIDTH}
              height={PAD_HEIGHT}
              rx={PAD_CORNER_RADIUS}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="5,5"
            />

            {Array.from({ length: LINE_COUNT }).map((_, i) => (
              <line
                key={i}
                x1={LINE_X1}
                y1={LINE_START_Y + i * LINE_SPACING}
                x2={LINE_X2}
                y2={LINE_START_Y + i * LINE_SPACING}
                stroke="var(--brand-blue)"
                strokeWidth="1.5"
              />
            ))}

            <text
              x={LABEL_X}
              y={LABEL_Y}
              textAnchor="middle"
              fill="var(--foreground-muted)"
              fontSize="20"
              fontWeight="500"
            >
              Draw your signature here
            </text>
          </svg>

          <canvas
            ref={canvasRef}
            width={PAD_WIDTH}
            height={PAD_HEIGHT}
            className={cn(
              "absolute cursor-crosshair",
              showAnimation ? "hidden" : "block"
            )}
            style={{
              top: `calc((${PAD_Y} / ${PAPER_HEIGHT}) * min(${svgHeight}, ${svgMaxHeight}))`,
              left: `calc((${PAD_X} / ${PAPER_WIDTH}) * min(${svgWidth}, ${svgMaxWidth}))`,
              width: `calc((${PAD_WIDTH} / ${PAPER_WIDTH}) * min(${svgWidth}, ${svgMaxWidth}))`,
              height: `calc((${PAD_HEIGHT} / ${PAPER_HEIGHT}) * min(${svgHeight}, ${svgMaxHeight}))`,
            }}
          />

          {showAnimation && signaturePath && (
            <div
              className="absolute"
              style={{
                top: `calc((${PAD_Y} / ${PAPER_HEIGHT}) * min(${svgHeight}, ${svgMaxHeight}))`,
                left: `calc((${PAD_X} / ${PAPER_WIDTH}) * min(${svgWidth}, ${svgMaxWidth}))`,
                width: `calc((${PAD_WIDTH} / ${PAPER_WIDTH}) * min(${svgWidth}, ${svgMaxWidth}))`,
                height: `calc((${PAD_HEIGHT} / ${PAPER_HEIGHT}) * min(${svgHeight}, ${svgMaxHeight}))`,
              }}
            >
              <SignatureRoot duration={2000} autoPlay loop={false}>
                <SignatureCanvas
                  viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full"
                >
                  <SignaturePath
                    d={signaturePath}
                    strokeWidth={2.5}
                    color="#1e293b"
                  />
                </SignatureCanvas>
              </SignatureRoot>
            </div>
          )}

          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-full flex gap-3"
            style={{
              top: `calc(((${
                LINE_START_Y + 5 * LINE_SPACING
              }) / ${PAPER_HEIGHT}) * 100%)`,
            }}
          >
            {!showAnimation ? (
              <>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                  disabled={isEmpty}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleAnimate}
                  variant="solid"
                  size="sm"
                  disabled={isEmpty}
                >
                  Animate
                </Button>
              </>
            ) : (
              <Button onClick={handleDrawAgain} variant="solid" size="sm">
                Draw Again
              </Button>
            )}
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
      <div tabIndex={0} aria-hidden="true" onFocus={handleFocusTrapAfter} />
    </>
  );
};

export function YourSignature() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaperExpanded, setIsPaperExpanded] = useState(false);

  const folderRef = useRef<HTMLDivElement>(null);
  const folderControls = useAnimationControls();
  const paperSlideControls = useAnimationControls();
  const paperExpandControls = useAnimationControls();
  const [showClickButton, setShowClickButton] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleToggle = async () => {
    if (isOpen) {
      flushSync(() => {
        setIsPaperExpanded(false);
        setShowClickButton(false);
      });

      await paperSlideControls.start({
        y: 0,
        transition: { duration: 0.3, ease: "easeInOut" },
      });

      await folderControls.start({
        y: FOLDER_HEIGHT,
        z: 0,
        rotateX: 0,
        opacity: 1,
        transition: { duration: 0.5, ease: "easeIn" },
      });

      setIsOpen(false);
    } else {
      flushSync(() => setIsOpen(true));

      await folderControls.start({
        y: FOLDER_HEIGHT * 0.5,
        transition: {
          duration: 0.7,
          ease: cubicBezier(0.34, 1.56, 0.64, 1),
        },
      });

      await paperSlideControls.start({
        y: -80,
        transition: {
          duration: 0.6,
          ease: cubicBezier(0.34, 1.56, 0.64, 1),
        },
      });

      setShowClickButton(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      handleToggle();
    }
  };

  const handlePaperClick = async () => {
    if (!isPaperExpanded) {
      flushSync(() => {
        setShowClickButton(false);
        setIsPaperExpanded(true);
      });

      const folderAnimationDuration = 800;

      const folderAnimation = folderControls.start({
        z: -800,
        rotateX: 35,
        opacity: 0.5,
        transition: {
          duration: folderAnimationDuration / 1000,
          ease: cubicBezier(0.34, 1.56, 0.64, 1),
        },
      });

      setTimeout(() => {
        paperExpandControls.start({
          scale: 1,
          z: 0,
          opacity: 1,
          transition: {
            duration: (folderAnimationDuration / 1000) * 0.6,
            ease: cubicBezier(0.34, 1.56, 0.64, 1),
          },
        });
      }, folderAnimationDuration * 0.5);

      await folderAnimation;
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
            className="fixed inset-0 bg-surface-primary/80 backdrop-blur-xl z-40 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Close signature view"
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-50">
        <div
          className={cn(
            "absolute inset-0 flex items-end justify-center",
            "[perspective:2000px] [transform-style:preserve-3d]",
            isOpen ? "pointer-events-auto" : "pointer-events-none"
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
                className="absolute w-full max-w-[838px] aspect-[838/636] bottom-0 left-1/2 -translate-x-1/2 [transform-style:preserve-3d] [transform-origin:center_bottom]"
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
                  transition: { duration: 0.5, ease: "easeIn" },
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

                    {showClickButton && (
                      <g
                        onClick={handlePaperClick}
                        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 origin-center"
                      >
                        <rect
                          x="319"
                          y="100"
                          width="200"
                          height="50"
                          rx="25"
                          fill="var(--brand-red)"
                        />
                        <text
                          x="419"
                          y="132"
                          textAnchor="middle"
                          fill="white"
                          fontSize="18"
                          fontWeight="600"
                          style={{ pointerEvents: "none" }}
                        >
                          Click to View
                        </text>
                      </g>
                    )}
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
                className="absolute inset-0"
                initial={{ scale: 0.8, z: -1000, opacity: 0 }}
                animate={paperExpandControls}
                exit={{
                  scale: 0.8,
                  z: -1000,
                  opacity: 0,
                  transition: { duration: 0.5, ease: "easeIn" },
                }}
              >
                <ExpandedPaper onClose={handleToggle} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
