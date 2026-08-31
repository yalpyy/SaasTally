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

Some links on this site are affiliate links. If you buy through one, SaaSTally may earn a commission at no extra cost to you. That commission has no effect on what we recommend, how we score anything, or the order tools appear in.

## How an affiliate link works here

Product buttons do not point at a partner URL. They point at our own redirect endpoint on this domain, which looks up the partner link on the server, records an anonymous click, and forwards you to the vendor.

Recorded: which program was clicked, what kind of page it came from, where on the page the button was, a broad device type (mobile, tablet or desktop), and a country code when our host provides one.

Not recorded, by design: your IP address, your browser's user agent string, cookies, or any identifier that could be tied back to you. We do not build profiles, and we could not tell you which links any individual has clicked, because we never wrote it down.

## Why commission cannot reach the rankings

This is enforced by the database, not by good intentions. Commission rates live in a table only administrators can read. The code that orders listings, scores tools and builds shortlists has no access to it — a query for a commission value from that code returns nothing.

A tool with no affiliate program can outrank one that pays. Several on this site do.

## What is labelled

- Tools with an active partner program are marked on their card and page.
- Sponsored placements, if we ever run any, will say so plainly. We do not currently run any.
- Pages whose details were collected automatically from a vendor's own site, and not yet checked by an editor, say so at the top and give the date and source.

## Pricing

Prices are recorded from the vendor's own pages, with the date we read them. Vendors change prices without telling us. Confirm the current price with the vendor before you buy — the figure here is evidence of what was published on a date, not a quote.

## If something reads wrong

If a page reads like an advert rather than an assessment, that is a defect and we want to hear about it. Corrections are answered first.`;

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
    </Container>
  );
}
