import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section-heading";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { ArticleCard } from "@/components/articles/article-card";
import type { Article } from "@/types";

export function LatestGuides({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  return (
    <Section>
      <SectionHeading
        eyebrow="Editorial"
        title="Latest guides"
        description="Practical write-ups on choosing, comparing and budgeting for software."
        action={
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            All guides
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      <AnimatedSection className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <AnimatedItem key={article.id} className="h-full">
            <ArticleCard article={article} />
          </AnimatedItem>
        ))}
      </AnimatedSection>
    </Section>
  );
}
