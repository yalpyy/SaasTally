import Image from "next/image";
import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * We never ship third-party brand assets in the repo — a logo is either
 * collected by the ingest pipeline into Supabase Storage or absent, and an
 * absent one renders as a neutral monogram tile.
 */
export function ToolLogo({
  name,
  src,
  size = 44,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const classes = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-elevated",
    className,
  );

  if (src) {
    return (
      <span className={classes} style={{ width: size, height: size }}>
        <Image
          src={src}
          alt={`${name} logo`}
          width={size}
          height={size}
          // The optimiser refuses SVG unless the app opts into serving
          // untrusted markup, so these are passed through as a plain <img>.
          // That is also what makes them safe: script in an SVG does not run
          // when the file is the source of an image element.
          unoptimized={src.endsWith(".svg")}
          className="size-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span
      className={classes}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="text-[0.8em] font-semibold tracking-tight text-muted">
        {initials(name)}
      </span>
    </span>
  );
}
