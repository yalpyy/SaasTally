import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section-heading";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";
import { CategoryCard } from "@/components/categories/category-card";
import type { Category } from "@/types";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <Section className="bg-elevated/40">
      <SectionHeading
        eyebrow="Categories"
        title="Popular categories"
        description="Start from the job you need done, then narrow down to the shortlist."
        action={
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            All categories
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      <AnimatedSection className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <AnimatedItem key={category.id} className="h-full">
            <CategoryCard category={category} />
          </AnimatedItem>
        ))}
      </AnimatedSection>
    </Section>
  );
}
