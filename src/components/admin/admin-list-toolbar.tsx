import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

/**
 * The row above every admin table: a count on the left, a create button on the
 * right. In mock mode the button is visibly disabled rather than hidden —
 * nothing should ever pretend a write succeeded, and a missing button reads as
 * a bug rather than as "connect a database".
 */
export function AdminListToolbar({
  count,
  noun,
  createHref,
  live,
}: {
  count: number;
  /** Singular. The plural is the singular plus an s. */
  noun: string;
  createHref: string;
  live: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {count} {noun}
        {count === 1 ? "" : "s"}
      </p>

      {live ? (
        <Link
          href={createHref}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-4" aria-hidden="true" />
          New {noun}
        </Link>
      ) : (
        <span
          title="Connect Supabase to create records"
          className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          New {noun}
        </span>
      )}
    </div>
  );
}

/** The edit cell of an admin table, or a note saying why there isn't one. */
export function EditCell({ href, live }: { href: string; live: boolean }) {
  if (!live) return <span className="text-xs text-subtle">Read-only</span>;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover"
    >
      <Pencil className="size-3.5" aria-hidden="true" />
      Edit
    </Link>
  );
}
