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

const content = `## Overview

This policy explains what SaaSTally collects and why. It is written to be readable rather than exhaustive.

## What we collect

We aim to collect as little as possible. Currently that means aggregate affiliate click events (program, page type, broad device type and country where available) and standard server logs required to operate the site.

## What we do not collect

We do not store raw IP addresses against click events, we do not sell data, and public visitors do not need an account.

## Cookies

Affiliate networks may set their own cookies once you leave our site. Those cookies are controlled by the destination vendor, not by us.

## Third parties

Our infrastructure providers process data on our behalf in order to serve the site.

## Your rights

Depending on where you live you may have rights to access or delete personal data we hold about you. Because we intentionally hold very little, most requests can be answered quickly.

## Changes

We will update this page when our practices change and note the date of the change.`;

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
      <p className="mt-12 border-t border-border pt-6 text-xs text-subtle">
        This page contains professional placeholder content for phase 1. Have it reviewed by a
        qualified professional before launch.
      </p>
    </Container>
  );
}
