import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getCategoryIcon } from "@/lib/icons";
import type { Category } from "@/types";

/**
 * Slow, CSS-driven marquee (no JS, no Motion). Pauses on hover and freezes
 * entirely under prefers-reduced-motion via globals.css.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  const track = [...categories, ...categories];

  return (
    <section className="border-y border-border bg-elevated py-10" aria-labelledby="discovery-strip">
      <Container>
        <h2 id="discovery-strip" className="text-center text-sm text-muted">
          Discover tools for every part of your business.
        </h2>
      </Container>

      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="animate-marquee flex w-max items-center gap-3">
          {track.map((category, index) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <li key={`${category.slug}-${index}`}>
                <Link
                  href={`/categories/${category.slug}`}
                  tabIndex={index < categories.length ? 0 : -1}
                  aria-hidden={index >= categories.length}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground"
                >
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
