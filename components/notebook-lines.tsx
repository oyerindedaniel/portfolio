import * as React from "react";

export function NotebookLines({
  width = 808,
  height = 45,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line y1="45" x2={width} y2="45" stroke="var(--brand-blue)" />
      <line y1="30" x2={width} y2="30" stroke="var(--brand-red)" />
      <line y1="15" x2={width} y2="15" stroke="var(--brand-red)" />
      <line y1="0" x2={width} y2="0" stroke="var(--brand-blue)" />
    </svg>
  );
}
