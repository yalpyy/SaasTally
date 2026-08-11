"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Search, X } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { ResultList } from "./result-list";
import { EmptyState } from "@/components/ui/empty-state";

const quickLinks = [
  { label: "SEO", href: "/categories/seo" },
  { label: "AI Tools", href: "/categories/ai" },
  { label: "CRM", href: "/categories/crm" },
  { label: "Hosting", href: "/categories/hosting" },
];

/**
 * Command-palette style search. Accessible dialog: focus is moved in on open,
 * Escape closes, background scroll is locked, and the trigger is restored.
 */
export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const { results, isLoading } = useSearch(query, { enabled: open });
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    close();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search SaaSTally"
            className="relative w-full max-w-xl overflow-hidden rounded-panel border border-border bg-elevated shadow-[var(--elevation-2)]"
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.18 }}
          >
            <form onSubmit={onSubmit} className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-subtle" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search software, categories or use cases..."
                aria-label="Search software, categories or use cases"
                className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-subtle"
              />
              {isLoading ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-subtle" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="rounded-lg p-1.5 text-subtle transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="px-3 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-subtle">
                    Popular
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickLinks.map((link) => (
                      <button
                        key={link.href}
                        type="button"
                        onClick={() => {
                          close();
                          router.push(link.href);
                        }}
                        className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <ResultList results={results} onNavigate={close} />
              ) : isLoading ? (
                <p className="px-3 py-8 text-center text-sm text-subtle">Searching…</p>
              ) : (
                <EmptyState
                  className="border-0 bg-transparent py-10"
                  title="No matches yet"
                  description="Try a category like “SEO”, a tool name, or a use case such as “email marketing”."
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
