import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Admin-scoped content reads.
 *
 * Separate from the public services for the same reason `admin-tools` is: the
 * public ones read anonymously and only ever see `published` rows, while an
 * editor has to be able to open a draft. Everything here goes through the
 * session client, so RLS re-checks the staff role.
 *
 * These return **form-ready strings**, which keeps the form components dumb
 * and the date/number conversions in one place.
 */

const str = (value: string | null): string => value ?? "";
const num = (value: number | null): string => (value === null ? "" : String(value));

/** `datetime-local` wants `YYYY-MM-DDTHH:mm`, not a full ISO string. */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

/* ------------------------------------------------------------------------- */
/* Authors                                                                   */
/* ------------------------------------------------------------------------- */

export interface AdminAuthorRow {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatarUrl: string;
  linkX: string;
  linkLinkedin: string;
  linkWebsite: string;
  updatedAt: string;
}

interface AuthorRow {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  links: Record<string, string> | null;
  updated_at: string;
}

function mapAuthor(row: AuthorRow): AdminAuthorRow {
  const links = row.links ?? {};
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    title: str(row.title),
    bio: str(row.bio),
    avatarUrl: str(row.avatar_url),
    linkX: str(links.x ?? null),
    linkLinkedin: str(links.linkedin ?? null),
    linkWebsite: str(links.website ?? null),
    updatedAt: row.updated_at,
  };
}

export async function listAuthorsForAdmin(): Promise<AdminAuthorRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("authors")
    .select("id, name, slug, title, bio, avatar_url, links, updated_at")
    .order("name", { ascending: true });

  if (error || !data) return null;
  return (data as unknown as AuthorRow[]).map(mapAuthor);
}

export async function getAuthorForEdit(id: string): Promise<AdminAuthorRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("authors")
    .select("id, name, slug, title, bio, avatar_url, links, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapAuthor(data as unknown as AuthorRow);
}

/** Just enough to fill a byline dropdown. */
export interface AuthorOption {
  id: string;
  name: string;
}

export async function listAuthorOptions(): Promise<AuthorOption[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("authors")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as unknown as AuthorOption[];
}

/* ------------------------------------------------------------------------- */
/* Reviews                                                                   */
/* ------------------------------------------------------------------------- */

export interface AdminReviewRow {
  id: string;
  toolId: string;
  toolName: string;
  title: string;
  slug: string;
  quickVerdict: string;
  score: string;
  /** `Label: 8.5` per line, matching how the form collects it. */
  breakdown: string;
  likes: string;
  improvements: string;
  featuresBody: string;
  pricingBody: string;
  experienceBody: string;
  audienceBody: string;
  finalVerdict: string;
  authorId: string;
  authorName: string;
  status: string;
  publishedAt: string;
  updatedAt: string;
}

interface ReviewEditRow {
  id: string;
  tool_id: string;
  title: string;
  slug: string;
  quick_verdict: string | null;
  score: number | null;
  breakdown: { label: string; score: number }[] | null;
  likes: string[] | null;
  improvements: string[] | null;
  features_body: string | null;
  pricing_body: string | null;
  experience_body: string | null;
  audience_body: string | null;
  final_verdict: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
  tools: { name: string } | null;
  authors: { name: string } | null;
}

const reviewSelection =
  "id, tool_id, title, slug, quick_verdict, score, breakdown, likes, improvements, features_body, pricing_body, experience_body, audience_body, final_verdict, author_id, status, published_at, updated_at, tools(name), authors(name)";

function mapReview(row: ReviewEditRow): AdminReviewRow {
  return {
    id: row.id,
    toolId: row.tool_id,
    toolName: row.tools?.name ?? "Unknown tool",
    title: row.title,
    slug: row.slug,
    quickVerdict: str(row.quick_verdict),
    score: num(row.score),
    breakdown: (row.breakdown ?? [])
      .map((criterion) => `${criterion.label}: ${criterion.score}`)
      .join("\n"),
    likes: (row.likes ?? []).join("\n"),
    improvements: (row.improvements ?? []).join("\n"),
    featuresBody: str(row.features_body),
    pricingBody: str(row.pricing_body),
    experienceBody: str(row.experience_body),
    audienceBody: str(row.audience_body),
    finalVerdict: str(row.final_verdict),
    authorId: str(row.author_id),
    authorName: row.authors?.name ?? "SaaSTally Editorial",
    status: row.status,
    publishedAt: toLocalInput(row.published_at),
    updatedAt: row.updated_at,
  };
}

export async function listReviewsForAdmin(): Promise<AdminReviewRow[] | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select(reviewSelection)
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as unknown as ReviewEditRow[]).map(mapReview);
}

export async function getReviewForEdit(id: string): Promise<AdminReviewRow | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .select(reviewSelection)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapReview(data as unknown as ReviewEditRow);
}
