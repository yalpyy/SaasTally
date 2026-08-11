import type { BestList } from "@/types";

/** DEV FIXTURE — see src/data/README.md */
export const bestLists: BestList[] = [
  {
    slug: "seo-tools",
    title: "Best SEO Tools",
    description: "Research, tracking and technical auditing platforms worth the subscription.",
    categorySlug: "seo",
    toolSlugs: ["semrush", "ahrefs"],
    updatedAt: "2026-07-18",
  },
  {
    slug: "ai-tools",
    title: "Best AI Tools",
    description: "Assistants and generation tools that hold up in day-to-day work.",
    categorySlug: "ai",
    toolSlugs: ["notion"],
    updatedAt: "2026-07-11",
  },
  {
    slug: "crm-software",
    title: "Best CRM Software",
    description: "Pipelines and customer records for teams that have outgrown spreadsheets.",
    categorySlug: "crm",
    toolSlugs: ["hubspot"],
    updatedAt: "2026-07-05",
  },
  {
    slug: "hosting",
    title: "Best Hosting",
    description: "Where to put a site without overpaying or over-engineering.",
    categorySlug: "hosting",
    toolSlugs: ["hostinger"],
    updatedAt: "2026-06-27",
  },
  {
    slug: "project-management-tools",
    title: "Best Project Management Tools",
    description: "Planning and execution tools that teams actually keep using.",
    categorySlug: "project-management",
    toolSlugs: ["notion"],
    updatedAt: "2026-06-20",
  },
  {
    slug: "email-marketing-software",
    title: "Best Email Marketing Software",
    description: "Newsletters, lifecycle automation and deliverability.",
    categorySlug: "email-marketing",
    toolSlugs: ["hubspot"],
    updatedAt: "2026-06-12",
  },
];
