"use client";

import React, { useRef, useState, ReactNode, useCallback } from "react";
import { HandwritingText } from "@/components/handwriting-text";
import { AnimatedNotebookLines } from "@/components/animated-notebook-lines";
import { cn } from "@/lib/cn";
import { useIsoLayoutEffect } from "@/hooks/use-Isomorphic-layout-effect";
import { useHandwritingConfig } from "@/context/handwriting-context";

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
  if (textWidth <= maxWidth) return [text];

  const words = text.split(" ");
  if (words.length === 1) return [text];

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
}

function HandwritingLineBase({
  children = "",
  className,
}: HandwritingLineProps) {
  const [lines, setLines] = useState<LineData[]>([
    { id: "line-0", text: children },
  ]);
  const containerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const { measureText } = useMeasureText();

  useIsoLayoutEffect(() => {
    if (!children) {
      setLines([{ id: "line-0", text: "" }]);
      return;
    }

    const checkAndSplit = () => {
      const container = containerRefs.current.get("line-0");
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const availableWidth = containerWidth - 32; // px-4

      const splitLines = split(measureText, children, availableWidth);

      const newLines = splitLines.map((text, index) => ({
        id: `line-${index}`,
        text,
      }));

      if (
        newLines.length !== lines.length ||
        newLines.some((line, i) => line.text !== lines[i]?.text)
      ) {
        setLines(newLines);
      }
    };

    checkAndSplit();
    window.addEventListener("resize", checkAndSplit);
    return () => window.removeEventListener("resize", checkAndSplit);
  }, [children, measureText]);

  return (
    <>
      {lines.map((line) => (
        <div
          key={line.id}
          ref={(el) => {
            containerRefs.current.set(line.id, el);
          }}
          className={cn("relative w-full", className)}
        >
          <AnimatedNotebookLines />
          <div className="absolute inset-0 flex items-end p-4">
            <HandwritingText text={line.text} />
          </div>
        </div>
      ))}
    </>
  );
}

interface HandwritingLineEmailProps {
  children: string;
  copyButton?: ReactNode;
}

function HandwritingLineEmail({
  children,
  copyButton,
}: HandwritingLineEmailProps) {
  const [displayText, setDisplayText] = useState(children);
  const containerRef = useRef<HTMLDivElement>(null);
  const { measureText } = useMeasureText();

  useIsoLayoutEffect(() => {
    const trim = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const availableWidth = containerWidth - 32 - 55;
      const textWidth = measureText(children);

      if (textWidth <= availableWidth) {
        setDisplayText(children);
        return;
      }

      const splits = split(measureText, children, availableWidth);
      setDisplayText(splits[0]);
    };

    trim();
    window.addEventListener("resize", trim);
    return () => window.removeEventListener("resize", trim);
  }, [children, measureText]);

  return (
    <div ref={containerRef} className="relative w-full">
      <AnimatedNotebookLines />
      <div className="absolute inset-0 flex items-end w-fit ml-auto pl-4 py-4 pr-[3.4375rem]">
        <HandwritingText text={displayText} />
        {copyButton}
      </div>
    </div>
  );
}

interface HandwritingLineLinkProps {
  children: string;
  href?: string;
  target?: string;
  className?: string;
}

function HandwritingLineLink({
  children,
  href,
  target,
  className,
}: HandwritingLineLinkProps) {
  return (
    <HandwritingText
      as="a"
      href={href}
      target={target}
      text={children}
      className={className}
    />
  );
}

interface HandwritingLineLinksProps {
  children: ReactNode;
}

function HandwritingLineLinks({ children }: HandwritingLineLinksProps) {
  return (
    <div className="relative">
      <AnimatedNotebookLines />
      <div className="absolute inset-0 flex items-end pl-4 py-4 pr-[3.6875rem] w-fit ml-auto">
        {children}
      </div>
    </div>
  );
}

export const HandwritingLine = Object.assign(HandwritingLineBase, {
  Email: HandwritingLineEmail,
  Link: HandwritingLineLink,
  Links: HandwritingLineLinks,
});
