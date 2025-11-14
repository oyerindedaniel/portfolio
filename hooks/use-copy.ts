"use client";
import { useState, useTransition } from "react";

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const copy = (value: string) => {
    if (!value) return;

    startTransition(() => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1200);
      });
    });
  };

  return { copy, copied, pending };
}
