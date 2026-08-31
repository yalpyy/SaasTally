import { Bot } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { Tool } from "@/types";

/**
 * Says, on the page itself, that nobody has checked this yet.
 *
 * The pipeline can publish a tool without an editor seeing it, which is only
 * defensible if the page admits it. So this is not a disclaimer bolted on for
 * safety — it is the condition under which automatic publishing is allowed at
 * all, and it names the source and the date so a reader can check the figures
 * themselves.
 *
 * It disappears the moment an editor saves the tool. Nothing else about the
 * page changes: an unreviewed tool is labelled, never demoted.
 */
export function CollectionNotice({ tool, className }: { tool: Tool; className?: string }) {
  if (tool.humanReviewed || !tool.factsCollectedAt) return null;

  let sourceHost: string | null = null;
  if (tool.factsSourceUrl) {
    try {
      sourceHost = new URL(tool.factsSourceUrl).host;
    } catch {
      sourceHost = null;
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-card border border-border bg-elevated/60 p-4 text-sm",
        className,
      )}
    >
      <Bot className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
      <p className="leading-relaxed text-muted">
        These details were collected automatically from{" "}
        {tool.factsSourceUrl && sourceHost ? (
          <a
            href={tool.factsSourceUrl}
            rel="nofollow noopener noreferrer"
            target="_blank"
            className="text-foreground underline underline-offset-4"
          >
            {sourceHost}
          </a>
        ) : (
          "the vendor's own site"
        )}{" "}
        on {formatDate(tool.factsCollectedAt)} and have not been reviewed by an editor yet. Confirm
        pricing with the vendor before you buy.
      </p>
    </div>
  );
}
