import Link from "next/link";
import { ArrowRight, GitCompareArrows, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SearchBox } from "@/components/search/search-box";
import { HeroVisual } from "./hero-visual";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-28 lg:pt-24">
      <HeroVisual />

      <Container className="relative">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <AnimatedItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-muted backdrop-blur-sm">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              Independent research. Transparent affiliate disclosure.
            </span>
          </AnimatedItem>

          <AnimatedItem>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
              <span className="text-gradient">Find software</span>
              <br />
              <span className="text-gradient">worth paying for.</span>
            </h1>
          </AnimatedItem>

          <AnimatedItem>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              Independent software comparisons, reviews and recommendations to help you choose the
              right tools.
            </p>
          </AnimatedItem>

          <AnimatedItem>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/software"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto"
              >
                Explore software
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/compare"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-[15px] font-medium transition-colors hover:border-border-strong hover:bg-card-hover sm:w-auto"
              >
                <GitCompareArrows className="size-4" aria-hidden="true" />
                Compare tools
              </Link>
            </div>
          </AnimatedItem>

          <AnimatedItem>
            <div className="mx-auto mt-10 max-w-2xl">
              <SearchBox />
            </div>
          </AnimatedItem>
        </AnimatedSection>
      </Container>
    </section>
  );
}
