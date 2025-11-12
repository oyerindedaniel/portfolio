import React from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import { cn } from "@/lib/cn";

interface SvgProps extends React.SVGProps<SVGSVGElement> {
  children: React.ReactNode;
}

const Svg = React.forwardRef<SVGSVGElement, SvgProps>(
  (
    { children, width = 191, height = 191, viewBox = "0 0 191 191", ...props },
    ref
  ) => {
    return (
      <svg ref={ref} width={width} height={height} viewBox={viewBox} {...props}>
        <defs>
          <mask id="mask">
            <path
              d="M1.5 48.5L37.1172 1.5H152.781L189.5 48.5V142.5L152.781 189.5H37.4844L1.5 142.5V48.5Z"
              fill="white"
            />
          </mask>
        </defs>
        <g mask="url(#mask)">{children}</g>
        <path
          d="M1.5 48.5L37.1172 1.5H152.781L189.5 48.5V142.5L152.781 189.5H37.4844L1.5 142.5V48.5Z"
          stroke="#2E2E2E"
          strokeWidth="3"
          fill="none"
        />
      </svg>
    );
  }
);

Svg.displayName = "Framed.Svg";

type ImageProps = {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
} & Omit<NextImageProps, "width" | "height" | "alt">;

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ width = 188, height = 188, className, alt = "", ...props }, ref) => {
    return (
      <foreignObject width={width} height={height}>
        <NextImage
          ref={ref}
          width={width}
          height={height}
          alt={alt}
          className={cn("w-full h-full object-cover", className)}
          {...props}
        />
      </foreignObject>
    );
  }
);

Image.displayName = "Framed.Image";

export const Framed = {
  Svg,
  Image,
};
