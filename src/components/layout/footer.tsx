import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-elevated">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-16">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-[17px] font-semibold tracking-tight">
                SaaS<span className="text-primary">Tally</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{siteConfig.description}</p>
          </div>

          {siteConfig.footer.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p className="text-sm text-subtle">{siteConfig.tagline}</p>
        </div>

        <p className="pb-8 text-xs leading-relaxed text-subtle">{siteConfig.affiliateDisclosure}</p>
      </Container>
    </footer>
  );
}
