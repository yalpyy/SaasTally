export const siteConfig = {
  name: "SaaSTally",
  tagline: "Compare software. Choose smarter.",
  description:
    "Independent software comparisons, reviews and recommendations to help you choose the right tools.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_US",
  twitter: "@saastally",
  affiliateDisclosure:
    "SaaSTally may earn a commission when you purchase through selected links. This does not affect how products are evaluated.",
  nav: [
    { label: "Software", href: "/software" },
    { label: "Categories", href: "/categories" },
    { label: "AI Tools", href: "/categories/ai" },
    { label: "Comparisons", href: "/compare" },
    { label: "Reviews", href: "/reviews" },
    { label: "Best Tools", href: "/best" },
  ],
  footer: [
    {
      title: "Discover",
      links: [
        { label: "Software", href: "/software" },
        { label: "Categories", href: "/categories" },
        { label: "Best Tools", href: "/best" },
        { label: "Comparisons", href: "/compare" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Reviews", href: "/reviews" },
        { label: "Guides", href: "/articles" },
        { label: "Alternatives", href: "/alternatives" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

export function absoluteUrl(path = "/"): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
