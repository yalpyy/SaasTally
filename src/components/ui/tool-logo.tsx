import Image from "next/image";
import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * We never ship third-party brand assets in the repo. When a tool has no
 * uploaded logo in Supabase Storage we render a neutral monogram tile instead.
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
