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

const content = `## Acceptance

By using SaaSTally you agree to these terms.

## Editorial content

Content is provided for general information. Pricing, features and vendor policies change frequently — always confirm details with the vendor before purchasing.

## No warranty

SaaSTally is provided as is. We make no warranty that the information is complete, current or fit for a particular purpose.

## Limitation of liability

To the extent permitted by law, SaaSTally is not liable for losses arising from decisions made on the basis of content published here.

## Intellectual property

Product names and logos belong to their respective owners. Editorial text and original assets on this site belong to SaaSTally.

## Affiliate relationships

Some links are affiliate links. See our affiliate disclosure for detail.

## Changes

We may update these terms. Continued use after an update constitutes acceptance.`;

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
      <p className="mt-12 border-t border-border pt-6 text-xs text-subtle">
        This page contains professional placeholder content for phase 1. Have it reviewed by a
        qualified professional before launch.
      </p>
    </Container>
  );
}
