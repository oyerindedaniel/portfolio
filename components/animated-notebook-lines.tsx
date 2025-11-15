"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface AnimatedNotebookLinesProps
  extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  maxWidth?: number;
  height?: number;
  threshold?: number;
}

export function AnimatedNotebookLines({
  maxWidth = 808,
  height = 45,
  threshold = 0.5,
  className,
  ...props
}: AnimatedNotebookLinesProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={containerRef}
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
            strokeDasharray={maxWidth}
            strokeDashoffset={isVisible ? 0 : maxWidth}
            style={{
              transition: `stroke-dashoffset 0.6s ease-out ${i * 0.1}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
