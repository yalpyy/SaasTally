import { Container } from "@/components/ui/container";

/** Skeleton shaped like the most common page (header + card grid). */
export default function Loading() {
  return (
    <Container className="py-16">
      <div className="animate-pulse space-y-8">
        <div className="space-y-4">
          <div className="h-3 w-40 rounded-full bg-card-hover" />
          <div className="h-9 w-2/3 max-w-md rounded-lg bg-card-hover" />
          <div className="h-4 w-full max-w-xl rounded-full bg-card-hover" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-44 rounded-card border border-border bg-card" />
          ))}
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading
      </span>
    </Container>
  );
}
