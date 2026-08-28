/**
 * Hand-maintained row types matching `supabase/migrations/0001_init.sql`.
 *
 * Once your Supabase project exists, replace this file with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 * The service layer maps these rows into the application types in `src/types`.
 */

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string;
  short_description: string | null;
  description: string | null;
  rating: number | null;
  starting_price: string | null;
  pricing_model: string;
  company_name: string | null;
  founded_year: number | null;
  best_for: string | null;
  features: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  pricing_tiers: unknown;
  faqs: unknown;
  verdict: string | null;
  featured: boolean;
  active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  status: string;
  /** References `authors` since migration 0004; null means the house byline. */
  author_id: string | null;
  category_slug: string | null;
  reading_minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProgramRow {
  id: string;
  tool_id: string;
  network: string | null;
  program_name: string | null;
  affiliate_url: string;
  commission_type: string | null;
  commission_value: string | null;
  cookie_days: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}
