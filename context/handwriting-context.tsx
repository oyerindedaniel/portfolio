import React, { createContext, useContext } from "react";

export interface GlyphRule {
  fontSize: number;
  offsetY: number;
  width?: number;
}

export interface HandwritingConfig {
  baseLineHeight: number;
  lineSpacing: number;
  baseOffset: number;
  glyphMap: Record<string, GlyphRule>;
}

const HandwritingContext = createContext<HandwritingConfig | null>(null);

export const HandwritingProvider = ({ children }: React.PropsWithChildren) => {
  const glyphMap: Record<string, GlyphRule> = {
    A: { fontSize: 45, offsetY: 0 },
    B: { fontSize: 42, offsetY: 0 },
    C: { fontSize: 44, offsetY: 0 },
    D: { fontSize: 44, offsetY: 0 },
    E: { fontSize: 44, offsetY: 0 },
    F: { fontSize: 44, offsetY: 0 },
    G: { fontSize: 44, offsetY: 0 },
    H: { fontSize: 44, offsetY: 0 },
    I: { fontSize: 40, offsetY: 0 },
    J: { fontSize: 44, offsetY: 0 },
    K: { fontSize: 44, offsetY: 0 },
    L: { fontSize: 44, offsetY: 0 },
    M: { fontSize: 45, offsetY: 0 },
    N: { fontSize: 44, offsetY: 0 },
    O: { fontSize: 45, offsetY: 0 },
    P: { fontSize: 38, offsetY: 0 },
    Q: { fontSize: 45, offsetY: 0 },
    R: { fontSize: 38, offsetY: 0 },
    S: { fontSize: 40, offsetY: 0 },
    T: { fontSize: 45, offsetY: 0 },
    U: { fontSize: 44, offsetY: 0 },
    V: { fontSize: 44, offsetY: 0 },
    W: { fontSize: 45, offsetY: 0 },
    X: { fontSize: 44, offsetY: 0 },
    Y: { fontSize: 44, offsetY: 0 },
    Z: { fontSize: 44, offsetY: 0 },

    a: { fontSize: 28, offsetY: 0 },
    b: { fontSize: 34, offsetY: 0 },
    c: { fontSize: 28, offsetY: 0 },
    d: { fontSize: 34, offsetY: 0 },
    e: { fontSize: 28, offsetY: 0 },
    f: { fontSize: 34, offsetY: 0 },
    g: { fontSize: 28, offsetY: 0 },
    h: { fontSize: 38, offsetY: 0 },
    i: { fontSize: 28, offsetY: 0 },
    j: { fontSize: 28, offsetY: 0 },
    k: { fontSize: 38, offsetY: 0 },
    l: { fontSize: 34, offsetY: 0 },
    m: { fontSize: 28, offsetY: 0 },
    n: { fontSize: 28, offsetY: 0 },
    o: { fontSize: 28, offsetY: 0 },
    p: { fontSize: 28, offsetY: 0 },
    q: { fontSize: 28, offsetY: 0 },
    r: { fontSize: 28, offsetY: 0 },
    s: { fontSize: 28, offsetY: 0 },
    t: { fontSize: 38, offsetY: 0 },
    u: { fontSize: 28, offsetY: 0 },
    v: { fontSize: 28, offsetY: 0 },
    w: { fontSize: 28, offsetY: 0 },
    x: { fontSize: 28, offsetY: 0 },
    y: { fontSize: 28, offsetY: 0 },
    z: { fontSize: 28, offsetY: 0 },

    2: { fontSize: 26, offsetY: 0 },
    3: { fontSize: 26, offsetY: 0 },
    "@": { fontSize: 18, offsetY: 0 },
    " ": { fontSize: 28, offsetY: 0, width: 16 },
    ",": { fontSize: 28, offsetY: 0 },
    ".": { fontSize: 28, offsetY: 0 },
    "-": { fontSize: 34, offsetY: 0 },
    ":": { fontSize: 28, offsetY: 0 },
    "(": { fontSize: 22, offsetY: 0 },
    ")": { fontSize: 22, offsetY: 0 },
  };

  const config: HandwritingConfig = {
    baseLineHeight: 53, // Total height of line container
    lineSpacing: 15, // Space between each of the 4 lines
    baseOffset: 23, // 53 - 30 = 23px base offset
    glyphMap,
  };

  return (
    <HandwritingContext.Provider value={config}>
      {children}
    </HandwritingContext.Provider>
  );
};

export const useHandwritingConfig = () => {
  const ctx = useContext(HandwritingContext);
  if (!ctx)
    throw new Error("useHandwritingConfig must be inside HandwritingProvider");
  return ctx;
};
