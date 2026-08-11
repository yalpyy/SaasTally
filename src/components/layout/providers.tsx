"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "./theme-provider";

/**
 * `reducedMotion="user"` makes every Motion animation respect the OS setting
 * without per-component branching.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
