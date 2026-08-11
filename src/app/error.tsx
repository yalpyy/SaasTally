"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with your error reporting service when one is configured.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center py-20">
      <Container size="narrow" className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Something went wrong.</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          The page failed to load. Trying again usually fixes it — if it does not, the issue is on
          our side and we are looking into it.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-subtle">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-card-hover sm:w-auto"
          >
            Back to home
          </Link>
        </div>
      </Container>
    </div>
  );
}
