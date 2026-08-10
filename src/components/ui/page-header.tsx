import { Container } from "./container";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  meta,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border bg-elevated/50 py-12 sm:py-16", className)}>
      <Container>
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-5" /> : null}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-[44px] md:leading-[1.1]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-6">{meta}</div> : null}
      </Container>
    </div>
  );
}
