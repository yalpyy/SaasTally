import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section-heading";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { ToolCard } from "@/components/tools/tool-card";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import type { Tool } from "@/types";

export function FeaturedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;

  return (
    <Section>
      <SectionHeading
        eyebrow="Featured software"
        title="Tools our editors keep coming back to"
        description="Ranked on editorial research only. Affiliate relationships never influence position."
        action={
          <Link
            href="/software"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Browse all software
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      <AnimatedSection className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <AnimatedItem key={tool.id} className="h-full">
            <ToolCard tool={tool} sourceType="home" />
          </AnimatedItem>
        ))}
      </AnimatedSection>

      <AffiliateDisclosure className="mt-6" />
    </Section>
  );
}
