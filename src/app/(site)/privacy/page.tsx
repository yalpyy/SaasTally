import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Markdown } from "@/lib/utils/markdown";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How SaaSTally handles data, analytics and affiliate click tracking.",
  path: "/privacy",
});

const content = `Last updated: 31 August 2026.

## The short version

SaaSTally has no reader accounts, runs no analytics or advertising trackers, and sets no cookies for visitors. We do not sell or share personal data, because we hold almost none.

## What we store when you click an affiliate link

Product buttons route through our own redirect. When you use one we write a single row containing: which affiliate program it was, what kind of page it came from, where on the page the button sat, a broad device type, and a country code when our host supplies one.

We deliberately do not store your IP address, your user agent string, or any identifier. Nothing in that row can be traced to a person, including by us.

## Cookies

We set no cookies for readers. Your theme choice (light, dark or system) is kept in your browser's local storage and never leaves your device — clearing site data removes it.

Staff who sign in to the admin area receive a session cookie from our authentication provider. That applies only to people with an account, and there are no public accounts.

## Newsletter

The signup form is not connected to an email provider. Nothing you type into it is transmitted or stored anywhere. The form says so where it appears.

## Server logs

The site is hosted on Vercel and the database is Supabase. Both keep operational logs — request times, status codes, IP addresses — as any web host does, under their own retention policies. We use those only to keep the site running and to investigate faults.

## Links to other sites

Following a link to a vendor puts you on their site under their policy, not ours. We have no control over what they collect.

## Your rights

If you are in the UK, EU, Turkey or another jurisdiction with data protection rights, you may ask what we hold about you, ask for a copy, or ask us to delete it. Given the above, the honest answer will usually be that we hold nothing tied to you. Write to info@saastally.com and we will answer.

## Changes

If this policy changes materially we will update the date above rather than change it quietly.

## Contact

info@saastally.com`;

export default function Page() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy", href: "/privacy" },
        ]}
        className="mb-6"
      />
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <div className="mt-8">
        <Markdown content={content} />
      </div>
    </Container>
  );
}
