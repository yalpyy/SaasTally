import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Markdown } from "@/lib/utils/markdown";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About SaaSTally",
  description: "SaaSTally is an independent software discovery platform helping teams compare tools and choose smarter.",
  path: "/about",
});

const content = `## What SaaSTally is

SaaSTally is an independent software discovery platform. We research tools, compare them against stated criteria, and publish shortlists that teams can act on.

## Why we exist

Buying software is high-friction and low-information. Vendor sites market, review sites rank by commission, and forums are anecdote. We try to sit in the useful middle: structured data, transparent criteria and plain conclusions.

## How we make money

Some outbound links are affiliate links. When you buy through one, we may earn a commission at no additional cost to you. Commission rates are stored separately from editorial scoring and are never an input to rankings.

## Our standard

- We state the criteria before the conclusion.
- We say when we have not used a product ourselves.
- We publish who a tool is not for, not only who it is for.
- We update pages when pricing or positioning changes materially.

## Contact

Corrections, questions and vendor enquiries are welcome via our contact page.`;

export default function Page() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "About SaaSTally", href: "/about" },
        ]}
        className="mb-6"
      />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About SaaSTally</h1>
      <div className="mt-8">
        <Markdown content={content} />
      </div>
      <p className="mt-12 border-t border-border pt-6 text-xs text-subtle">
        This page contains professional placeholder content for phase 1. Have it reviewed by a
        qualified professional before launch.
      </p>
    </Container>
  );
}
