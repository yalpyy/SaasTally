"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { initials } from "@/lib/utils/format";

/**
 * Decorative background for the hero.
 *
 * Rules it follows deliberately:
 *  - purely decorative, hidden from assistive tech
 *  - very low opacity so hero text stays the focal point
 *  - slow, small-amplitude motion (no dizziness)
 *  - parallax is disabled entirely under prefers-reduced-motion and on touch
 */
const cards = [
  { name: "Semrush", tag: "SEO", x: "6%", y: "14%", depth: 22, delay: 0 },
  { name: "Notion", tag: "Productivity", x: "80%", y: "10%", depth: 14, delay: 1.2 },
  { name: "Shopify", tag: "E-Commerce", x: "88%", y: "58%", depth: 26, delay: 0.6 },
  { name: "HubSpot", tag: "CRM", x: "2%", y: "62%", depth: 18, delay: 1.8 },
  { name: "Hostinger", tag: "Hosting", x: "16%", y: "86%", depth: 12, delay: 2.4 },
  { name: "Canva", tag: "Design", x: "72%", y: "88%", depth: 20, delay: 0.9 },
];

export function HeroVisual() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 40, damping: 22, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 40, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (reduceMotion) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const onPointerMove = (event: PointerEvent) => {
      // Normalised -0.5 … 0.5 so amplitude is independent of viewport size.
      pointerX.set(event.clientX / window.innerWidth - 0.5);
      pointerY.set(event.clientY / window.innerHeight - 0.5);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [pointerX, pointerY, reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grid + radial fade */}
      <div className="absolute inset-0 surface-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_20%,transparent_75%)]" />

      {/* Ambient brand glow */}
      <div
        className="absolute left-1/2 top-[-18%] size-[620px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--glow) 0%, transparent 65%)" }}
      />

      <div className="absolute inset-0 hidden md:block">
        {cards.map((card) => (
          <FloatingCard
            key={card.name}
            {...card}
            springX={springX}
            springY={springY}
            reduceMotion={Boolean(reduceMotion)}
          />
        ))}
      </div>
    </div>
  );
}

function FloatingCard({
  name,
  tag,
  x,
  y,
  depth,
  delay,
  springX,
  springY,
  reduceMotion,
}: {
  name: string;
  tag: string;
  x: string;
  y: string;
  depth: number;
  delay: number;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const translateX = useTransform(springX, (value) => value * depth);
  const translateY = useTransform(springY, (value) => value * depth);

  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y, x: reduceMotion ? 0 : translateX, y: reduceMotion ? 0 : translateY }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: delay * 0.15 }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-3.5 py-3 opacity-70 backdrop-blur-md"
      >
        <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-elevated text-[11px] font-semibold text-muted">
          {initials(name)}
        </span>
        <span className="pr-1">
          <span className="block text-xs font-medium leading-tight">{name}</span>
          <span className="block text-[10px] leading-tight text-subtle">{tag}</span>
        </span>
      </motion.div>
    </motion.div>
  );
}
