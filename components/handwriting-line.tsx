"use client";

import React, { useRef, useState, ReactNode, useCallback } from "react";
import {
  HandwritingText,
  HandwritingTextProps,
} from "@/components/handwriting-text";
import { AnimatedNotebookLines } from "@/components/animated-notebook-lines";
import { cn } from "@/lib/cn";
import { useIsoLayoutEffect } from "@/hooks/use-Isomorphic-layout-effect";
import { useHandwritingConfig } from "@/context/handwriting-context";
import { useStableHandler } from "@/hooks/use-stable-handler";

function useMeasureText() {
  const config = useHandwritingConfig();

  const measureText = useCallback(
    (text: string): number => {
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "nowrap";
      tempSpan.className = "font-shadows-into-light";

      text.split("").forEach((char) => {
        const rule = config.glyphMap[char] ||
          config.glyphMap[char.toLowerCase()] || { fontSize: 28, offsetY: 0 };

        const charSpan = document.createElement("span");
        charSpan.textContent = char;
        charSpan.style.fontSize = `${rule.fontSize}px`;
        charSpan.style.display = "inline-block";

        if (char === " " && rule.width) {
          charSpan.style.width = `${rule.width}px`;
        }

        tempSpan.appendChild(charSpan);
      });

      document.body.appendChild(tempSpan);
      const width = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);

      return width;
    },
    [config.glyphMap]
  );

  return { measureText };
}

function split(
  measureText: (text: string) => number,
  text: string,
  maxWidth: number
): string[] {
  const textWidth = measureText(text);

  if (textWidth <= maxWidth) {
    return [text];
  }

  const words = text.split(" ");
  if (words.length === 1) {
    return [text];
  }

  const result: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = measureText(testLine);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        result.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    result.push(currentLine);
  }

  return result;
}

interface LineData {
  id: string;
  text: string;
}

interface HandwritingLineProps {
  children?: string;
  className?: string;
  copy?: React.ReactElement;
  highlight?: boolean;
  highlightWordIndex?: number;
  side?: "left" | "right";
  text?: string;
}

function HandwritingLineBase<T extends React.ElementType = "p">({
  children = "",
  as,
  offsetY,
  lineHeight,
  copy,
  highlight = false,
  highlightWordIndex = 0,
  side = "left",
  ...props
}: HandwritingLineProps & Omit<HandwritingTextProps<T>, "text">) {
  const [lines, setLines] = useState<LineData[]>([
    { id: "line-0", text: children },
  ]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { measureText } = useMeasureText();

  useIsoLayoutEffect(() => {
    if (!children) {
      setLines([{ id: "line-0", text: "" }]);
      return;
    }

    let rafId: number | null = null;

    const checkAndSplit = () => {
      if (!wrapperRef.current) {
        return;
      }

      const containerWidth = wrapperRef.current.offsetWidth;
      const availableWidth = containerWidth - 32; // px-4

      const splitLines = split(measureText, children, availableWidth);

      const newLines = splitLines.map((text, index) => ({
        id: `line-${index}`,
        text,
      }));

      setLines((prevLines) => {
        if (
          newLines.length !== prevLines.length ||
          newLines.some((line, i) => line.text !== prevLines[i]?.text)
        ) {
          return newLines;
        }
        return prevLines;
      });
    };

    const handleResize = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(checkAndSplit);
    };

    checkAndSplit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [children, measureText]);

  return (
    <>
      {lines.map((line, idx) => (
        <div
          key={line.id}
          ref={idx === 0 ? wrapperRef : null}
          className="w-full"
        >
          <div className="relative w-full">
            <AnimatedNotebookLines />
            <div
              className={cn(
                "absolute inset-0 flex items-end p-4",
                side === "left" ? "" : "ml-auto w-fit"
              )}
            >
              <HandwritingText
                text={line.text}
                as={as as React.ElementType}
                offsetY={offsetY}
                lineHeight={lineHeight}
                {...props}
              />

              {copy && idx === lines.length - 1 && copy}

              {highlight && idx === highlightWordIndex && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="169 0 259 200"
                  preserveAspectRatio="none"
                  className="absolute top-0 left-0 w-40 h-full"
                >
                  <path
                    d="M 299.2395935058594 35.0625 L 273.2395935058594 38.395843505859375 L 247.23959350585938 41.0625 L 231.23959350585938 44.395843505859375 L 216.57290649414062 47.72917175292969 L 200.57290649414062 55.72917175292969 L 192.57290649414062 61.0625 L 181.23959350585938 71.0625 L 172.57290649414062 87.0625 L 169.90625 95.0625 L 169.90625 100.39584350585938 L 169.90625 121.0625 L 171.90625 134.39584350585938 L 175.90625 140.39584350585938 L 187.90628051757812 150.39584350585938 L 201.90628051757812 159.0625 L 215.23959350585938 162.39584350585938 L 228.57290649414062 165.0625 L 248.57290649414062 168.39584350585938 L 263.2395935058594 169.0625 L 278.5729064941406 168.39584350585938 L 304.5729064941406 167.72918701171875 L 320.5729064941406 167.0625 L 335.2395935058594 167.0625 L 358.5729064941406 164.39584350585938 L 370.5729064941406 158.39584350585938 L 378.5729064941406 153.0625 L 395.2395935058594 142.39584350585938 L 402.5729064941406 136.39584350585938 L 411.2395935058594 127.72918701171875 L 417.2395935058594 118.39584350585938 L 419.9062805175781 113.0625 L 420.5729064941406 101.72918701171875 L 411.9062805175781 89.0625 L 396.5729064941406 73.0625 L 373.2395935058594 50.395843505859375 L 361.2395935058594 41.0625 L 348.5729064941406 33.72917175292969 L 332.5729064941406 29.0625 L 320.5729064941406 27.0625 L 301.9062805175781 27.0625 L 291.2395935058594 25.0625 L 274.5729064941406 24.395843505859375 L 263.9062805175781 24.395843505859375 L 252.57290649414062 26.395843505859375 L 244.57290649414062 30.395843505859375 L 202.57290649414062 53.0625 L 186.57290649414062 69.0625 L 177.90625 81.72918701171875 L 173.23959350585938 95.72918701171875 L 186.57290649414062 123.0625 L 209.90628051757812 135.0625 L 245.23959350585938 157.0625 L 255.23959350585938 163.72918701171875 L 279.9062805175781 171.0625 L 300.5729064941406 176.39584350585938 L 322.5729064941406 180.39584350585938 L 343.2395935058594 180.39584350585938 L 366.5729064941406 177.72918701171875 L 377.2395935058594 177.72918701171875 L 386.5729064941406 175.0625 L 402.5729064941406 163.72918701171875 L 413.9062805175781 157.0625 L 419.9062805175781 147.0625 L 423.2395935058594 141.0625 L 425.9062805175781 134.39584350585938 L 427.2395935058594 125.0625 L 428.5729064941406 114.39584350585938 L 424.5729064941406 101.72918701171875 L 407.9062805175781 84.39584350585938 L 384.5729064941406 61.0625 L 373.9062805175781 53.72917175292969 L 362.5729064941406 45.0625 L 339.9062805175781 35.72917175292969 L 330.5729064941406 30.395843505859375 L 317.2395935058594 25.729171752929688 L 295.9062805175781 20.395843505859375 L 289.9062805175781 19.0625 L 273.9062805175781 19.0625 L 259.9062805175781 26.395843505859375 L 248.57290649414062 33.0625 L 231.23959350585938 49.72917175292969 L 219.90628051757812 55.72917175292969 L 207.90628051757812 63.0625 L 201.23959350585938 67.0625 L 197.90628051757812 71.72918701171875 L 195.23959350585938 77.0625 L 193.23959350585938 88.39584350585938 L 193.23959350585938 101.0625 L 193.23959350585938 112.39584350585938"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    id="sig_path_5"
                    stroke="var(--brand-red)"
                    strokeWidth="4px"
                    strokeDasharray="1437.8565673828125"
                    strokeDashoffset="1437.8565673828125"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="1437.8565673828125"
                      to="0"
                      dur="2.00s"
                      begin="0.00s"
                      fill="freeze"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export const HandwritingLine = Object.assign(HandwritingLineBase, {});
