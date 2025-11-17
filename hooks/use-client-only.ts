import { useState } from "react";
import { useIsoLayoutEffect } from "./use-Isomorphic-layout-effect";

export function useClientOnly(duration: number | null = null) {
  const [isClient, setIsClient] = useState(false);

  useIsoLayoutEffect(() => {
    if (duration === null) {
      setIsClient(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsClient(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return isClient;
}
