"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface LoaderIconProps {
  size?: number;
  className?: string;
}

export function LoaderIcon({ size = 44, className }: LoaderIconProps) {
  const gridSize = 3;
  const cubes = Array.from({ length: gridSize * gridSize });

  return (
    <div
      className={cn("flex items-center justify-center select-none pointer-events-none", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="grid grid-cols-3 w-full h-full gap-0"
      >
        {cubes.map((_, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          const delay = (row + col) * 0.1;

          return (
            <motion.div
              key={i}
              className={cn(
                "w-full h-full",
                (row + col) % 2 === 0 ? "bg-brand-blue" : "bg-brand-red"
              )}
              animate={{
                scale: [1, 0, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
