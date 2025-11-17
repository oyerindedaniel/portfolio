import * as React from "react";

export function ServerLoader() {
  const numberOfLines = 4;

  return (
    <div className="w-full flex flex-col gap-[0.9375rem]">
      {Array.from({ length: numberOfLines }).map((_, svgIndex) => {
        const duration = 3 + svgIndex * 0.5;

        return (
          <svg
            key={svgIndex}
            width={808}
            height={45}
            viewBox="0 0 808 45"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              y1="0"
              x2={808}
              y2="0"
              stroke={`url(#sweepGradient-${svgIndex})`}
              strokeWidth="2"
            />
            <line
              y1="15"
              x2={808}
              y2="15"
              stroke={`url(#sweepGradient-${svgIndex})`}
              strokeWidth="2"
            />
            <line
              y1="30"
              x2={808}
              y2="30"
              stroke={`url(#sweepGradient-${svgIndex})`}
              strokeWidth="2"
            />
            <line
              y1="45"
              x2={808}
              y2="45"
              stroke={`url(#sweepGradient-${svgIndex})`}
              strokeWidth="2"
            />
            <defs>
              <linearGradient
                id={`sweepGradient-${svgIndex}`}
                x1="0"
                y1="0"
                x2="808"
                y2="0"
              >
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="30%" stopColor="#3B82F6">
                  <animate
                    attributeName="offset"
                    values="0;0.3;0.6;0.9;1;1;0"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="50%" stopColor="#EF4444">
                  <animate
                    attributeName="offset"
                    values="0.2;0.5;0.8;1;1;0;0.2"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="70%" stopColor="#3B82F6">
                  <animate
                    attributeName="offset"
                    values="0.4;0.7;1;1;0;0.3;0.4"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        );
      })}
    </div>
  );
}
