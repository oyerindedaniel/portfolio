"use client";

import React, { useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/cn";

interface ImageUploaderProps {
  onImageUpload: (imageData: string) => void;
  currentImage?: string;
  className?: string;
}

export function ImageUploader({
  onImageUpload,
  currentImage,
  className,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.startsWith("image/") || file.type === "image/svg+xml")
    ) {
      processFile(file);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          isDragging
            ? "border-(--brand-blue) bg-(--brand-blue)/10 scale-[1.02]"
            : "border-(--foreground-muted)/20 hover:border-(--brand-blue)/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          {currentImage ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[var(--brand-blue)]">
                <img
                  src={currentImage}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Change Image
              </Button>
            </div>
          ) : (
            <>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--foreground-muted)]"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Upload Image/SVG
              </Button>
              <p className="text-sm text-[var(--foreground-muted)] text-center">
                or drag and drop here
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
