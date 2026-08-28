import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

/**
 * Revalidate every public page hourly.
 *
 * Without this, live mode renders the catalogue once at build time and then
 * never again: an edit saved in the admin would not reach visitors until the
 * next deploy. The admin actions call `revalidatePath` for the pages they
 * touch, which handles the edit the editor just made; this is the safety net
 * for everything else — a row changed straight in Postgres, a program flipped
 * to paused, content that went live on a schedule.
 *
 * One hour is a deliberate compromise: long enough that the catalogue is still
 * served from cache for almost every request, short enough that nothing stays
 * wrong for a working day. Pages that read `searchParams` (search, filtered
 * listings) opt themselves out and stay dynamic.
 */
export const revalidate = 3600;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
