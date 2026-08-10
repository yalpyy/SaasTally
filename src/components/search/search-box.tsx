"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { ResultList } from "./result-list";
import { cn } from "@/lib/utils/cn";

const examples = [
  { label: "SEO", href: "/categories/seo" },
  { label: "AI Writing", href: "/categories/ai" },
  { label: "CRM", href: "/categories/crm" },
  { label: "Hosting", href: "/categories/hosting" },
  { label: "Project Management", href: "/categories/project-management" },
  { label: "Email Marketing", href: "/categories/email-marketing" },
];

/**
 * Hero search. Interactive from first paint: suggestions appear as soon as the
 * user types, and submitting always lands on the full /search page.
 */
export function SearchBox({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { results, isLoading } = useSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const showPanel = focused && query.trim().length >= 2;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={containerRef}
        className="relative"
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) setFocused(false);
        }}
      >
        <form
          onSubmit={onSubmit}
          role="search"
          className={cn(
            "relative flex items-center gap-3 rounded-2xl border border-border bg-card px-4 transition-shadow duration-300",
            focused ? "border-border-strong shadow-[0_0_0_4px_var(--accent-soft)]" : "shadow-[var(--elevation-1)]",
          )}
        >
          <Search className="size-[18px] shrink-0 text-subtle" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search software, categories or use cases..."
            aria-label="Search software, categories or use cases"
            className="h-14 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-subtle sm:h-16"
          />
          {isLoading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-subtle" aria-hidden="true" />
          ) : null}
          <button
            type="submit"
            aria-label="Search"
            className="hidden h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:flex"
          >
            Search
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>

        <AnimatePresence>
          {showPanel ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border bg-elevated p-2 text-left shadow-[var(--elevation-2)]"
            >
              {results.length > 0 ? (
                <ResultList results={results} onNavigate={() => setFocused(false)} />
              ) : (
                <p className="px-3 py-6 text-center text-sm text-subtle">
                  {isLoading ? "Searching…" : "No matches yet — try a category or a tool name."}
                </p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-subtle">Popular:</span>
        {examples.map((example) => (
          <button
            key={example.href}
            type="button"
            onClick={() => router.push(example.href)}
            className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
