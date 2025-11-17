import { useEffect, useState } from "react";
import { useIsoLayoutEffect } from "./use-Isomorphic-layout-effect";

export function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useIsoLayoutEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
