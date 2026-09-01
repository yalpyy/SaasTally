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

An independent catalogue of business software. We collect what each product does and what it costs, keep those figures current, and publish comparisons and shortlists on top of them.

## Why it exists

Choosing software is a decision made with bad information. Vendor sites market. Many comparison sites rank by whoever pays most. Forums give you one person's experience with a setup unlike yours.

We try to be useful in between: the facts, sourced and dated, and conclusions that state their reasoning.

## How the catalogue is built

Product details — description, pricing, plan names — are collected automatically from each vendor's own website, and re-checked on a schedule so they do not go stale. Every figure carries the page it came from and the date it was read.

Pages built this way say so at the top until an editor has been through them. They carry no score, because a score is a judgement and nothing here invents one.

Reviews, rankings and verdicts are written by people. They are never machine-generated, and no page claims hands-on testing unless someone actually tested the product.

## How we make money

Some outbound links are affiliate links, and we may earn a commission when you buy through one. Commission data is stored where the ranking code cannot read it, which is a database permission rather than a promise. Our affiliate disclosure explains it in full.

## What we hold ourselves to

- State the criteria before the conclusion.
- Never claim testing that did not happen.
- Say who a tool is not for, not only who it suits.
- Show where a figure came from and when.
- Correct mistakes quickly and visibly.

## Contact

Corrections, vendor updates and questions: info@saastally.com`;

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
    </Container>
  );
}
