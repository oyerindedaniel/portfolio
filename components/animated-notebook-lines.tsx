"use client";

import React, { useRef, useState, useMemo } from "react";

interface AnimatedNotebookLinesProps extends React.SVGProps<SVGSVGElement> {
  threshold?: number;
}

export function AnimatedNotebookLines({
  viewBox = "0 0 808 45",
  threshold = 0.5,
  ...props
}: AnimatedNotebookLinesProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const lineWidth = useMemo(() => {
    const parts = viewBox.split(" ");
    return parts.length >= 3 ? parseFloat(parts[2]) : 808;
  }, [viewBox]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      <svg
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <line
          y1="45"
          x2={lineWidth}
          y2="45"
          stroke="var(--brand-blue)"
          strokeDasharray={lineWidth}
          strokeDashoffset={isVisible ? 0 : lineWidth}
          style={{
            transition: "stroke-dashoffset 0.6s ease-out",
          }}
        />

        <line
          y1="30"
          x2={lineWidth}
          y2="30"
          stroke="var(--brand-red)"
          strokeDasharray={lineWidth}
          strokeDashoffset={isVisible ? 0 : lineWidth}
          style={{
            transition: "stroke-dashoffset 0.6s ease-out 0.1s",
          }}
        />

        <line
          y1="15"
          x2={lineWidth}
          y2="15"
          stroke="var(--brand-red)"
          strokeDasharray={lineWidth}
          strokeDashoffset={isVisible ? 0 : lineWidth}
          style={{
            transition: "stroke-dashoffset 0.6s ease-out 0.2s",
          }}
        />

        <line
          y1="0"
          x2={lineWidth}
          y2="0"
          stroke="var(--brand-blue)"
          strokeDasharray={lineWidth}
          strokeDashoffset={isVisible ? 0 : lineWidth}
          style={{
            transition: "stroke-dashoffset 0.6s ease-out 0.3s",
          }}
        />
      </svg>
    </div>
  );
}
