import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-200 select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "bg-card text-foreground border border-border hover:bg-card-hover hover:border-border-strong",
  outline: "border border-border-strong text-foreground hover:bg-card-hover",
  ghost: "text-muted hover:text-foreground hover:bg-card-hover",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = StyleProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

type LinkProps = StyleProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

/** Standard button. Use `<ButtonLink>` when the action is navigation. */
export function Button({ variant, size, className, ...rest }: ButtonProps) {
  return <button className={buttonClasses({ variant, size, className })} {...rest} />;
}

/**
 * Navigation-styled button. Renders a plain `<a>` for external destinations and
 * for `/go/...` affiliate redirects (which must not be client-side routed).
 */
export function ButtonLink({ variant, size, className, href, ...rest }: LinkProps) {
  const classes = buttonClasses({ variant, size, className });
  const isExternal = href.startsWith("http") || href.startsWith("/go/") || href.startsWith("mailto:");

  if (isExternal) {
    return <a className={classes} href={href} {...rest} />;
  }

  return <Link className={classes} href={href} {...rest} />;
}
