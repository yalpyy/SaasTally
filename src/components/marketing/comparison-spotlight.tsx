"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ToolLogo } from "@/components/ui/tool-logo";
import { revealViewport, easeOut } from "@/lib/motion";
import type { Comparison, Tool } from "@/types";

/**
 * Two product cards drift toward each other on reveal — a single, deliberate
 * animation rather than a busy one.
 */
export function ComparisonSpotlight({
  comparison,
  tools,
}: {
  comparison: Comparison;
  tools: Tool[];
}) {
  const [a, b] = tools;
  if (!a || !b) return null;

  const attributes = comparison.attributes.slice(0, 5);

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-panel border border-border bg-elevated px-6 py-12 sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />

          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Head to head
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl md:text-[34px]">
              Compare before you commit.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {comparison.quickVerdict}
            </p>
          </div>

          <div className="mt-10 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.6, ease: easeOut }}
              className="flex items-center gap-3 rounded-card border border-border bg-card p-4 sm:justify-self-end sm:min-w-[240px]"
            >
              <ToolLogo name={a.name} src={a.logoUrl} size={40} />
              <span>
                <span className="block text-sm font-semibold">{a.name}</span>
                <span className="block text-xs text-subtle">{a.shortDescription}</span>
              </span>
            </motion.div>

            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={revealViewport}
              transition={{ duration: 0.4, delay: 0.15, ease: easeOut }}
              className="mx-auto flex size-11 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-wider text-subtle"
            >
              vs
            </motion.span>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={revealViewport}
              transition={{ duration: 0.6, ease: easeOut }}
              className="flex items-center gap-3 rounded-card border border-border bg-card p-4 sm:min-w-[240px]"
            >
              <ToolLogo name={b.name} src={b.logoUrl} size={40} />
              <span>
                <span className="block text-sm font-semibold">{b.name}</span>
                <span className="block text-xs text-subtle">{b.shortDescription}</span>
              </span>
            </motion.div>
          </div>

          <ul className="mx-auto mt-10 max-w-2xl divide-y divide-border overflow-hidden rounded-card border border-border bg-card">
            {attributes.map((attribute) => (
              <li
                key={attribute.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-sm"
              >
                <span className="text-muted">{attribute.label}</span>
                <Indicator active={attribute.winner === "a" || attribute.winner === "tie"} />
                <Indicator active={attribute.winner === "b" || attribute.winner === "tie"} />
              </li>
            ))}
          </ul>

          <div className="mt-8 text-center">
            <Link
              href={`/compare/${comparison.slug}`}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Compare {a.name} vs {b.name}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Indicator({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "flex size-6 items-center justify-center rounded-full bg-accent-soft text-primary"
          : "flex size-6 items-center justify-center rounded-full bg-card-hover text-subtle"
      }
    >
      {active ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Minus className="size-3.5" aria-hidden="true" />
      )}
      <span className="sr-only">{active ? "Stronger" : "Weaker"}</span>
    </span>
  );
}
