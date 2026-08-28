import type { Review } from "@/types";

/** DEV FIXTURE — see src/data/README.md */
export const reviews: Review[] = [
  {
    id: "rev-semrush",
    toolSlug: "semrush",
    title: "Semrush Review",
    slug: "semrush",
    quickVerdict:
      "A broad marketing research platform that earns its price for teams working across organic, paid and content at the same time.",
    score: 9.4,
    breakdown: [
      { label: "Features", score: 9.4 },
      { label: "Ease of Use", score: 8.8 },
      { label: "Value", score: 8.5 },
      { label: "Support", score: 9.0 },
    ],
    likes: [
      "Breadth of data across organic, paid and content",
      "Reporting that holds up in client conversations",
      "Consistent product investment over many years",
    ],
    improvements: [
      "Entry pricing puts it out of reach for many solo operators",
      "Seat and project limits require planning",
      "The surface area can overwhelm new users",
    ],
    featuresBody:
      "The core loop is research, track, audit and report. Keyword research feeds position tracking; site audits surface technical debt; the content toolkit turns findings into briefs. The paid search intelligence is the piece specialists rarely find elsewhere at the same depth.",
    pricingBody:
      "Pricing is tiered by limits rather than by capability alone, so the practical question is not which features you need but how many projects, keywords and seats you will consume. Teams frequently underestimate the seat cost. Check current vendor pricing before purchase — plans change.",
    experienceBody:
      "The interface is dense but consistent. Expect a real onboarding period; the payoff is that most research questions can be answered without leaving the platform.",
    audienceBody:
      "Best suited to in-house SEO teams and agencies. Solo consultants running a handful of sites should compare against lighter, cheaper options first.",
    finalVerdict:
      "If your work spans organic and paid research, Semrush consolidates several tools into one subscription and is worth evaluating seriously.",
    authorName: "SaaSTally Editorial",
    authorSlug: null,
    status: "published",
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
  },
  {
    id: "rev-ahrefs",
    toolSlug: "ahrefs",
    title: "Ahrefs Review",
    slug: "ahrefs",
    quickVerdict:
      "The sharper instrument for link intelligence and competitor teardown, with less depth on the paid search side.",
    score: 9.2,
    breakdown: [
      { label: "Features", score: 9.1 },
      { label: "Ease of Use", score: 9.2 },
      { label: "Value", score: 8.6 },
      { label: "Support", score: 8.4 },
    ],
    likes: [
      "Backlink index quality and refresh rate",
      "Fast, uncluttered interface",
      "Site Explorer is a genuinely efficient workflow",
    ],
    improvements: [
      "Credit-style limits interrupt exploratory work",
      "Thinner paid search data",
      "Fewer team collaboration features",
    ],
    featuresBody:
      "Site Explorer, Keywords Explorer, Site Audit, Rank Tracker and Content Explorer cover the practical SEO workflow. The crawler and link index are the differentiators.",
    pricingBody:
      "Plans scale on limits and historical access. Usage-based credits mean heavy research months cost more attention than budget. Confirm current pricing with the vendor.",
    experienceBody:
      "Among the least friction-heavy tools in the category. Most tasks are two or three clicks from the dashboard.",
    audienceBody:
      "Strongest for SEO specialists, link builders and content teams doing competitive research.",
    finalVerdict:
      "Choose Ahrefs when links and competitor analysis drive your decisions; look elsewhere if paid media research is central.",
    authorName: "SaaSTally Editorial",
    authorSlug: null,
    status: "published",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
  },
];
