"use client";

import { useEffect, useState } from "react";
import type { SearchResult } from "@/types";

/**
 * Debounced search against `/api/search`. Aborts in-flight requests so results
 * never arrive out of order.
 */
export function useSearch(query: string, { enabled = true, delay = 180 } = {}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!enabled || trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search request failed");
        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, enabled, delay]);

  return { results, isLoading };
}
