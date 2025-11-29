import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  createContext,
  forwardRef,
  memo,
} from "react";
import { cn } from "@/lib/cn";
import { useComposedRefs } from "@/hooks/use-compose-refs";
import { useStableHandler } from "@/hooks/use-stable-handler";
import { useIsoLayoutEffect } from "@/hooks/use-Isomorphic-layout-effect";
import { useClientOnly } from "@/hooks/use-client-only";
import { useRAF } from "@/hooks/use-raf";
import { Button } from "./ui/button";
import { HitArea } from "./hit-area";

// ============================================================================
// VIEWPORT AUTOPLAY
// ============================================================================

/**
 * Configuration for viewport-based autoplay behavior
 */
export interface ViewportAutoPlayConfig {
  /**
   * Enable viewport-based autoplay
   * @default false
   */
  enabled?: boolean;

  /**
   * Threshold for triggering autoplay (0-1)
   * - 0 = any part of element visible
   * - 0.5 = 50% of element visible
   * - 1 = entire element visible
   * @default 0.5
   */
  threshold?: number;

  /**
   * Root margin for intersection observer
   * Positive values trigger earlier, negative values trigger later
   * @default "0px"
   * @example "50px" (trigger 50px before entering viewport)
   * @example "-50px" (trigger 50px after entering viewport)
   */
  rootMargin?: string;

  /**
   * Behavior when element leaves viewport
   * - "pause" = pause animation and resume when re-entering
   * - "reset" = reset to start when re-entering
   * - "continue" = keep playing even when out of viewport
   * @default "pause"
   */
  onLeave?: "pause" | "reset" | "continue";

  /**
   * Behavior when element re-enters viewport
   * - "resume" = continue from where it left off
   * - "restart" = start from beginning
   * @default "resume"
   */
  onEnter?: "resume" | "restart";

  /**
   * Only play once (never replay even if re-entering viewport)
   * @default false
   */
  once?: boolean;

  /**
   * Delay before starting animation after entering viewport (ms)
   * @default 0
   */
  delay?: number;
}

/**
 * Hook to handle viewport-based autoplay
 * Uses IntersectionObserver API for efficient viewport detection
 */
export function useViewportAutoPlay(
  elementRef: React.RefObject<HTMLElement | null>,
  controller: {
    play: () => void;
    pause: () => void;
    reset: () => void;
    isCompleted: boolean;
    isPlaying: boolean;
  },
  config: ViewportAutoPlayConfig = {}
) {
  const {
    enabled = false,
    threshold = 0.5,
    rootMargin = "0px",
    onLeave = "pause",
    onEnter = "resume",
    once = false,
    delay = 0,
  } = config;

  const hasStartedRef = useRef(false);
  const hasCompletedOnceRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const previouslyPausedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;

    const observerThreshold = threshold;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Element is entering or already in viewport
          if (entry.isIntersecting) {
            const meetsThreshold = entry.intersectionRatio >= threshold;

            if (!meetsThreshold) return;

            // Check if we should play (respect 'once' option)
            if (once && hasCompletedOnceRef.current) return;

            // Prevent re-triggering if already playing
            if (controller.isPlaying) return;

            // Handle restart vs resume
            if (
              onEnter === "restart" ||
              (!previouslyPausedRef.current && !hasStartedRef.current)
            ) {
              controller.reset();
            }

            if (delay > 0) {
              timeoutRef.current = window.setTimeout(() => {
                if (!controller.isCompleted || onEnter === "restart" || !once) {
                  controller.play();
                  hasStartedRef.current = true;
                }
              }, delay);
            } else {
              if (!controller.isCompleted || onEnter === "restart" || !once) {
                controller.play();
                hasStartedRef.current = true;
              }
            }

            previouslyPausedRef.current = false;
          }
          // Element is leaving viewport
          else {
            if (controller.isCompleted && hasStartedRef.current) {
              hasCompletedOnceRef.current = true;
            }
            // Only handle if we were previously playing or paused by viewport
            if (controller.isPlaying || previouslyPausedRef.current) {
              switch (onLeave) {
                case "pause":
                  controller.pause();
                  previouslyPausedRef.current = true;
                  break;
                case "reset":
                  controller.reset();
                  previouslyPausedRef.current = false;
                  hasStartedRef.current = false;
                  break;
                case "continue":
                  // Do nothing, keep playing
                  break;
              }
            }
          }
        });
      },
      {
        threshold: observerThreshold,
        rootMargin: rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    enabled,
    threshold,
    rootMargin,
    onLeave,
    onEnter,
    once,
    delay,
    controller,
  ]);
}

/* ===========================
       PUBLIC TYPE DECLARATIONS
       =========================== */

/**
 * Animation state machine states
 */
export type AnimationState =
  | "idle"
  | "playing"
  | "paused"
  | "completed"
  | "looping";

/**
 * Easing function: maps progress [0..1] → [0..1]
 */
export type EasingFn = (t: number) => number;

/**
 * Configuration for hand-drawn jitter effect
 */
export interface JitterConfig {
  amplitude: number; // Jitter magnitude in SVG units
  frequency: number; // How often jitter changes (0..1)
  seed?: number; // Deterministic seed for reproducibility
}

/**
 * Root container props
 */
export interface SignatureRootProps {
  children?:
    | React.ReactNode
    | ((controller: SignatureController) => React.ReactNode);
  duration?: number; // Animation duration in milliseconds
  speed?: number; // Playback speed multiplier
  easing?: "linear" | "easeInOutQuad" | "easeOutElastic" | EasingFn;
  jitter?: JitterConfig | null; // Global jitter configuration
  pressure?: boolean; // Enable pressure/width variation
  roughen?: boolean; // Enable SVG roughness filter
  autoPlay?: boolean; // Start animation on mount
  loop?: boolean; // Loop animation continuously
  respectReducedMotion?: boolean; // Honor prefers-reduced-motion
  static?: boolean; // Render final state only (no animation)

  /**
   * Viewport-based autoplay configuration
   * When enabled, overrides the autoPlay prop
   */
  viewportAutoPlay?: ViewportAutoPlayConfig;

  // Lifecycle callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onComplete?: () => void;
  onStateChange?: (state: AnimationState) => void;
}

/**
 * SVG canvas wrapper props
 */
export interface SignatureCanvasProps extends React.SVGProps<SVGSVGElement> {
  children?: React.ReactNode;
  viewBox?: string;
  preserveAspectRatio?: string;
  backgroundImage?: string; // Custom texture/background image URL
  backgroundOpacity?: number; // Background opacity (0-1)
}

/**
 * Individual path props
 */
export interface SignaturePathProps extends React.SVGProps<SVGPathElement> {
  d?: string; // SVG path data
  src?: string; // External SVG source
  color?: string; // Stroke color
  strokeWidth?: number; // Base stroke width
  duration?: number; // Override animation duration
  delay?: number; // Delay before animation starts (ms)
  jitter?: JitterConfig | null; // Path-specific jitter
  easing?: "inherit" | EasingFn; // Path-specific easing
  pathId?: string; // Unique identifier

  // Path lifecycle callbacks
  onDrawStart?: () => void;
  onDrawFrame?: (progress: number) => void;
  onDrawComplete?: () => void;
}

/**
 * Root animation controller interface
 */
export interface SignatureController {
  play(): void;
  pause(): void;
  toggle(): void;
  reset(): void;
  seek(progress: number): void; // Seek to [0..1]
  setSpeed(multiplier: number): void;
  readonly duration: React.RefObject<number>;
  readonly progress: React.RefObject<number>;
  readonly state: AnimationState;
  readonly isPlaying: boolean;
  readonly isPaused: boolean;
  readonly isCompleted: boolean;
  readonly isLooping: boolean;
  exportSvg(options?: {
    animated?: boolean;
    duration?: number;
    loop?: boolean;
  }): Promise<string>;
  exportPng(scale?: number): Promise<Blob>;
  exportGif(options?: {
    fps?: number;
    quality?: number;
    duration?: number;
  }): Promise<Blob>;
}

interface ExportSvgOptions {
  animated?: boolean;
  duration?: number;
  loop?: boolean;
}
type ExportPngScale = Parameters<SignatureController["exportPng"]>[0];
interface ExportGifOptions {
  fps?: number;
  quality?: number;
  duration?: number;
}

/**
 * Per-path controller interface
 */
export interface SignaturePathController {
  readonly id: string;
  readonly progress: number;
  readonly length: number;
  play(): void;
  pause(): void;
  reset(): void;
  seek(progress: number): void;
}

/* ===========================
       EASING FUNCTIONS
       =========================== */

/**
 * Quadratic ease in-out
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Elastic ease out (bouncy)
 */
export function easeOutElastic(t: number): number {
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

/**
 * Normalize easing input to function
 */
export function normalizeEasing(
  easing?: "linear" | "easeInOutQuad" | "easeOutElastic" | EasingFn
): EasingFn {
  if (!easing || easing === "linear") return (t) => t;
  if (easing === "easeInOutQuad") return easeInOutQuad;
  if (easing === "easeOutElastic") return easeOutElastic;
  return easing as EasingFn;
}

/**
 * Seeded noise generator for deterministic jitter.
 * Returns function that generates values in [-1, 1]
 */
export function createNoise(seed: number): (x: number) => number {
  let state = seed || 1;
  return (x: number): number => {
    let t = state + x * 374761393;
    t = (t ^ (t >> 13)) * 1274126177;
    t = t ^ (t >> 16);
    state = t;
    const n = (t % 1000) / 1000;
    return n * 2 - 1;
  };
}

/* ===========================
       INTERNAL TYPES
       =========================== */

/**
 * Internal path registration record
 */
interface PathRecord {
  id: string;
  ref: React.RefObject<SVGPathElement | null>;
  length: number;
  duration: number;
  delay: number;
  color?: string;
  strokeWidth?: number;
  jitter?: JitterConfig | null;
  easing: EasingFn;
  onDrawStart?: () => void;
  onDrawFrame?: (p: number) => void;
  onDrawComplete?: () => void;
  progress: number;
  hasStarted: boolean;
  hasCompleted: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  dOriginal?: string | null;
}

/**
 * Context value exposed to child components
 */
interface SignatureContextValue {
  // Path registry
  registerPath(record: PathRecord): string;
  unregisterPath(id: string): void;
  getPathRecord(id: string): PathRecord | null;
  updatePathVisual(record: PathRecord): void;

  // Controller access
  getController(): SignatureController;

  // Refs
  rootRef: React.RefObject<SVGGElement | SVGSVGElement | null>;

  // Configuration
  config: {
    duration: number;
    speed: number;
    easing: EasingFn;
    jitter?: JitterConfig | null;
    pressure?: boolean;
    roughen?: boolean;
    autoPlay?: boolean;
    loop?: boolean;
    respectReducedMotion?: boolean;
  };

  // Reactive state for UI
  progress: React.RefObject<number>;
  state: AnimationState;
  isPlaying: boolean;
  duration: React.RefObject<number>;
  seek(progress: number): void;

  // Accessibility IDs
  seekSliderId: string;
  currentTimeId: string;
  durationId: string;
}

/* ===========================
       CONTEXT
       =========================== */

const SignatureContext = createContext<SignatureContextValue | null>(null);

function useSignatureContext(): SignatureContextValue {
  const ctx = useContext(SignatureContext);
  if (!ctx) {
    throw new Error("Signature components must be used within SignatureRoot");
  }
  return ctx;
}

/* ===========================
       SIGNATURE ROOT
       =========================== */

/**
 * SignatureRoot: Orchestrates animation timeline and manages global state
 */
export const SignatureRoot: React.FC<SignatureRootProps> = (props) => {
  const {
    children,
    duration: durationProp = 1500,
    speed: speedProp = 1,
    easing: easingProp,
    jitter: jitterProp = null,
    pressure: pressureProp = false,
    roughen: roughenProp = false,
    autoPlay: autoPlayProp = false,
    loop: loopProp = false,
    respectReducedMotion = true,
    static: staticProp = false,
    viewportAutoPlay = { enabled: false },
    onPlay,
    onPause,
    onComplete,
    onStateChange,
  } = props;

  // DOM refs
  const rootRef = useRef<SVGGElement | SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Path registry
  const pathsMapRef = useRef<Map<string, PathRecord>>(new Map());

  // Animation state machine
  const [animationState, setAnimationState] = useState<AnimationState>("idle");
  const stateRef = useRef<AnimationState>("idle");

  // Animation state
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const durationTotalRef = useRef(durationProp);

  const speedRef = useRef(speedProp);
  const loopRef = useRef(loopProp);

  // Accessibility IDs
  const seekSliderId = React.useId();
  const currentTimeId = React.useId();
  const durationId = React.useId();

  useEffect(() => {
    speedRef.current = speedProp;
  }, [speedProp]);

  useEffect(() => {
    loopRef.current = loopProp;
  }, [loopProp]);

  const config = useMemo(
    () => ({
      duration: durationProp,
      speed: speedProp,
      easing: normalizeEasing(easingProp),
      jitter: jitterProp,
      pressure: pressureProp,
      roughen: roughenProp,
      autoPlay: autoPlayProp,
      loop: loopProp,
      respectReducedMotion,
    }),
    [
      durationProp,
      speedProp,
      easingProp,
      jitterProp,
      pressureProp,
      roughenProp,
      autoPlayProp,
      loopProp,
      respectReducedMotion,
    ]
  );

  /**
   * Update animation state machine
   */
  const updateState = useCallback(
    (newState: AnimationState) => {
      if (stateRef.current === newState) return;
      stateRef.current = newState;
      setAnimationState(newState);
      if (onStateChange) {
        onStateChange(newState);
      }
    },
    [onStateChange]
  );

  /**
   * Calculate total timeline duration based on all paths
   */
  const computeGlobalDuration = useCallback(() => {
    let max = config.duration;

    for (const rec of pathsMapRef.current.values()) {
      const end = rec.delay + rec.duration;
      if (end > max) max = end;
    }

    return max;
  }, [config.duration]);

  /**
   * Register path to animation timeline
   */
  const registerPath = useCallback(
    (record: PathRecord): string => {
      const id = record.id || `path_${Math.random().toString(36).slice(2, 9)}`;
      record.id = id;
      pathsMapRef.current.set(id, record);
      durationTotalRef.current = computeGlobalDuration();
      return id;
    },
    [computeGlobalDuration]
  );

  /**
   * Unregister path from timeline
   */
  const unregisterPath = useCallback(
    (id: string) => {
      pathsMapRef.current.delete(id);
      durationTotalRef.current = computeGlobalDuration();
    },
    [computeGlobalDuration]
  );

  /**
   * Get path record by ID
   */
  const getPathRecord = useCallback((id: string): PathRecord | null => {
    return pathsMapRef.current.get(id) || null;
  }, []);

  /**
   * Update visual state of a single path
   */
  const updatePathVisual = useCallback(
    (record: PathRecord) => {
      const el = record.ref.current;
      if (!el) return;

      try {
        const total = record.length;
        const easedProgress = record.easing(record.progress);

        // Stroke dash animation
        el.style.strokeDasharray = `${total} ${total}`;
        el.style.strokeDashoffset = `${total * (1 - easedProgress)}`;

        // Color and base width
        if (record.color) el.style.stroke = record.color;
        if (record.strokeWidth !== undefined) {
          el.style.strokeWidth = `${record.strokeWidth}`;
        }

        // Pressure simulation: vary width dynamically
        if (config.pressure && record.strokeWidth) {
          const pressureFactor = 0.8 + 0.6 * Math.sin(easedProgress * Math.PI);
          el.style.strokeWidth = `${record.strokeWidth * pressureFactor}`;
        }

        // Jitter
        const jitterConfig =
          record.jitter !== undefined ? record.jitter : config.jitter;
        if (jitterConfig && easedProgress > 0 && easedProgress < 1) {
          const { amplitude = 0.5, seed = 1 } = jitterConfig;
          const noise = createNoise(seed);

          // Envelope reduces jitter at endpoints
          const envelope = 1 - Math.abs(0.5 - easedProgress) * 2;
          const jitterX = noise(easedProgress * 100) * amplitude * envelope;
          const jitterY = noise(easedProgress * 101) * amplitude * envelope;

          el.style.transform = `translate3d(${jitterX}px, ${jitterY}px, 0)`;
        } else {
          el.style.transform = "";
        }

        // Lifecycle callbacks
        if (record.progress > 0 && !record.hasStarted && record.onDrawStart) {
          record.hasStarted = true;
          record.onDrawStart();
        }

        if (
          record.progress >= 1 &&
          !record.hasCompleted &&
          record.onDrawComplete
        ) {
          record.hasCompleted = true;
          record.onDrawComplete();
        }
      } catch (e) {
        // ignore visual update errors
      }
    },
    [config.jitter, config.pressure]
  );

  /**
   * Apply global progress to all paths
   */
  const applyProgressToPaths = useCallback(
    (globalProgress: number) => {
      const totalMs = durationTotalRef.current;

      for (const record of pathsMapRef.current.values()) {
        if (!record?.ref.current) continue;

        // Skip if path is individually paused (path-level control)
        if (record.isPaused) continue;

        // Calculate local progress based on delay and duration
        const localStart = record.delay;
        const localDuration = record.duration;
        const t = (globalProgress * totalMs - localStart) / localDuration;
        const clamped = Math.max(0, Math.min(1, t));

        record.progress = clamped;
        updatePathVisual(record);

        // Per-frame callback
        if (record.onDrawFrame) {
          try {
            record.onDrawFrame(clamped);
          } catch (e) {
            // Swallow errors
          }
        }
      }
    },
    [updatePathVisual]
  );

  /**
   * Main animation loop using requestAnimationFrame
   *
   * NOTE: Uses separate RAF instead of global singleton because:
   * - This is the DRIVER loop that controls timing and state machine
   * - Global RAF is for VISUAL UPDATES only (Progress, Thumb, TimeDisplay)
   */
  const tickLoop = useCallback(
    (now: number) => {
      if (stateRef.current !== "playing" && stateRef.current !== "looping")
        return;

      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = (now - startTimeRef.current) * speedRef.current;
      const totalMs = durationTotalRef.current || config.duration;
      const rawProgress = elapsed / totalMs;
      const progress = Math.max(0, Math.min(1, rawProgress));

      progressRef.current = progress;
      applyProgressToPaths(progress);

      // Handle completion
      if (progress >= 1) {
        if (loopRef.current) {
          updateState("looping");
          startTimeRef.current = now;
          progressRef.current = 0;

          // Reset path completion flags for loop
          for (const record of pathsMapRef.current.values()) {
            record.hasStarted = false;
            record.hasCompleted = false;
          }

          if (onComplete) onComplete();
          rafRef.current = requestAnimationFrame(tickLoop);
        } else {
          updateState("completed");
          if (onComplete) onComplete();

          // Keep progress at 1 so signature stays visible
          progressRef.current = 1;
          startTimeRef.current = null;
          pausedAtRef.current = null;

          // Keep all paths at completion state (progress = 1)
          for (const record of pathsMapRef.current.values()) {
            record.progress = 1;
            updatePathVisual(record);
          }
        }
      } else {
        rafRef.current = requestAnimationFrame(tickLoop);
      }
    },
    [config.duration, applyProgressToPaths, onComplete, updateState]
  );

  /**
   * Start/resume animation
   */
  const play = useCallback(() => {
    if (config.respectReducedMotion) {
      const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      if (mq?.matches) {
        seek(1);
        updateState("completed");
        return;
      }
    }

    if (stateRef.current === "playing" || stateRef.current === "looping")
      return;

    // Resume from paused position
    if (
      stateRef.current === "paused" &&
      pausedAtRef.current !== null &&
      startTimeRef.current !== null
    ) {
      const pausedElapsed = pausedAtRef.current - startTimeRef.current;
      startTimeRef.current = performance.now() - pausedElapsed;
    } else if (
      stateRef.current === "completed" ||
      stateRef.current === "idle"
    ) {
      // Start from beginning
      startTimeRef.current = null;
      progressRef.current = 0;

      // Reset all paths
      for (const record of pathsMapRef.current.values()) {
        record.hasStarted = false;
        record.hasCompleted = false;
      }
    }

    updateState("playing");
    if (onPlay) onPlay();

    rafRef.current = requestAnimationFrame(tickLoop);
  }, [config.respectReducedMotion, tickLoop, onPlay, updateState]);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    if (stateRef.current !== "playing" && stateRef.current !== "looping")
      return;

    pausedAtRef.current = performance.now();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    updateState("paused");
    if (onPause) onPause();
  }, [onPause, updateState]);

  /**
   * Toggle play/pause
   */
  const toggle = useCallback(() => {
    if (stateRef.current === "playing" || stateRef.current === "looping") {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  /**
   * Reset animation to start
   */
  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    updateState("idle");
    progressRef.current = 0;
    startTimeRef.current = null;
    pausedAtRef.current = null;

    // Reset all paths
    for (const record of pathsMapRef.current.values()) {
      record.progress = 0;
      record.hasStarted = false;
      record.hasCompleted = false;
      updatePathVisual(record);
    }
  }, [updatePathVisual, updateState]);

  /**
   * Seek to specific progress [0..1]
   */
  const seek = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      progressRef.current = clamped;

      const totalMs = durationTotalRef.current;
      const targetElapsed = (clamped * totalMs) / speedRef.current;

      if (stateRef.current === "completed") {
        stateRef.current = "paused";
      }

      // Adjust timing for both playing and paused states
      if (stateRef.current === "playing" || stateRef.current === "looping") {
        startTimeRef.current = performance.now() - targetElapsed;
      } else if (stateRef.current === "paused") {
        // Set startTimeRef to progress time
        const now = performance.now();
        startTimeRef.current = now - targetElapsed;
        pausedAtRef.current = now;
      }

      applyProgressToPaths(clamped);
    },
    [applyProgressToPaths]
  );

  /**
   * Set playback speed
   */
  /**
   * Set playback speed
   */
  const setSpeed = useCallback((multiplier: number) => {
    const newSpeed = Math.max(0.1, Math.min(10, multiplier));

    // Maintain current progress when changing speed
    if (stateRef.current === "playing" || stateRef.current === "looping") {
      if (startTimeRef.current !== null) {
        const now = performance.now();
        const elapsed = (now - startTimeRef.current) * speedRef.current;
        startTimeRef.current = now - elapsed / newSpeed;
      }
    }

    speedRef.current = newSpeed;
  }, []);

  /**
   * Export as SVG string
   */
  const exportSvg = useCallback(
    (options?: ExportSvgOptions): Promise<string> => {
      return new Promise((resolve) => {
        try {
          const root = rootRef.current;
          if (!root) {
            resolve("");
            return;
          }

          const svgEl =
            root instanceof SVGSVGElement
              ? root
              : root.ownerSVGElement || root.closest("svg");

          if (!svgEl) {
            resolve("");
            return;
          }

          const gWrapper = svgEl.querySelector(
            'g[data-signature-root="true"]'
          ) as SVGGElement | null;

          let viewBoxX = 0,
            viewBoxY = 0,
            viewBoxWidth = 800,
            viewBoxHeight = 200;

          try {
            const bbox = gWrapper ? gWrapper.getBBox() : svgEl.getBBox();
            const padding = 10;
            viewBoxX = bbox.x - padding;
            viewBoxY = bbox.y - padding;
            viewBoxWidth = bbox.width + padding * 2;
            viewBoxHeight = bbox.height + padding * 2;
          } catch (e) {
            const viewBox = svgEl.getAttribute("viewBox");
            if (viewBox) {
              const [x, y, width, height] = viewBox.split(" ").map(Number);
              viewBoxX = x;
              viewBoxY = y;
              viewBoxWidth = width;
              viewBoxHeight = height;
            }
          }

          const clone = svgEl.cloneNode(true) as SVGSVGElement;

          clone.removeAttribute("class");
          clone.removeAttribute("style");
          clone.setAttribute(
            "viewBox",
            `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
          );
          clone.setAttribute("width", String(viewBoxWidth));
          clone.setAttribute("height", String(viewBoxHeight));

          const defs = clone.querySelector("defs");
          if (defs) {
            defs.remove();
          }

          const cloneWrapper = clone.querySelector(
            'g[data-signature-root="true"]'
          );
          const paths = cloneWrapper
            ? cloneWrapper.querySelectorAll("path")
            : clone.querySelectorAll("path");

          if (cloneWrapper && paths.length > 0) {
            paths.forEach((path) => {
              clone.appendChild(path.cloneNode(true));
            });
            cloneWrapper.remove();
          }

          const finalPaths = clone.querySelectorAll("path");

          const pathRecordMap = new Map<string, PathRecord>();
          for (const record of pathsMapRef.current.values()) {
            if (record?.ref.current?.id) {
              pathRecordMap.set(record.id, record);
            }
          }

          finalPaths.forEach((path, _) => {
            const originalId = path.id;
            if (!originalId) return;

            const original = svgEl.querySelector(`path[id="${originalId}"]`);
            if (!original) return;
            const computedStyle = window.getComputedStyle(original);

            const pathRecord = pathRecordMap.get(originalId);

            path.setAttribute("stroke", computedStyle.stroke || "#000");
            path.setAttribute(
              "stroke-width",
              computedStyle.strokeWidth || "2.5"
            );
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");

            if (options?.animated && pathRecord) {
              const length = pathRecord.length;
              const dur = (pathRecord.duration / 1000).toFixed(2);
              const begin = (pathRecord.delay / 1000).toFixed(2);

              path.setAttribute("stroke-dasharray", `${length}`);
              path.setAttribute("stroke-dashoffset", `${length}`);

              const animate = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "animate"
              );
              animate.setAttribute("attributeName", "stroke-dashoffset");
              animate.setAttribute("from", `${length}`);
              animate.setAttribute("to", "0");
              animate.setAttribute("dur", `${dur}s`);
              animate.setAttribute("begin", `${begin}s`);
              animate.setAttribute("fill", "freeze");

              if (options?.loop) {
                animate.setAttribute("repeatCount", "indefinite");
              }

              path.appendChild(animate);
            } else {
              path.removeAttribute("stroke-dasharray");
              path.removeAttribute("stroke-dashoffset");
            }

            path.removeAttribute("style");
          });

          const serializer = new XMLSerializer();
          let svgString = serializer.serializeToString(clone);

          if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
            svgString = svgString.replace(
              "<svg",
              '<svg xmlns="http://www.w3.org/2000/svg"'
            );
          }

          resolve(svgString);
        } catch (err) {
          console.error("SVG export error:", err);
          resolve("");
        }
      });
    },
    []
  );

  /**
   * Export as PNG blob
   */
  const exportPng = useCallback(
    (scale = 2): Promise<Blob> => {
      return new Promise(async (resolve, reject) => {
        try {
          const wasPlaying =
            stateRef.current === "playing" || stateRef.current === "looping";
          const currentProgress = progressRef.current;

          if (wasPlaying) pause();
          seek(1);

          await new Promise((r) =>
            requestAnimationFrame(() => setTimeout(r, 50))
          );

          const root = rootRef.current;
          if (!root) {
            reject(new Error("No root element"));
            return;
          }

          const svgEl =
            root instanceof SVGSVGElement
              ? root
              : root.ownerSVGElement || root.closest("svg");

          if (!svgEl) {
            reject(new Error("No SVG element"));
            return;
          }

          const bbox = svgEl.getBBox();
          const viewBox = svgEl
            .getAttribute("viewBox")
            ?.split(" ")
            .map(Number) || [0, 0, bbox.width, bbox.height];
          const width = viewBox[2];
          const height = viewBox[3];

          const clone = svgEl.cloneNode(true) as SVGSVGElement;
          clone.setAttribute("width", String(width));
          clone.setAttribute("height", String(height));

          if (!clone.hasAttribute("xmlns")) {
            clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          }

          const paths = clone.querySelectorAll("path");
          const originalPaths = svgEl.querySelectorAll("path");

          paths.forEach((path, idx) => {
            const original = originalPaths[idx];
            if (original) {
              const computedStyle = window.getComputedStyle(original);
              path.setAttribute("stroke", computedStyle.stroke || "#000");
              path.setAttribute(
                "stroke-width",
                computedStyle.strokeWidth || "2"
              );
              path.setAttribute("fill", "none");
              path.setAttribute("stroke-linecap", "round");
              path.setAttribute("stroke-linejoin", "round");

              path.removeAttribute("stroke-dasharray");
              path.removeAttribute("stroke-dashoffset");
              path.removeAttribute("style");
            }
          });

          const svgString = new XMLSerializer().serializeToString(clone);
          const svgBlob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);

          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = width * scale;
              canvas.height = height * scale;

              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Canvas context failed"));
                URL.revokeObjectURL(url);
                return;
              }

              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);

                seek(currentProgress);
                if (wasPlaying) play();

                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("PNG export failed"));
                }
              }, "image/png");
            } catch (err) {
              URL.revokeObjectURL(url);
              seek(currentProgress);
              if (wasPlaying) play();
              reject(err);
            }
          };

          img.onerror = (e) => {
            console.error("Image load error:", e);
            URL.revokeObjectURL(url);
            seek(currentProgress);
            if (wasPlaying) play();
            reject(new Error("Image load failed"));
          };

          img.src = url;
        } catch (err) {
          console.error("PNG export error:", err);
          reject(err);
        }
      });
    },
    [pause, seek, play]
  );

  /**
   * Export as GIF
   */
  const exportGif = useCallback(
    async (options?: ExportGifOptions): Promise<Blob> => {
      const fps = options?.fps || 24;
      const quality = options?.quality || 10;
      const duration = options?.duration || durationTotalRef.current;

      return new Promise(async (resolve, reject) => {
        try {
          const root = rootRef.current;
          if (!root) {
            reject(new Error("No root element"));
            return;
          }

          const svgEl =
            root instanceof SVGSVGElement
              ? root
              : root.ownerSVGElement || root.closest("svg");

          if (!svgEl) {
            reject(new Error("No SVG element"));
            return;
          }

          const bbox = svgEl.getBBox();
          const viewBox = svgEl
            .getAttribute("viewBox")
            ?.split(" ")
            .map(Number) || [0, 0, bbox.width, bbox.height];
          const width = viewBox[2];
          const height = viewBox[3];

          const frameCount = Math.ceil((duration / 1000) * fps);
          const delay = Math.round(1000 / fps);

          // Pause current animation to capture clean frames
          const wasPlaying =
            stateRef.current === "playing" || stateRef.current === "looping";
          const currentProgress = progressRef.current;
          if (wasPlaying) pause();

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
          }

          const frames: ImageData[] = [];

          for (let i = 0; i <= frameCount; i++) {
            const progress = i / frameCount;
            seek(progress);

            await new Promise((r) =>
              requestAnimationFrame(() => setTimeout(r, 16))
            );

            const clone = svgEl.cloneNode(true) as SVGSVGElement;
            clone.setAttribute("width", String(width));
            clone.setAttribute("height", String(height));

            if (!clone.hasAttribute("xmlns")) {
              clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }

            const paths = clone.querySelectorAll("path");
            const originalPaths = svgEl.querySelectorAll("path");

            paths.forEach((path, idx) => {
              const original = originalPaths[idx];
              if (original) {
                const computedStyle = window.getComputedStyle(original);
                path.setAttribute("stroke", computedStyle.stroke || "#000");
                path.setAttribute(
                  "stroke-width",
                  computedStyle.strokeWidth || "2"
                );
                path.setAttribute("fill", "none");
                path.setAttribute("stroke-linecap", "round");
                path.setAttribute("stroke-linejoin", "round");

                const dashArray = computedStyle.strokeDasharray;
                const dashOffset = computedStyle.strokeDashoffset;

                if (dashArray && dashArray !== "none") {
                  path.setAttribute("stroke-dasharray", dashArray);
                }
                if (dashOffset && dashOffset !== "0px") {
                  path.setAttribute("stroke-dashoffset", dashOffset);
                }

                const transform = computedStyle.transform;
                if (transform && transform !== "none") {
                  path.setAttribute("transform", transform);
                }

                path.removeAttribute("style");
              }
            });

            const svgString = new XMLSerializer().serializeToString(clone);
            const svgBlob = new Blob([svgString], {
              type: "image/svg+xml;charset=utf-8",
            });
            const imageUrl = URL.createObjectURL(svgBlob);

            await new Promise<void>((resolveFrame, rejectFrame) => {
              const img = new Image();
              img.onload = () => {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                frames.push(ctx.getImageData(0, 0, width, height));
                URL.revokeObjectURL(imageUrl);
                resolveFrame();
              };
              img.onerror = () => {
                URL.revokeObjectURL(imageUrl);
                rejectFrame(new Error("Frame capture failed"));
              };
              img.src = imageUrl;
            });
          }

          // Restore animation state
          seek(currentProgress);
          if (wasPlaying) play();

          // Encode frames to GIF using quantization and LZW compression
          const gif = encodeGIF(frames, delay, width, height, quality);

          resolve(new Blob([new Uint8Array(gif)], { type: "image/gif" }));
        } catch (err) {
          console.error("GIF export error:", err);
          reject(err);
        }
      });
    },
    [exportPng, pause, play, seek]
  );

  /**
   * GIF Encoder - Creates animated GIF from ImageData frames
   * Implements GIF89a specification with LZW compression
   */
  function encodeGIF(
    frames: ImageData[],
    delay: number,
    width: number,
    height: number,
    quality: number
  ): Uint8Array {
    // GIF Header
    const header = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // "GIF89a"

    // Logical Screen Descriptor
    const lsd = new Uint8Array(7);
    lsd[0] = width & 0xff;
    lsd[1] = (width >> 8) & 0xff;
    lsd[2] = height & 0xff;
    lsd[3] = (height >> 8) & 0xff;
    lsd[4] = 0xf7; // Global color table flag, color resolution, sorted flag, size
    lsd[5] = 0x00; // Background color index
    lsd[6] = 0x00; // Pixel aspect ratio

    // Build global color table (256 colors)
    const colorTable = buildColorTable(frames, quality);

    // Netscape Application Extension for looping
    const netscape = new Uint8Array([
      0x21,
      0xff,
      0x0b, // Extension introducer, application extension label, block size
      0x4e,
      0x45,
      0x54,
      0x53,
      0x43,
      0x41,
      0x50,
      0x45,
      0x32,
      0x2e,
      0x30, // "NETSCAPE2.0"
      0x03,
      0x01,
      0x00,
      0x00,
      0x00, // Sub-block: loop forever
    ]);

    // Encode each frame
    const encodedFrames: Uint8Array[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameData = encodeFrame(frame, colorTable, delay, width, height);
      encodedFrames.push(frameData);
    }

    // GIF Trailer
    const trailer = new Uint8Array([0x3b]);

    // Combine all parts
    const totalLength =
      header.length +
      lsd.length +
      colorTable.length +
      netscape.length +
      encodedFrames.reduce((sum, f) => sum + f.length, 0) +
      trailer.length;

    const gif = new Uint8Array(totalLength);
    let offset = 0;

    gif.set(header, offset);
    offset += header.length;
    gif.set(lsd, offset);
    offset += lsd.length;
    gif.set(colorTable, offset);
    offset += colorTable.length;
    gif.set(netscape, offset);
    offset += netscape.length;

    for (const frameData of encodedFrames) {
      gif.set(frameData, offset);
      offset += frameData.length;
    }

    gif.set(trailer, offset);

    return gif;
  }

  /**
   * Build optimized color table from frames using median cut quantization
   */
  function buildColorTable(frames: ImageData[], quality: number): Uint8Array {
    const colors = new Set<number>();
    const samples = Math.max(1, Math.floor(10 / quality)); // Sample every nth pixel based on quality

    // Sample colors from all frames
    for (const frame of frames) {
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4 * samples) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 128) {
          // Only non-transparent pixels
          colors.add((r << 16) | (g << 8) | b);
        }
      }
    }

    // Convert to array and quantize to 256 colors if needed
    let palette = Array.from(colors);
    if (palette.length > 256) {
      palette = quantizeColors(palette, 256);
    }

    // Pad to 256 colors
    while (palette.length < 256) {
      palette.push(0);
    }

    // Convert to RGB byte array
    const table = new Uint8Array(768); // 256 colors * 3 bytes
    for (let i = 0; i < 256; i++) {
      const color = palette[i];
      table[i * 3] = (color >> 16) & 0xff; // R
      table[i * 3 + 1] = (color >> 8) & 0xff; // G
      table[i * 3 + 2] = color & 0xff; // B
    }

    return table;
  }

  /**
   * Simple median cut color quantization
   */
  function quantizeColors(colors: number[], maxColors: number): number[] {
    if (colors.length <= maxColors) return colors;

    // Sort by most significant color component
    colors.sort((a, b) => {
      const aR = (a >> 16) & 0xff,
        aG = (a >> 8) & 0xff,
        aB = a & 0xff;
      const bR = (b >> 16) & 0xff,
        bG = (b >> 8) & 0xff,
        bB = b & 0xff;
      return aR + aG + aB - (bR + bG + bB);
    });

    // Take evenly spaced samples
    const result: number[] = [];
    const step = colors.length / maxColors;
    for (let i = 0; i < maxColors; i++) {
      result.push(colors[Math.floor(i * step)]);
    }

    return result;
  }

  /**
   * Encode a single frame with Graphics Control Extension and Image Descriptor
   */
  function encodeFrame(
    frame: ImageData,
    colorTable: Uint8Array,
    delay: number,
    width: number,
    height: number
  ): Uint8Array {
    // Graphics Control Extension
    const gce = new Uint8Array([
      0x21,
      0xf9,
      0x04, // Extension introducer, graphic control label, block size
      0x08, // Disposal method: restore to background
      delay & 0xff,
      (delay >> 8) & 0xff, // Delay time in 1/100 seconds
      0x00, // Transparent color index (none)
      0x00, // Block terminator
    ]);

    // Image Descriptor
    const descriptor = new Uint8Array([
      0x2c, // Image separator
      0x00,
      0x00,
      0x00,
      0x00, // Left, top position
      width & 0xff,
      (width >> 8) & 0xff, // Width
      height & 0xff,
      (height >> 8) & 0xff, // Height
      0x00, // No local color table
    ]);

    // Convert ImageData to indexed color
    const indexed = convertToIndexed(frame, colorTable);

    // LZW compress the indexed data
    const compressed = lzwEncode(indexed, 8);

    // Combine frame parts
    const frameSize = gce.length + descriptor.length + compressed.length;
    const result = new Uint8Array(frameSize);
    let offset = 0;

    result.set(gce, offset);
    offset += gce.length;
    result.set(descriptor, offset);
    offset += descriptor.length;
    result.set(compressed, offset);

    return result;
  }

  /**
   * Convert RGBA ImageData to indexed color
   */
  function convertToIndexed(
    frame: ImageData,
    colorTable: Uint8Array
  ): Uint8Array {
    const indexed = new Uint8Array(frame.width * frame.height);
    const data = frame.data;

    for (let i = 0; i < indexed.length; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const a = data[i * 4 + 3];

      if (a < 128) {
        indexed[i] = 0; // Transparent
      } else {
        // Find nearest color in palette
        indexed[i] = findNearestColor(r, g, b, colorTable);
      }
    }

    return indexed;
  }

  /**
   * Find nearest color in palette using Euclidean distance
   */
  function findNearestColor(
    r: number,
    g: number,
    b: number,
    colorTable: Uint8Array
  ): number {
    let minDist = Infinity;
    let nearest = 0;

    for (let i = 0; i < 256; i++) {
      const pr = colorTable[i * 3];
      const pg = colorTable[i * 3 + 1];
      const pb = colorTable[i * 3 + 2];

      const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }

    return nearest;
  }

  /**
   * LZW compression for GIF
   */
  function lzwEncode(data: Uint8Array, minCodeSize: number): Uint8Array {
    const output: number[] = [];
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = endCode + 1;

    // Initialize dictionary
    const dict = new Map<string, number>();
    for (let i = 0; i < clearCode; i++) {
      dict.set(String.fromCharCode(i), i);
    }

    output.push(clearCode);

    let buffer = "";
    for (let i = 0; i < data.length; i++) {
      const char = String.fromCharCode(data[i]);
      const combined = buffer + char;

      if (dict.has(combined)) {
        buffer = combined;
      } else {
        output.push(dict.get(buffer)!);

        if (nextCode < 4096) {
          dict.set(combined, nextCode++);

          if (nextCode >= 1 << codeSize && codeSize < 12) {
            codeSize++;
          }
        }

        buffer = char;
      }
    }

    if (buffer) {
      output.push(dict.get(buffer)!);
    }

    output.push(endCode);

    // Pack codes into bytes
    return packLZW(output, minCodeSize);
  }

  /**
   * Pack LZW codes into byte stream
   */
  function packLZW(codes: number[], minCodeSize: number): Uint8Array {
    const result: number[] = [];
    result.push(minCodeSize); // LZW minimum code size

    let bitBuffer = 0;
    let bitCount = 0;
    let codeSize = minCodeSize + 1;
    const blockData: number[] = [];

    for (const code of codes) {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;

      while (bitCount >= 8) {
        blockData.push(bitBuffer & 0xff);
        bitBuffer >>= 8;
        bitCount -= 8;

        if (blockData.length === 255) {
          result.push(blockData.length);
          result.push(...blockData);
          blockData.length = 0;
        }
      }

      // Adjust code size
      if (code === 1 << minCodeSize) {
        // Clear code
        codeSize = minCodeSize + 1;
      } else if (code >= (1 << codeSize) - 1 && codeSize < 12) {
        codeSize++;
      }
    }

    // Flush remaining bits
    if (bitCount > 0) {
      blockData.push(bitBuffer & 0xff);
    }

    // Write final block
    if (blockData.length > 0) {
      result.push(blockData.length);
      result.push(...blockData);
    }

    result.push(0); // Block terminator

    return new Uint8Array(result);
  }

  /**
   * Get controller interface
   */
  const getController = useCallback(
    (): SignatureController => ({
      play,
      pause,
      toggle,
      reset,
      seek,
      setSpeed,
      get duration() {
        return durationTotalRef;
      },
      get progress() {
        return progressRef;
      },
      get state() {
        return animationState;
      },
      get isPlaying() {
        return animationState === "playing" || animationState === "looping";
      },
      get isPaused() {
        return animationState === "paused";
      },
      get isCompleted() {
        return animationState === "completed";
      },
      get isLooping() {
        return animationState === "looping";
      },
      exportSvg,
      exportPng,
      exportGif,
    }),
    [
      play,
      pause,
      toggle,
      reset,
      seek,
      setSpeed,
      exportSvg,
      exportPng,
      exportGif,
      animationState,
    ]
  );

  useViewportAutoPlay(containerRef, getController(), viewportAutoPlay);

  // Static mode: render final state immediately
  useIsoLayoutEffect(() => {
    if (staticProp) {
      // Set all paths to 100% complete
      progressRef.current = 1;
      applyProgressToPaths(1);
      updateState("completed");
    }
  }, [staticProp, applyProgressToPaths, updateState]);

  // Auto-play (skip if static mode OR viewport autoplay is enabled)
  useEffect(() => {
    if (config.autoPlay && !staticProp && !viewportAutoPlay?.enabled) {
      play();
    }
  }, [config.autoPlay, staticProp, viewportAutoPlay?.enabled, play]);

  const contextValue = useMemo<SignatureContextValue>(
    () => ({
      registerPath,
      unregisterPath,
      getController,
      getPathRecord,
      updatePathVisual,
      rootRef,
      config,
      progress: progressRef,
      state: animationState,
      isPlaying: animationState === "playing" || animationState === "looping",
      duration: durationTotalRef,
      seek,
      seekSliderId,
      currentTimeId,
      durationId,
    }),
    [
      registerPath,
      unregisterPath,
      getController,
      getPathRecord,
      updatePathVisual,
      config,
      seek,
      seekSliderId,
      currentTimeId,
      durationId,
      animationState,
    ]
  );

  const renderedChildren =
    typeof children === "function" ? children(getController()) : children;

  return (
    <SignatureContext.Provider value={contextValue}>
      <div ref={containerRef}>{renderedChildren}</div>
    </SignatureContext.Provider>
  );
};

SignatureRoot.displayName = "SignatureRoot";

/* ===========================
       SIGNATURE CANVAS
       =========================== */

export const SignatureCanvas = forwardRef<SVGSVGElement, SignatureCanvasProps>(
  (props, forwardedRef) => {
    const {
      children,
      viewBox,
      preserveAspectRatio,
      className,
      backgroundImage,
      backgroundOpacity = 0.3,
      ...rest
    } = props;
    const ctx = useSignatureContext();

    const svgRef = useRef<SVGSVGElement>(null);
    const composedRefs = useComposedRefs(svgRef, ctx.rootRef, forwardedRef);

    return (
      <svg
        ref={composedRefs}
        viewBox={viewBox || "0 0 800 200"}
        preserveAspectRatio={preserveAspectRatio || "xMidYMid meet"}
        className={className}
        {...rest}
      >
        {backgroundImage && (
          <defs>
            <pattern
              id="signature-bg-texture"
              patternUnits="userSpaceOnUse"
              width="100%"
              height="100%"
            >
              <image
                href={backgroundImage}
                width="100%"
                height="100%"
                opacity={backgroundOpacity}
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          </defs>
        )}
        {backgroundImage && (
          <rect width="100%" height="100%" fill="url(#signature-bg-texture)" />
        )}
        <g data-signature-root="true">{children}</g>
      </svg>
    );
  }
);

SignatureCanvas.displayName = "SignatureCanvas";

/* ===========================
       SIGNATURE DEFS
       =========================== */

export interface SignatureDefsProps {
  includeRoughen?: boolean;
  idPrefix?: string;
  roughness?: number; // Roughness intensity (0-1)
}

export const SignatureDefs: React.FC<SignatureDefsProps> = ({
  includeRoughen = true,
  idPrefix = "sig",
  roughness = 0.6,
}) => {
  if (!includeRoughen) return null;

  return (
    <defs>
      <filter
        id={`${idPrefix}-rough`}
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves={1}
          seed={42}
          stitchTiles="stitch"
        />
        <feDisplacementMap
          in="SourceGraphic"
          scale={roughness}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  );
};

SignatureDefs.displayName = "SignatureDefs";

/* ===========================
       SIGNATURE PATH
       =========================== */

let pathIdCounter = 0;

export const SignaturePath = forwardRef<SVGPathElement, SignaturePathProps>(
  (props, forwardedRef) => {
    const {
      d,
      src,
      color,
      strokeWidth,
      duration,
      delay = 0,
      jitter,
      easing,
      pathId,

      onDrawStart,
      onDrawFrame,
      onDrawComplete,
      className,
      ...rest
    } = props;
    const isClient = useClientOnly();
    const ctx = useSignatureContext();

    const localId = useMemo(() => {
      pathIdCounter += 1;
      return pathId || `sig_path_${pathIdCounter}`;
    }, [pathId]);

    const pathRef = useRef<SVGPathElement>(null);
    const composedRefs = useComposedRefs(pathRef, forwardedRef);

    // Load external SVG source
    useIsoLayoutEffect(() => {
      let isMounted = true;

      if (src && !d) {
        const handleSrc = (text: string) => {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "image/svg+xml");
            const pathEl = doc.querySelector("path");

            if (pathEl && pathRef.current && isMounted) {
              const dval = pathEl.getAttribute("d") || "";
              pathRef.current.setAttribute("d", dval);
            }
          } catch (err) {
            // Ignore
          }
        };

        if (src.trim().startsWith("<")) {
          handleSrc(src);
        } else {
          fetch(src)
            .then((r) => r.text())
            .then((t) => {
              if (isMounted) handleSrc(t);
            })
            .catch(() => {});
        }
      }

      return () => {
        isMounted = false;
      };
    }, [src, d]);

    const registryEntry = useMemo<PathRecord>(
      () => ({
        id: localId,
        ref: pathRef,
        length: 0,
        duration: duration ?? ctx.config.duration,
        delay: delay || 0,
        color,
        strokeWidth,
        jitter: jitter === undefined ? ctx.config.jitter : jitter,
        easing:
          easing === "inherit" || easing === undefined
            ? ctx.config.easing
            : typeof easing === "function"
            ? easing
            : normalizeEasing(easing),

        onDrawStart,
        onDrawFrame,
        onDrawComplete,
        progress: 0,
        hasStarted: false,
        hasCompleted: false,
        isPlaying: false,
        isPaused: false,
        dOriginal: d || null,
      }),
      [
        localId,
        ctx.config.duration,
        ctx.config.jitter,
        ctx.config.easing,

        duration,
        delay,
        color,
        strokeWidth,
        jitter,
        easing,
        onDrawStart,
        onDrawFrame,
        onDrawComplete,
        d,
      ]
    );

    // Register with root
    useIsoLayoutEffect(() => {
      const record = registryEntry;
      record.dOriginal = d || record.dOriginal;

      // Measure path and initialize
      if (pathRef.current) {
        try {
          const total = pathRef.current.getTotalLength();
          record.length = total;

          // Initialize dash styles
          pathRef.current.style.strokeDasharray = `${total} ${total}`;
          pathRef.current.style.strokeDashoffset = `${total}`;

          if (record.color) pathRef.current.style.stroke = record.color;

          if (record.strokeWidth !== undefined) {
            pathRef.current.style.strokeWidth = `${record.strokeWidth}`;
          }

          record.dOriginal =
            pathRef.current.getAttribute("d") || record.dOriginal;
        } catch (e) {
          // Ignore measurement errors
        }
      }

      const id = ctx.registerPath(record);

      return () => {
        ctx.unregisterPath(id);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d]);

    return (
      <path
        ref={composedRefs}
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...rest}
        {...(isClient ? { id: localId } : {})}
      />
    );
  }
);

SignaturePath.displayName = "SignaturePath";

/* ===========================
       PUBLIC HOOKS
       =========================== */

/**
 * Access root animation controller
 */
export function useSignature(): SignatureController {
  const ctx = useSignatureContext();
  return ctx.getController();
}

/**
 * Access per-path controller with optimized updates.
 * Uses global RAF singleton instead of per-hook RAF loops.
 */
export function useSignaturePath(
  pathId?: string
): SignaturePathController | null {
  const ctx = useSignatureContext();
  const [, forceUpdate] = useState(0);

  // Subscribe to global RAF for updates when path is active
  useRAF(() => {
    forceUpdate((n) => n + 1);
  }, !!pathId && !!ctx.getPathRecord(pathId));

  if (!pathId) return null;

  const record = ctx.getPathRecord(pathId);
  if (!record) return null;

  return {
    id: record.id,
    progress: record.progress,
    length: record.length,
    play() {
      record.isPlaying = true;
      record.isPaused = false;
      // Trigger root animation if not already playing
      if (!ctx.isPlaying) {
        ctx.getController().play();
      }
    },
    pause() {
      record.isPaused = true;
      record.isPlaying = false;
    },
    reset() {
      record.progress = 0;
      record.hasStarted = false;
      record.hasCompleted = false;
      record.isPlaying = false;
      record.isPaused = false;
      ctx.updatePathVisual(record);
    },
    seek(progress: number) {
      const clamped = Math.max(0, Math.min(1, progress));
      record.progress = clamped;
      ctx.updatePathVisual(record);
    },
  };
}

/* ===========================
       SIGNATURE CONTROLS
       =========================== */

/**
 * Format milliseconds to MM:SS
 */
function formatTime(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${mm}:${ss < 10 ? "0" : ""}${ss}`;
}

// ------------------------------
// Seek Context
// ------------------------------
const SeekContext = React.createContext<{
  _progressRef: React.RefObject<HTMLDivElement | null>;
  _thumbRef: React.RefObject<HTMLDivElement | null>;
  _trackRef: React.RefObject<HTMLDivElement | null>;
  _currentTimeRef: React.RefObject<HTMLSpanElement | null>;
} | null>(null);

const useSeekContext = () => {
  const ctx = React.useContext(SeekContext);
  if (!ctx) throw new Error("Seek components must be used within <Seek.Root>");
  return ctx;
};

export const SignatureControls = {
  /**
   * Root container for controls
   */
  Root: memo(
    ({
      children,
      ...props
    }: React.PropsWithChildren<React.ComponentProps<"div">>) => {
      return <div {...props}>{children}</div>;
    }
  ),

  /**
   * Play/Pause button
   */
  PlayPause: memo(
    forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
      (props, ref) => {
        const { asChild, children, className, ...rest } = props;
        const controller = useSignature();

        return (
          <Button
            ref={ref}
            onClick={controller.toggle}
            aria-pressed={controller.isPlaying}
            className={cn("", className)}
            {...rest}
          >
            {asChild ? children : controller.isPlaying ? "Pause" : "Play"}
          </Button>
        );
      }
    )
  ),

  /**
   * Speed control with render prop pattern
   */
  Speed: memo(
    forwardRef<
      HTMLDivElement,
      {
        render?: (props: {
          speed: number;
          setSpeed: (v: number) => void;
        }) => React.ReactElement;
        className?: string;
      }
    >((props, ref) => {
      const { render, className } = props;
      const controller = useSignature();
      const [speed, setSpeedState] = useState(1);

      const setSpeed = useStableHandler((value: number) => {
        setSpeedState(value);
        controller.setSpeed(value);
      });

      if (render) return render({ speed, setSpeed });

      return (
        <div ref={ref} className={cn("flex flex-col gap-1", className)}>
          <label className="text-sm font-medium">
            Speed: {speed.toFixed(2)}x
          </label>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={speed}
            onChange={(e) => {
              const value = Number(e.target.value || 1);
              setSpeed(value);
            }}
            className="w-full bg-primary rounded-3xl"
            style={{
              background: `linear-gradient(
                to right,
                var(--accent-primary) ${((speed - 0.25) / (2 - 0.25)) * 100}%,
                #d1d5dc 0
              )`,
            }}
          />
        </div>
      );
    })
  ),

  /**
   * Seek/scrubber subsystem
   */
  Seek: {
    /**
     * Seek container
     */
    Root: memo((props: React.PropsWithChildren) => {
      const { children } = props;
      const _progressRef = useRef<HTMLDivElement>(null);
      const _thumbRef = useRef<HTMLDivElement>(null);
      const _trackRef = useRef<HTMLDivElement>(null);
      const _currentTimeRef = useRef<HTMLSpanElement>(null);

      return (
        <SeekContext.Provider
          value={{ _progressRef, _thumbRef, _trackRef, _currentTimeRef }}
        >
          {children}
        </SeekContext.Provider>
      );
    }),

    /**
     * Seek track with full interaction
     */
    /**
     * Seek track with full interaction
     */
    Track: memo(
      forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
        (props, forwardedRef) => {
          /**
           * Progress slider track
           */
          const { children, className, ...rest } = props;
          const isClient = useClientOnly();
          const ctx = useSignatureContext();
          const { _progressRef, _thumbRef, _trackRef, _currentTimeRef } =
            useSeekContext();

          const trackRef = useRef<HTMLDivElement>(null);
          const composedRefs = useComposedRefs(
            trackRef,
            _trackRef,
            forwardedRef
          );

          const [isDragging, setIsDragging] = React.useState(false);
          const isDraggingRef = useRef(false);
          const visualUpdateRef = useRef<number>(0);
          const stableOnSeek = useStableHandler(ctx.seek);

          /**
           * Update visual elements directly (progress bar, thumb, time display)
           */
          const updateVisualElements = useStableHandler((progress: number) => {
            const clamped = Math.max(0, Math.min(1, progress));
            const duration = ctx.duration.current;

            // Update progress bar
            if (_progressRef.current) {
              _progressRef.current.style.transform = `scaleX(${clamped})`;
            }

            // Update thumb position
            if (_thumbRef.current && trackRef.current) {
              const track = trackRef.current;
              const thumb = _thumbRef.current;
              const barWidth = track.offsetWidth;
              const thumbWidth = thumb.offsetWidth;
              const x = clamped * barWidth - thumbWidth / 2;
              thumb.style.transform = `translate3d(${x}px, -50%, 0)`;
            }

            // Update time display
            if (_currentTimeRef?.current) {
              const currentTimeMs = clamped * duration;
              _currentTimeRef.current.textContent = formatTime(currentTimeMs);
            }

            // Update aria attributes
            if (trackRef.current) {
              const ariaValueNow = Math.round(clamped * 100);
              const currentTimeMs = clamped * duration;
              const ariaValueText = `${formatTime(
                currentTimeMs
              )} of ${formatTime(duration)}`;
              trackRef.current.setAttribute(
                "aria-valuenow",
                ariaValueNow.toString()
              );
              trackRef.current.setAttribute("aria-valuetext", ariaValueText);
            }
          });

          /**
           * Schedule visual update on next frame (used during dragging)
           */
          const scheduleVisualUpdate = useStableHandler((progress: number) => {
            if (visualUpdateRef.current) {
              cancelAnimationFrame(visualUpdateRef.current);
            }

            visualUpdateRef.current = requestAnimationFrame(() => {
              updateVisualElements(progress);
            });
          });

          /**
           * Get progress from pointer position
           */
          const getProgressFromPosition = useCallback(
            (clientX: number): number => {
              const track = trackRef.current;
              if (!track) return 0;

              const rect = track.getBoundingClientRect();
              const ratio = Math.max(
                0,
                Math.min(1, (clientX - rect.left) / rect.width)
              );

              return ratio;
            },
            []
          );

          /**
           * Handle keyboard navigation
           */
          const handleKeyDown = useStableHandler((e: React.KeyboardEvent) => {
            const duration = ctx.duration.current;
            const progress = ctx.progress.current;

            const currentTimeMs = progress * duration;
            let newTimeMs = currentTimeMs;

            // Dynamic step sizes based on duration
            // Small step: 2% of duration
            // Large step: 5% of duration
            const smallStep = duration * 0.02;
            const largeStep = duration * 0.05;

            switch (e.key) {
              case "ArrowRight":
              case "ArrowUp":
                e.preventDefault();
                newTimeMs = Math.min(duration, currentTimeMs + smallStep);
                break;
              case "ArrowLeft":
              case "ArrowDown":
                e.preventDefault();
                newTimeMs = Math.max(0, currentTimeMs - smallStep);
                break;
              case "PageUp":
                e.preventDefault();
                newTimeMs = Math.min(duration, currentTimeMs + largeStep);
                break;
              case "PageDown":
                e.preventDefault();
                newTimeMs = Math.max(0, currentTimeMs - largeStep);
                break;
              case "Home":
                e.preventDefault();
                newTimeMs = 0;
                break;
              case "End":
                e.preventDefault();
                newTimeMs = duration;
                break;
              case " ":
              case "Enter":
                e.preventDefault();
                ctx.getController().toggle();
                return;
              default:
                return;
            }

            const newProgress = newTimeMs / duration;
            stableOnSeek(newProgress);
            updateVisualElements(newProgress);
          });

          const handlePointerDown = useCallback(
            (e: React.PointerEvent) => {
              e.stopPropagation();

              const track = trackRef.current;
              if (!track) return;

              isDraggingRef.current = true;
              setIsDragging(true);

              track.setPointerCapture(e.pointerId);

              const progress = getProgressFromPosition(e.clientX);

              scheduleVisualUpdate(progress);
              stableOnSeek(progress);
            },
            [getProgressFromPosition, scheduleVisualUpdate, stableOnSeek]
          );

          useEffect(() => {
            const handlePointerMove = (e: PointerEvent) => {
              if (!isDraggingRef.current) return;

              e.stopPropagation();

              const progress = getProgressFromPosition(e.clientX);

              scheduleVisualUpdate(progress);

              stableOnSeek(progress);
            };

            const handlePointerUp = (e: PointerEvent) => {
              if (!isDraggingRef.current) return;

              const track = trackRef.current;
              if (!track) return;

              track.releasePointerCapture(e.pointerId);

              isDraggingRef.current = false;
              setIsDragging(false);
            };

            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
            document.addEventListener("pointercancel", handlePointerUp);

            return () => {
              document.removeEventListener("pointermove", handlePointerMove);
              document.removeEventListener("pointerup", handlePointerUp);
              document.removeEventListener("pointercancel", handlePointerUp);
            };
          }, [getProgressFromPosition, scheduleVisualUpdate, stableOnSeek]);

          /**
           * Cleanup scheduled visual updates on unmount
           */
          useEffect(() => {
            return () => {
              if (visualUpdateRef.current) {
                cancelAnimationFrame(visualUpdateRef.current);
              }
            };
          }, []);

          useIsoLayoutEffect(() => {
            if (!ctx.isPlaying && !isDragging) {
              updateVisualElements(ctx.progress.current);
            }
          }, [ctx.isPlaying, isDragging, isClient, updateVisualElements]);

          const duration = ctx.duration.current;
          const progress = ctx.progress.current;

          const ariaValueNow = Math.round(progress * 100);
          const ariaValueText = `${formatTime(
            progress * duration
          )} of ${formatTime(duration)}`;

          if (!isClient) {
            return (
              <div
                aria-hidden="true"
                className={cn(
                  "relative w-full h-1.5 bg-surface-tertiary rounded-full",
                  className
                )}
                {...rest}
              >
                {/* Skeleton Progress */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-surface-secondary rounded-full origin-left animate-pulse scale-x-[0.3] pointer-events-none"
                />

                {/* Skeleton Thumb */}
                <div
                  role="presentation"
                  aria-hidden="true"
                  className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-surface-secondary shadow-lg pointer-events-none animate-pulse transform-[translate3d(30%,_-50%,_0)]"
                />
              </div>
            );
          }

          return (
            <HitArea buffer={10} variant="y">
              <div
                ref={composedRefs}
                role="slider"
                id={ctx.seekSliderId}
                aria-label="Seek signature"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={ariaValueNow}
                aria-valuetext={ariaValueText}
                aria-describedby={`${ctx.currentTimeId} ${ctx.durationId}`}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                className={cn(
                  "relative w-full h-1.5 bg-gray-300 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  className
                )}
                style={{
                  touchAction: "none",
                  ...rest.style,
                }}
                onPointerDown={handlePointerDown}
                {...rest}
              >
                {children}
              </div>
            </HitArea>
          );
        }
      )
    ),

    /**
     * Progress indicator
     */
    Progress: memo(
      forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
        (props, forwardedRef) => {
          const { className, style, ...rest } = props;
          const ctx = useSignatureContext();
          const { _progressRef } = useSeekContext();

          const progressRef = useRef<HTMLDivElement>(null);
          const composedRefs = useComposedRefs(
            progressRef,
            _progressRef,
            forwardedRef
          );

          useRAF(() => {
            const el = progressRef.current;
            if (el) {
              el.style.transform = `scaleX(${ctx.progress.current})`;
            }
          }, ctx.state === "playing");

          return (
            <div
              ref={composedRefs}
              aria-hidden="true"
              className={cn(
                "absolute inset-0 bg-primary rounded-full origin-left will-change-transform pointer-events-none",
                className
              )}
              style={style}
              {...rest}
            />
          );
        }
      )
    ),

    /**
     * Draggable thumb
     */
    Thumb: memo(
      forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
        (props, forwardedRef) => {
          const { className, style, ...rest } = props;
          const ctx = useSignatureContext();
          const { _thumbRef, _trackRef } = useSeekContext();

          const thumbRef = useRef<HTMLDivElement>(null);
          const composedRefs = useComposedRefs(
            thumbRef,
            _thumbRef,
            forwardedRef
          );

          useRAF(() => {
            const thumb = thumbRef.current;
            if (!thumb) return;
            const progress = ctx.progress.current;

            const track = _trackRef.current;
            if (track) {
              const barWidth = track.offsetWidth;
              const thumbWidth = thumb.offsetWidth;
              const x = progress * barWidth - thumbWidth / 2;
              thumb.style.transform = `translate3d(${x}px, -50%, 0)`;
            } else {
              thumb.style.left = `${progress * 100}%`;
              thumb.style.transform = `translate3d(-50%, -50%, 0)`;
            }
          }, ctx.state === "playing");

          return (
            <HitArea buffer={8} variant="all">
              <div
                ref={composedRefs}
                role="presentation"
                aria-hidden="true"
                className={cn(
                  "absolute top-1/2 left-0 w-3 h-3 rounded-full bg-primary shadow-lg pointer-events-none will-change-transform",
                  className
                )}
                style={style}
                {...rest}
              />
            </HitArea>
          );
        }
      )
    ),

    /**
     * Time display with RAF updates
     */
    TimeDisplay: memo(
      forwardRef<
        HTMLSpanElement,
        {
          className?: string;
          format?: (progress: number, duration: number) => string;
          render?: (props: {
            current: string;
            duration: string;
          }) => React.ReactElement;
        }
      >((props, forwardedRef) => {
        /**
         * Time display with RAF updates
         */
        const { className, format, render } = props;
        const ctx = useSignatureContext();
        const { _currentTimeRef } = useSeekContext();

        const currentTimeRef = useRef<HTMLSpanElement>(null);
        const composedRefs = useComposedRefs(
          currentTimeRef,
          _currentTimeRef,
          forwardedRef
        );

        const defaultFormat = useCallback(
          (p: number, d: number) => formatTime(p * d),
          []
        );

        useRAF(() => {
          const duration = ctx.duration.current;
          const progress = ctx.progress.current;
          if (currentTimeRef.current) {
            const text = (format || defaultFormat)(progress, duration);
            currentTimeRef.current.textContent = text;
          }
        }, ctx.state === "playing");

        const duration = ctx.duration.current;
        const progress = ctx.progress.current;

        const currentString = (format || defaultFormat)(progress, duration);
        const durationString = formatTime(duration);

        if (render) {
          return render({
            current: currentString,
            duration: durationString,
          });
        }

        return (
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              className
            )}
            role="timer"
            aria-live="off"
          >
            <span
              ref={composedRefs}
              id={ctx.currentTimeId}
              aria-label="Current time"
            >
              0:00
            </span>
            <span className="opacity-50" aria-hidden="true">
              /
            </span>
            <span id={ctx.durationId} aria-label="Duration">
              {durationString}
            </span>
          </span>
        );
      })
    ),
  },

  /**
   * Download/export controls
   */
  Download: {
    /**
     * Download container
     */
    Root: memo((props: React.PropsWithChildren) => {
      const { children } = props;
      return <>{children}</>;
    }),

    /**
     * Download button with asChild support via Radix Slot
     */
    Button: memo(
      forwardRef<
        HTMLButtonElement,
        {
          format?: "svg" | "png" | "gif";
        } & React.ComponentProps<typeof Button> & {
            downloadOptions?: ExportSvgOptions;
          }
      >((props, forwardedRef) => {
        const {
          className,
          format = "svg",
          children,
          downloadOptions,
          ...rest
        } = props;

        const controller = useSignature();

        const handleDownload = async () => {
          try {
            if (format === "svg") {
              const svgString = await controller.exportSvg(downloadOptions);
              const blob = new Blob([svgString], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "signature.svg";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              return;
            }

            if (format === "png") {
              const blob = await controller.exportPng(2);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "signature.png";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              return;
            }

            if (format === "gif") {
              const blob = await controller.exportGif();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "signature.gif";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              return;
            }
          } catch (err) {
            console.error("Export failed:", err);
          }
        };

        return (
          <Button
            ref={forwardedRef}
            onClick={handleDownload}
            className={cn("", className)}
            {...rest}
          >
            {children || `Download ${format.toUpperCase()}`}
          </Button>
        );
      })
    ),

    /**
     * Download menu
     */
    Menu: memo(
      ({
        render,
      }: {
        render: (actions: {
          onSvg: (options?: ExportSvgOptions) => void;
          onPng: (scale: ExportPngScale) => void;
          onGif: () => void;
        }) => React.ReactNode;
      }) => {
        const controller = useSignature();

        const onSvg = async (options?: ExportSvgOptions) => {
          try {
            const svgString = await controller.exportSvg(
              options || { animated: true }
            );
            const blob = new Blob([svgString], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "signature.svg";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error("SVG export failed:", err);
          }
        };

        const onPng = async (scale?: ExportPngScale) => {
          try {
            const blob = await controller.exportPng(scale || 2);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "signature@2x.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error("PNG export failed:", err);
          }
        };

        const onGif = async (options?: ExportGifOptions) => {
          try {
            const blob = await controller.exportGif(options);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "signature.gif";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error("GIF export failed:", err);
          }
        };

        return render({
          onSvg,
          onPng,
          onGif,
        });
      }
    ),
  },
};

SignatureControls.Root.displayName = "SignatureControls.Root";
SignatureControls.PlayPause.displayName = "SignatureControls.PlayPause";
SignatureControls.Speed.displayName = "SignatureControls.Speed";
SignatureControls.Seek.Root.displayName = "SignatureControls.Seek.Root";
SignatureControls.Seek.Track.displayName = "SignatureControls.Seek.Track";
SignatureControls.Seek.Progress.displayName = "SignatureControls.Seek.Progress";
SignatureControls.Seek.Thumb.displayName = "SignatureControls.Seek.Thumb";
SignatureControls.Seek.TimeDisplay.displayName =
  "SignatureControls.Seek.TimeDisplay";
SignatureControls.Download.Root.displayName = "SignatureControls.Download.Root";
SignatureControls.Download.Button.displayName =
  "SignatureControls.Download.Button";
SignatureControls.Download.Menu.displayName = "SignatureControls.Download.Menu";

/* ===========================
       DEFAULT EXPORT
       =========================== */

export default {
  SignatureRoot,
  SignatureCanvas,
  SignatureDefs,
  SignaturePath,
  SignatureControls,
  useSignature,
  useSignaturePath,
  easeInOutQuad,
  easeOutElastic,
};
