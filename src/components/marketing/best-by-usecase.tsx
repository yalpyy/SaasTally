import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section-heading";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import type { BestList } from "@/types";

export function BestByUseCase({ lists }: { lists: BestList[] }) {
  if (lists.length === 0) return null;

  return (
    <Section className="bg-elevated/40">
      <SectionHeading
        eyebrow="Shortlists"
        title="Best software by use case"
        description="Curated shortlists for the decisions teams make most often."
      />

      <AnimatedSection className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <AnimatedItem key={list.slug} className="h-full">
            <Link
              href={`/best/${list.slug}`}
              className="group flex h-full items-center gap-4 rounded-card border border-border bg-card p-5 transition-colors duration-200 hover:border-border-strong hover:bg-card-hover"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-primary">
                <Trophy className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{list.title}</span>
                <span className="mt-1 block truncate text-sm text-muted">{list.description}</span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-subtle transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
          </AnimatedItem>
        ))}
      </AnimatedSection>
    </Section>
  );
}
