import { cn } from "@/lib/utils/cn";

export function Container({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-[1200px]",
        size === "wide" && "max-w-[1400px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
