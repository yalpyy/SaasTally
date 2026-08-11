"use client";

import { motion } from "motion/react";
import { fadeUp, revealViewport, stagger } from "@/lib/motion";

/**
 * Scroll reveal wrapper. Motion honours `prefers-reduced-motion` through
 * MotionConfig in the root layout, so no branching is needed here.
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={stagger(delay)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
