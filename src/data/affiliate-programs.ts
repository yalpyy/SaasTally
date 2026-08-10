import type { AffiliateProgram } from "@/types";

/**
 * DEV FIXTURE — see src/data/README.md
 *
 * In production these rows live in Supabase and are only ever read on the
 * server by the /go/[slug] route. Affiliate URLs must never be inlined into
 * page markup, and commission values must never influence rankings.
 */
export const affiliatePrograms: AffiliateProgram[] = [
  {
    id: "aff-semrush",
    toolSlug: "semrush",
    network: "Impact",
    programName: "Semrush Affiliate",
    affiliateUrl: "https://www.semrush.com/?ref=saastally-demo",
    commissionType: "flat",
    commissionValue: "0",
    cookieDays: 120,
    status: "active",
  },
  {
    id: "aff-shopify",
    toolSlug: "shopify",
    network: "Impact",
    programName: "Shopify Partners",
    affiliateUrl: "https://www.shopify.com/?ref=saastally-demo",
    commissionType: "flat",
    commissionValue: "0",
    cookieDays: 30,
    status: "active",
  },
  {
    id: "aff-hostinger",
    toolSlug: "hostinger",
    network: "In-house",
    programName: "Hostinger Affiliates",
    affiliateUrl: "https://www.hostinger.com/?ref=saastally-demo",
    commissionType: "percentage",
    commissionValue: "0",
    cookieDays: 30,
    status: "active",
  },
];
