import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Markdown } from "@/lib/utils/markdown";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms that apply to using SaaSTally.",
  path: "/terms",
});

const content = `Last updated: 31 August 2026.

## Using this site

SaaSTally is free to read and needs no account. By using it you accept these terms.

## What the information here is, and is not

We publish product details, prices and comparisons to help you shortlist software. It is research, not advice. We are not your consultant and we do not know your circumstances — the decision, and the responsibility for it, stays with you.

Prices and features are recorded from vendors' own pages on the date shown. Vendors change both without notice. Always confirm with the vendor before purchasing.

Some pages are marked as collected automatically and not yet reviewed by an editor. Those labels are accurate; treat those pages as a starting point rather than a verified account.

## Affiliate links

Some outbound links earn us a commission. This is set out in full on our affiliate disclosure page and does not affect rankings or scores.

## Accuracy and corrections

We try to be right and we will correct mistakes. We do not warrant that everything here is accurate, complete or current, and to the extent the law allows we are not liable for losses arising from decisions made on the basis of this site.

## Other people's sites

Links to vendors are for convenience. We do not control those sites and are not responsible for their content, terms or pricing.

## Our content

The words, design and structure of this site belong to us. Quote us with attribution and a link; do not republish pages wholesale or scrape the catalogue for a competing product.

Product names, logos and trademarks belong to their owners and appear here for identification.

## Changes

We may update these terms. Material changes move the date above.

## Contact

info@saastally.com`;

export default function Page() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Terms of Service", href: "/terms" },
        ]}
        className="mb-6"
      />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
      <div className="mt-8">
        <Markdown content={content} />
      </div>
    </Container>
  );
}
