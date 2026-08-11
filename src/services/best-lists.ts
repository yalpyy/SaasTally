import { bestLists as fixtureBestLists } from "@/data/best-lists";
import type { BestList } from "@/types";

export async function getBestLists(): Promise<BestList[]> {
  return fixtureBestLists;
}

export async function getBestListBySlug(slug: string): Promise<BestList | null> {
  const all = await getBestLists();
  return all.find((list) => list.slug === slug) ?? null;
}

export async function getBestListSlugs(): Promise<string[]> {
  return (await getBestLists()).map((list) => list.slug);
}
