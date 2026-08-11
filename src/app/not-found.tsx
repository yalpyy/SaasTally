import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center py-20">
      <Container size="narrow" className="text-center">
        <Link href="/" aria-label="SaaSTally home" className="inline-flex">
          <LogoMark className="size-9" />
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-primary">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          We could not find that page.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          The link may be outdated, or the page may have moved as our catalogue changed.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto"
          >
            <Home className="size-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/software"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-card-hover sm:w-auto"
          >
            <Compass className="size-4" aria-hidden="true" />
            Browse software
          </Link>
          <Link
            href="/search"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-card-hover sm:w-auto"
          >
            <Search className="size-4" aria-hidden="true" />
            Search
          </Link>
        </div>
      </Container>
    </div>
  );
}
