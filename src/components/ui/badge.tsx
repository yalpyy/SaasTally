import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "primary" | "outline" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-card-hover text-muted border-border",
  primary: "bg-accent-soft text-primary border-transparent",
  outline: "bg-transparent text-muted border-border",
  warning: "bg-transparent text-warning border-warning/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
