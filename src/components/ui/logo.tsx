import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Tally mark: four uprights plus a diagonal strike. Simplified enough to stay
 * legible at favicon size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <g
        stroke="var(--primary-foreground)"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.95"
      >
        <path d="M7.5 6.5v11" />
        <path d="M11 6.5v11" />
        <path d="M14.5 6.5v11" />
        <path d="M5.5 17.5 17 6.5" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label="SaaSTally home"
    >
      <LogoMark />
      {showWordmark ? (
        <span className="text-[17px] font-semibold tracking-tight">
          SaaS<span className="text-primary">Tally</span>
        </span>
      ) : null}
    </Link>
  );
}
