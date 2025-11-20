import * as React from "react";
import { cn } from "@/lib/cn";

export function CheckIcon({ ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <div className="group inline-flex">
      <svg
        width="20"
        height="20"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M0.5 4L3.15234 0.5H11.7656L14.5 4V11L11.7656 14.5H3.17969L0.5 11V4Z"
          fill="white"
        />
        <path
          d="M0.5 4L3.15234 0.5H11.7656L14.5 4V11L11.7656 14.5H3.17969L0.5 11V4Z"
          className="stroke-foreground-muted group-hover:stroke-black transition-colors duration-200"
        />
        <path
          d="M4.5 7.5L6.5 9.5L10.5 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "fill-none group-hover:stroke-black transition-all duration-200 ease-in-out",
            "group-hover:scale-105 group-active:scale-95 origin-center"
          )}
        />
      </svg>
    </div>
  );
}
