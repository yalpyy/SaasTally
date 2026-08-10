import type { Variants } from "motion/react";

/**
 * A single shared motion vocabulary. Every animated surface pulls from here so
 * timing feels consistent and can be tuned in one place.
 */
export const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: easeOut } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } },
};

export function stagger(delayChildren = 0.05, staggerChildren = 0.06): Variants {
  return {
    hidden: {},
    visible: { transition: { delayChildren, staggerChildren } },
  };
}

/** Viewport config shared by scroll-reveal sections. */
export const revealViewport = { once: true, amount: 0.25, margin: "0px 0px -80px 0px" } as const;
