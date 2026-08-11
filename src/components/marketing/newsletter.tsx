"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/container";

/**
 * Phase 1 placeholder. No email infrastructure is connected yet, so the form
 * is explicit that nothing is stored rather than faking a successful signup.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  return (
    <section className="pb-20 sm:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-panel border border-border bg-card px-6 py-12 text-center sm:px-10">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl border border-border bg-elevated text-primary">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">
            One useful software recommendation a week.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            No launch spam, no affiliate blasts. Just one tool worth knowing about, with the reason
            it made the cut.
          </p>

          <form
            className="mx-auto mt-7 flex w-full max-w-md flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setTouched(true);
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-subtle focus:border-border-strong"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Subscribe
            </button>
          </form>

          <p aria-live="polite" className="mt-3 text-xs text-subtle">
            {touched
              ? "Signups are not live yet — email delivery is not connected in this build."
              : "Newsletter delivery is not connected yet. Nothing is stored."}
          </p>
        </div>
      </Container>
    </section>
  );
}
