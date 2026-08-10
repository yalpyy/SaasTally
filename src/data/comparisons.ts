import type { Comparison } from "@/types";

/** DEV FIXTURE — see src/data/README.md */
export const comparisons: Comparison[] = [
  {
    id: "cmp-semrush-ahrefs",
    slug: "semrush-vs-ahrefs",
    title: "Semrush vs Ahrefs",
    toolSlugs: ["semrush", "ahrefs"],
    quickVerdict:
      "Semrush is the broader marketing platform. Ahrefs is the sharper link and competitor tool. Most teams pick based on whether paid search research matters to them.",
    attributes: [
      { label: "SEO", a: "Full suite across organic and paid", b: "Focused organic toolkit", winner: "a" },
      { label: "Keyword Research", a: "Very large keyword database", b: "Strong clickstream-informed metrics", winner: "tie" },
      { label: "Backlinks", a: "Solid index with toxicity scoring", b: "Category-leading index and refresh", winner: "b" },
      { label: "PPC", a: "Deep ad and display intelligence", b: "Limited paid coverage", winner: "a" },
      { label: "Reporting", a: "Client-ready reporting and sharing", b: "Functional but simpler", winner: "a" },
      { label: "Ease of Use", a: "Dense; real learning curve", b: "Fast and focused", winner: "b" },
      { label: "Pricing", a: "From $139/mo (placeholder)", b: "From $129/mo (placeholder)", winner: "tie" },
      { label: "Best For", a: "Agencies and full-funnel teams", b: "SEO specialists and link builders", winner: "tie" },
    ],
    recommendation:
      "Pick Semrush if one subscription has to serve SEO, content and paid teams. Pick Ahrefs if your week is mostly link analysis and competitor research.",
    status: "published",
    publishedAt: "2026-07-16",
    updatedAt: "2026-07-16",
  },
  {
    id: "cmp-shopify-hostinger",
    slug: "shopify-vs-hostinger",
    title: "Shopify vs Hostinger",
    toolSlugs: ["shopify", "hostinger"],
    quickVerdict:
      "Two different products for two different jobs: a hosted commerce platform versus low-cost hosting you assemble yourself.",
    attributes: [
      { label: "Setup Speed", a: "Store live in hours", b: "Requires stack assembly", winner: "a" },
      { label: "Running Cost", a: "Subscription plus apps", b: "Low entry price, higher renewals", winner: "b" },
      { label: "Checkout", a: "Optimised, maintained for you", b: "Depends on your chosen platform", winner: "a" },
      { label: "Flexibility", a: "Bounded by platform rules", b: "Full control of the stack", winner: "b" },
      { label: "Maintenance", a: "Handled by the platform", b: "Yours to manage", winner: "a" },
      { label: "Best For", a: "Merchants focused on selling", b: "Budget sites and technical owners", winner: "tie" },
    ],
    recommendation:
      "Choose Shopify if commerce is the business. Choose Hostinger if you want a cheap, flexible base and are comfortable maintaining it.",
    status: "published",
    publishedAt: "2026-06-22",
    updatedAt: "2026-06-22",
  },
];
