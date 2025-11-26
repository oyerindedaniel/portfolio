import React, { useMemo } from "react";
import { useHandwritingConfig, GlyphRule } from "@/context/handwriting-context";

interface BaseHandwritingTextProps {
  text: string;
  lineHeight?: number; // Override default line height
  offsetY?: number; // Override default offset Y
}

export type HandwritingTextProps<T extends React.ElementType> =
  BaseHandwritingTextProps & {
    as?: T;
  } & Omit<
      React.ComponentPropsWithoutRef<T>,
      keyof BaseHandwritingTextProps | "as"
    >;

export type PolymorphicRef<T extends React.ElementType> =
  React.ComponentPropsWithRef<T>["ref"];

export const HandwritingText = <T extends React.ElementType = "p">(
  { text, as, lineHeight, offsetY, ...rest }: HandwritingTextProps<T>,
  ref?: PolymorphicRef<T>
) => {
  const Tag = as || ("p" as React.ElementType);

  const config = useHandwritingConfig();
  const effectiveLineHeight = lineHeight ?? config.baseLineHeight;
  const effectiveOffsetY = offsetY ?? config.baseOffset;

  const renderedSpans = useMemo(() => {
    return Array.from(text).map((char, i) => {
      const rule: GlyphRule = config.glyphMap[char] ||
        config.glyphMap[char.toLowerCase()] || { fontSize: 28, offsetY: 0 };

      // Apply base offset + glyph-specific offset
      const totalOffset = effectiveOffsetY + rule.offsetY;

      const isSpace = char === " ";
      const spaceWidth = rule.width;

      return (
        <span
          key={i}
          style={{
            fontSize: `${rule.fontSize}px`,
            display: "inline-block",
            transform: `translateY(${totalOffset}px)`,
            width: isSpace ? `${spaceWidth}px` : undefined,
          }}
        >
          {char}
        </span>
      );
    });
  }, [text, config.glyphMap, effectiveOffsetY]);

  return (
    <Tag
      ref={ref}
      style={{
        lineHeight: `${effectiveLineHeight}px`,
        margin: 0,
        width: "fit-content",
      }}
      {...rest}
    >
      {renderedSpans}
    </Tag>
  );
};
