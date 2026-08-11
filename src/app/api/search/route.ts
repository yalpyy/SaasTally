import { NextResponse } from "next/server";
import { search } from "@/lib/search";

/**
 * Search endpoint used by the navbar dialog and hero search box.
 * Excluded from indexing via robots.ts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").slice(0, 80);

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await search(query, 8);

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
  );
}
