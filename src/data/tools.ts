import type { Tool } from "@/types";

/**
 * DEV FIXTURE — see src/data/README.md
 *
 * Pricing strings, ratings and feature lists below are illustrative placeholders
 * for building the UI. They are NOT verified, current vendor information.
 */
export const tools: Tool[] = [
  {
    id: "tool-semrush",
    name: "Semrush",
    slug: "semrush",
    logoUrl: null,
    websiteUrl: "https://www.semrush.com",
    shortDescription: "SEO & competitive research",
    description:
      "Semrush is a broad marketing visibility suite covering keyword research, rank tracking, backlink analysis, technical site audits and paid search intelligence. It is most often adopted by teams that want one platform for organic and paid research rather than a specialist point tool.",
    rating: 4.7,
    startingPrice: "From $139/mo",
    pricingModel: "subscription",
    companyName: "Semrush Holdings",
    foundedYear: 2008,
    featured: true,
    active: true,
    bestFor: "SEO teams",
    categorySlugs: ["seo", "marketing"],
    features: [
      "Keyword research and difficulty scoring",
      "Daily rank tracking across locations and devices",
      "Backlink index with toxicity scoring",
      "Technical site audits with prioritised issues",
      "Paid search and display ad intelligence",
      "Content optimisation and brief generation",
    ],
    pros: [
      "One of the widest data sets across organic and paid",
      "Strong reporting for agencies and client work",
      "Deep competitor analysis workflows",
    ],
    cons: [
      "Entry pricing is high for solo operators",
      "Seat limits push larger teams onto higher plans",
      "Feature breadth has a real learning curve",
    ],
    pricingTiers: [
      {
        name: "Pro",
        price: "From $139/mo",
        description: "Freelancers and small in-house teams.",
        highlights: ["Core research tools", "Limited projects", "Single seat"],
      },
      {
        name: "Guru",
        price: "From $249/mo",
        description: "Growing marketing teams and agencies.",
        highlights: ["Content toolkit", "Historical data", "Larger project limits"],
      },
      {
        name: "Business",
        price: "From $499/mo",
        description: "Agencies and larger organisations.",
        highlights: ["API access", "Share of voice", "Extended limits"],
      },
    ],
    faqs: [
      {
        question: "Is Semrush better than a specialist backlink tool?",
        answer:
          "It depends on your workload. Semrush is strongest when you need organic, paid and content data in one place. If backlinks are the majority of your work, a dedicated link-focused tool may fit better.",
      },
      {
        question: "Does Semrush include rank tracking?",
        answer:
          "Yes. Position tracking is part of the core plans, with limits on tracked keywords that scale with the tier you choose.",
      },
    ],
    alternativeSlugs: ["ahrefs"],
    verdict:
      "A strong default for teams that need organic, paid and content research in one platform, provided the budget supports the entry tier.",
    sponsored: true,
    seoTitle: null,
    seoDescription: null,
    updatedAt: "2026-07-14",
  },
  {
    id: "tool-ahrefs",
    name: "Ahrefs",
    slug: "ahrefs",
    logoUrl: null,
    websiteUrl: "https://ahrefs.com",
    shortDescription: "Backlink analysis and keyword research",
    description:
      "Ahrefs is an SEO toolset best known for its backlink index and crawler. It covers keyword research, rank tracking, site audits and content exploration, with a workflow that many practitioners find faster for link and competitor investigation.",
    rating: 4.6,
    startingPrice: "From $129/mo",
    pricingModel: "subscription",
    companyName: "Ahrefs Pte",
    foundedYear: 2011,
    featured: true,
    active: true,
    bestFor: "Backlink research",
    categorySlugs: ["seo"],
    features: [
      "Large, frequently refreshed backlink index",
      "Site Explorer for competitor teardown",
      "Keywords Explorer with clickstream metrics",
      "Site Audit crawler",
      "Content Explorer for topic discovery",
    ],
    pros: [
      "Backlink data quality is a long-standing strength",
      "Fast, focused interface",
      "Excellent competitor research workflow",
    ],
    cons: [
      "Paid search data is thinner than rivals",
      "Credit-style limits can be restrictive",
      "Fewer collaboration features for large teams",
    ],
    pricingTiers: [
      {
        name: "Lite",
        price: "From $129/mo",
        description: "Solo SEOs and small sites.",
        highlights: ["Core explorers", "Limited projects", "Single seat"],
      },
      {
        name: "Standard",
        price: "From $249/mo",
        description: "In-house teams doing regular research.",
        highlights: ["Historical data", "Batch analysis", "Higher limits"],
      },
    ],
    faqs: [
      {
        question: "Is Ahrefs suitable for beginners?",
        answer:
          "The interface is approachable, but the value comes from knowing which questions to ask. Beginners tend to get more from it after learning the fundamentals of technical and content SEO.",
      },
    ],
    alternativeSlugs: ["semrush"],
    verdict:
      "The stronger pick when link intelligence and competitor teardown are the core of your work.",
    sponsored: false,
    seoTitle: null,
    seoDescription: null,
    updatedAt: "2026-07-02",
  },
  {
    id: "tool-notion",
    name: "Notion",
    slug: "notion",
    logoUrl: null,
    websiteUrl: "https://www.notion.so",
    shortDescription: "Docs, wikis and lightweight databases",
    description:
      "Notion combines documents, wikis and flexible databases in one workspace. Teams use it as a knowledge base, a lightweight project tracker, or both, which makes it unusually adaptable but also easy to let sprawl.",
    rating: 4.5,
    startingPrice: "Free plan available",
    pricingModel: "freemium",
    companyName: "Notion Labs",
    foundedYear: 2013,
    featured: true,
    active: true,
    bestFor: "Team knowledge bases",
    categorySlugs: ["productivity", "project-management"],
    features: [
      "Block-based documents",
      "Relational databases and views",
      "Templates and workspace-wide search",
      "Permissions and guest sharing",
      "AI assistance as a paid add-on",
    ],
    pros: [
      "Extremely flexible information model",
      "Generous free tier for individuals",
      "Large template ecosystem",
    ],
    cons: [
      "Flexibility invites messy workspaces",
      "Not a substitute for a dedicated project tool at scale",
      "Offline support is limited",
    ],
    pricingTiers: [
      {
        name: "Free",
        price: "$0",
        description: "Individuals and small trials.",
        highlights: ["Unlimited pages for personal use", "Basic sharing"],
      },
      {
        name: "Plus",
        price: "Paid per seat",
        description: "Small teams collaborating daily.",
        highlights: ["Unlimited file uploads", "Version history", "Guest limits raised"],
      },
    ],
    faqs: [
      {
        question: "Can Notion replace a project management tool?",
        answer:
          "For small teams, often yes. Teams that need dependencies, capacity planning or strict workflow enforcement usually outgrow it.",
      },
    ],
    alternativeSlugs: ["hubspot"],
    verdict: "A great home for team knowledge, and a workable tracker for small teams.",
    sponsored: false,
    seoTitle: null,
    seoDescription: null,
    updatedAt: "2026-06-28",
  },
  {
    id: "tool-shopify",
    name: "Shopify",
    slug: "shopify",
    logoUrl: null,
    websiteUrl: "https://www.shopify.com",
    shortDescription: "Hosted e-commerce platform",
    description:
      "Shopify is a hosted commerce platform covering storefronts, checkout, payments, inventory and a large app ecosystem. It trades some flexibility for operational simplicity: you do not manage hosting, PCI scope or checkout infrastructure yourself.",
    rating: 4.6,
    startingPrice: "From $39/mo",
    pricingModel: "subscription",
    companyName: "Shopify Inc.",
    foundedYear: 2006,
    featured: true,
    active: true,
    bestFor: "Growing online stores",
    categorySlugs: ["ecommerce"],
    features: [
      "Hosted storefront and themes",
      "Optimised checkout",
      "Inventory and order management",
      "Large third-party app ecosystem",
      "Multi-channel selling",
    ],
    pros: [
      "Very fast to launch",
      "Strong checkout conversion out of the box",
      "Deep app ecosystem for edge cases",
    ],
    cons: [
      "App costs accumulate quickly",
      "Transaction fees when not using its own payments",
      "Theme customisation has boundaries",
    ],
    pricingTiers: [
      {
        name: "Basic",
        price: "From $39/mo",
        description: "New and small stores.",
        highlights: ["Core storefront", "Standard reporting"],
      },
      {
        name: "Shopify",
        price: "From $105/mo",
        description: "Stores with growing order volume.",
        highlights: ["Lower card rates", "More staff accounts"],
      },
    ],
    faqs: [
      {
        question: "Shopify or a self-hosted store?",
        answer:
          "Shopify suits teams that would rather spend time on merchandising than infrastructure. Self-hosted options make sense when you need deep custom checkout logic or already run engineering in-house.",
      },
    ],
    alternativeSlugs: ["hostinger"],
    verdict: "The pragmatic default for most stores that value speed to market over total control.",
    sponsored: true,
    seoTitle: null,
    seoDescription: null,
    updatedAt: "2026-07-08",
  },
  {
    id: "tool-hubspot",
    name: "HubSpot",
    slug: "hubspot",
    logoUrl: null,
    websiteUrl: "https://www.hubspot.com",
    shortDescription: "CRM and marketing automation",
    description:
      "HubSpot is a connected CRM platform spanning marketing, sales and service. Its appeal is a single contact record shared across teams; its main risk is cost growth as contact volumes and premium features expand.",
    rating: 4.4,
    startingPrice: "Free CRM available",
    pricingModel: "freemium",
    companyName: "HubSpot, Inc.",
    foundedYear: 2006,
    featured: true,
    active: true,
    bestFor: "Marketing and sales alignment",
    categorySlugs: ["crm", "marketing", "email-marketing"],
    features: [
      "Contact and deal management",
      "Email marketing and automation",
      "Landing pages and forms",
      "Reporting dashboards",
      "Service desk and ticketing",
    ],
    pros: [
      "Genuinely usable free CRM tier",
      "Strong onboarding and documentation",
      "One record across marketing, sales and support",
    ],
    cons: [
      "Costs scale steeply with contacts and premium hubs",
      "Some advanced reporting is gated to higher tiers",
      "Contract terms need careful review",
    ],
    pricingTiers: [
      {
        name: "Free",
        price: "$0",
        description: "Teams starting with a CRM.",
        highlights: ["Contact management", "Basic email tools"],
      },
      {
        name: "Starter",
        price: "Paid per seat",
        description: "Small teams needing automation.",
        highlights: ["Removes branding", "Simple automation", "Better reporting"],
      },
    ],
    faqs: [
      {
        question: "Is the free HubSpot CRM actually usable?",
        answer:
          "Yes for basic contact and deal tracking. Most teams hit limits once they need automation, custom reporting or removal of HubSpot branding.",
      },
    ],
    alternativeSlugs: ["notion"],
    verdict: "Best when marketing and sales need to work from the same record without integration work.",
    sponsored: false,
    seoTitle: null,
    seoDescription: null,
    updatedAt: "2026-06-19",
  },
  {
    id: "tool-hostinger",
    name: "Hostinger",
    slug: "hostinger",
    logoUrl: null,
    websiteUrl: "https://www.hostinger.com",
    shortDescription: "Budget-friendly web hosting",
    description:
      "Hostinger offers shared, WordPress and VPS hosting aimed at price-sensitive site owners. It competes primarily on introductory pricing and a simplified control panel rather than on advanced infrastructure controls.",
    rating: 4.3,
    startingPrice: "From $2.99/mo",
    pricingModel: "subscription",
    companyName: "Hostinger International",
    foundedYear: 2004,
    featured: true,
    active: true,
    bestFor: "Small sites on a budget",
    categorySlugs: ["hosting"],
    features: [
      "Shared and managed WordPress hosting",
      "Custom control panel",
      "Free SSL and email forwarding on most plans",
      "Global data centre choice",
      "Staging on higher plans",
    ],
    pros: [
      "Very low entry pricing",
      "Simple control panel for non-technical owners",
      "Reasonable performance for small sites",
    ],
    cons: [
      "Renewal pricing is materially higher than the intro rate",
      "Long commitments required for the headline price",
      "Fewer controls than developer-focused hosts",
    ],
    pricingTiers: [
      {
        name: "Shared",
        price: "From $2.99/mo",
        description: "Personal sites and small businesses.",
        highlights: ["Multiple sites", "Free SSL"],
      },
      {
        name: "Cloud",
        price: "Higher tier",
        description: "Sites outgrowing shared resources.",
        highlights: ["Dedicated resources", "Staging"],
      },
    ],
    faqs: [
      {
        question: "Why is renewal more expensive than the advertised price?",
        answer:
          "Introductory pricing usually assumes a multi-year term. Always check the renewal rate before committing — it is the number that matters over the life of the site.",
      },
    ],
    alternativeSlugs: ["shopify"],
    verdict: "Sensible for small sites where budget matters more than infrastructure control.",
    sponsored: true,
    seoTitle: null,
    seoDescription: null,
    updatedAt: "2026-05-30",
  },
];
