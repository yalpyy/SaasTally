import type { Metadata } from "next";
import { Mail, MessageSquare, Building2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Corrections, editorial questions and vendor enquiries for SaaSTally.",
  path: "/contact",
});

const channels = [
  {
    Icon: MessageSquare,
    title: "Corrections",
    body: "Found something out of date or wrong? Send the page URL and what should change. Corrections are prioritised over everything else.",
  },
  {
    Icon: Building2,
    title: "Vendors",
    body: "Product updates, pricing changes and factual corrections are welcome. Placement and rankings are not for sale.",
  },
  {
    Icon: Mail,
    title: "Everything else",
    body: "Partnerships, press and general questions.",
  },
];

export default function ContactPage() {
  return (
    <Container size="narrow" className="py-12 sm:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact", href: "/contact" },
        ]}
        className="mb-6"
      />

      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contact</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        We read everything. Corrections get answered first.
      </p>

      <div className="mt-10 space-y-4">
        {channels.map(({ Icon, title, body }) => (
          <Card key={title} className="flex gap-4 p-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-primary">
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-[15px] font-semibold">Email</h2>
        <p className="mt-2 text-sm text-muted">
          A contact form will be wired up once email infrastructure is connected. Until then, use the
          address published on your deployed site.
        </p>
      </Card>
    </Container>
  );
}
