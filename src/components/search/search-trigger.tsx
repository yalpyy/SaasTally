"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SearchDialog } from "./search-dialog";
import { cn } from "@/lib/utils/cn";

/** Navbar search affordance + global ⌘K / Ctrl+K shortcut. */
export function SearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search software"
        className={cn(
          "group flex h-9 items-center gap-2 rounded-full border border-border bg-card pl-3 pr-2 text-sm text-subtle transition-colors hover:border-border-strong hover:text-foreground",
          className,
        )}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-sans text-[10px] text-subtle lg:inline">
          ⌘K
        </kbd>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
