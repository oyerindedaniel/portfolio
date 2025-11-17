import { useFocusTrap } from "@/hooks/use-focus-trap";
import React from "react";

export const FocusTrap: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { containerRef, handleFocusBefore, handleFocusAfter } = useFocusTrap();

  return (
    <div ref={containerRef}>
      <div tabIndex={0} aria-hidden="true" onFocus={handleFocusBefore} />

      {children}

      <div tabIndex={0} aria-hidden="true" onFocus={handleFocusAfter} />
    </div>
  );
};
