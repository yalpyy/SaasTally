import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Markdown } from "@/lib/utils/markdown";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Affiliate Disclosure",
  description: "How SaaSTally uses affiliate links and why they do not influence editorial rankings.",
  path: "/affiliate-disclosure",
});

const content = `## The short version

SaaSTally may earn a commission when you purchase through selected links. This does not affect how products are evaluated.

## How affiliate links work here

Outbound links to partner products route through our own redirect endpoint. That endpoint records an anonymous, aggregate click event and forwards you to the vendor. We do not store IP addresses or build user profiles.

## What we record

- Which affiliate program was clicked
- The type of page the click came from
- Broad device type
- Country, where it is safely available

## Editorial independence

Commission values live in a separate table from editorial scores. Ranking, ordering and scoring logic have no access to commission data. A product with no affiliate program can, and does, outrank one that pays.

## Labelling

Affiliate links are labelled on the page they appear. Where a tool has an active partner program, the product card indicates it.

## Questions

If you believe a page reads as promotional rather than editorial, tell us. That is a bug.`;

export default function Page() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
        ]}
        className="mb-6"
      />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Affiliate Disclosure</h1>
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
