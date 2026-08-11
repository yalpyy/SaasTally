import { cn } from "@/lib/utils/cn";

export function Card({
  children,
  className,
  interactive = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "li" | "section";
}) {
  return (
    <Tag
      className={cn(
        "relative rounded-card border border-border bg-card",
        interactive &&
          "transition-colors duration-200 hover:border-border-strong hover:bg-card-hover",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
