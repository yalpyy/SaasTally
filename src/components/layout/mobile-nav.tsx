"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { siteConfig } from "@/lib/site";
import { easeOut } from "@/lib/motion";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  /**
   * Lock the page behind the menu.
   *
   * `overflow: hidden` on the body alone does not stop iOS Safari scrolling
   * the document, and a page that keeps moving under an open menu is how the
   * content behind ends up showing at the edges — Safari collapses its address
   * bar as you scroll, and the viewport grows out from under a fixed overlay.
   *
   * Pinning the body and offsetting it by the current scroll position holds it
   * still on every browser. The offset has to be put back on close, or leaving
   * the menu jumps the reader to the top of the page.
   */
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground lg:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            // min-h-dvh, not just inset-0: on iOS the layout viewport is the
            // taller one with the address bar hidden, so an overlay sized to
            // it can fall short of the visible area and let the page show
            // through at the bottom. Scrollable so a long menu still reaches
            // its footer on a short screen.
            className="fixed inset-0 z-[90] min-h-dvh overflow-y-auto bg-background lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex h-16 items-center justify-between px-5">
              <span className="text-[17px] font-semibold tracking-tight">
                SaaS<span className="text-primary">Tally</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="px-5 pt-4">
              <ul className="space-y-1">
                {siteConfig.nav.map((item, index) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.35, ease: easeOut }}
                  >
                    <Link
                      href={item.href}
                      className="block border-b border-border py-4 text-lg font-medium"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-8 flex items-center justify-between">
                <Link
                  href="/software"
                  className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  Explore Tools
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
