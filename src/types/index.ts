/**
 * Domain types for SaaSTally.
 *
 * These mirror the Postgres schema in `supabase/migrations` but are written by
 * hand so the app compiles before Supabase is configured. Once you run
 * `supabase gen types typescript`, keep these as the *application* types and
 * map from the generated database row types inside `src/services`.
 */

export type PricingModel =
  | "free"
  | "freemium"
  | "subscription"
  | "one-time"
  | "usage-based"
  | "custom";

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

export type AffiliateStatus = "active" | "paused" | "pending";

export type StaffRole = "admin" | "editor";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Lucide icon name, resolved through `src/lib/icons.ts`. */
  icon: string;
  featured: boolean;
  toolCount?: number;
}

export interface ToolPricingTier {
  name: string;
  price: string;
  description: string;
  highlights: string[];
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string;
  shortDescription: string;
  description: string;
  /**
   * Catalogue score out of 10, the same scale as a review's. Never derived
   * from affiliate commission.
   */
  rating: number | null;
  startingPrice: string | null;
  pricingModel: PricingModel;
  companyName: string | null;
  foundedYear: number | null;
  featured: boolean;
  active: boolean;
  bestFor: string | null;
  categorySlugs: string[];
  features: string[];
  pros: string[];
  cons: string[];
  pricingTiers: ToolPricingTier[];
  faqs: ToolFaq[];
  alternativeSlugs: string[];
  verdict: string | null;
  /** True when an active affiliate program exists for this tool. */
  sponsored: boolean;
  /**
   * When the ingest pipeline last filled these facts in, and from where.
   * Null means a person entered everything on this row.
   */
  factsCollectedAt: string | null;
  factsSourceUrl: string | null;
  /** False while nobody has checked what the pipeline collected. */
  humanReviewed: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

export interface RatingCriterion {
  label: string;
  /** Score out of 10. */
  score: number;
}

export interface Review {
  id: string;
  toolSlug: string;
  title: string;
  slug: string;
  quickVerdict: string;
  /**
   * Out of 10, like `breakdown` and `Tool.rating`. Still a separate figure
   * from the tool's: this is the score the review argues for, while the tool
   * rating is the catalogue's summary and exists for unreviewed tools too.
   */
  score: number;
  breakdown: RatingCriterion[];
  likes: string[];
  improvements: string[];
  featuresBody: string;
  pricingBody: string;
  experienceBody: string;
  audienceBody: string;
  finalVerdict: string;
  authorName: string;
  authorSlug: string | null;
  status: ContentStatus;
  publishedAt: string;
  updatedAt: string;
}

export interface ComparisonAttribute {
  label: string;
  /** Value for the first tool. */
  a: string;
  /** Value for the second tool. */
  b: string;
  /** Which side we consider stronger for this attribute, if either. */
  winner: "a" | "b" | "tie";
}

export interface Comparison {
  id: string;
  slug: string;
  title: string;
  toolSlugs: [string, string];
  quickVerdict: string;
  attributes: ComparisonAttribute[];
  recommendation: string;
  status: ContentStatus;
  publishedAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Markdown-ish body. See `src/lib/utils/markdown.ts` for the renderer. */
  content: string;
  featuredImage: string | null;
  status: ContentStatus;
  authorName: string;
  authorSlug: string | null;
  categorySlug: string | null;
  readingMinutes: number;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  publishedAt: string;
  updatedAt: string;
}

export interface BestListItem {
  toolSlug: string;
  /** Why this tool earns this spot. Editorial, and often the whole point. */
  blurb: string | null;
}

export interface BestList {
  slug: string;
  title: string;
  description: string;
  /** States the criteria before the conclusions. Optional. */
  intro: string;
  categorySlug: string;
  /** Editorially ordered. Position is a judgement, never a commission figure. */
  items: BestListItem[];
  status: ContentStatus;
  updatedAt: string;
}

export interface AffiliateProgram {
  id: string;
  toolSlug: string;
  network: string;
  programName: string;
  affiliateUrl: string;
  commissionType: "percentage" | "flat" | "hybrid";
  commissionValue: string;
  cookieDays: number;
  status: AffiliateStatus;
}

export type SearchResultType =
  | "tool"
  | "category"
  | "article"
  | "comparison"
  | "best"
  | "review";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
  score: number;
}
