"use client";

import React from "react";
import { cn } from "@/lib/cn";

interface AnimatedNotebookLinesProps
  extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  maxWidth?: number;
  height?: number;
}

export function AnimatedNotebookLines({
  maxWidth = 808,
  height = 45,
  className,
  ...props
}: AnimatedNotebookLinesProps) {
  return (
    <div
      className={cn("w-full overflow-hidden relative", className)}
      style={{ maxWidth, height }}
    >
      <svg
        width={maxWidth}
        height={height}
        viewBox={`0 0 ${maxWidth} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin slice"
        style={{
          display: "block",
          minWidth: `${maxWidth}px`,
          height: `${height}px`,
        }}
        {...props}
      >
        {[45, 30, 15, 0].map((y, i) => (
          <line
            key={y}
            y1={y}
            x2={maxWidth}
            y2={y}
            stroke={
              i === 0 || i === 3 ? "var(--brand-blue)" : "var(--brand-red)"
            }
          />
        ))}
      </svg>
    </div>
  );
}
