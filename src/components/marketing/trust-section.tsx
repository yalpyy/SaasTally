import Link from "next/link";
import { FileSearch, Scale, Eye, Ban } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section-heading";
import { AnimatedSection, AnimatedItem } from "@/components/ui/animated-section";

const principles = [
  {
    Icon: FileSearch,
    title: "Real product research",
    body: "Every entry is built from documentation, pricing pages, changelogs and hands-on notes recorded by the author. Where we have not used a product ourselves, we say so.",
  },
  {
    Icon: Scale,
    title: "Transparent comparisons",
    body: "Comparisons state the criteria before the conclusion, so you can disagree with our weighting and still use the data.",
  },
  {
    Icon: Eye,
    title: "Clear affiliate disclosure",
    body: "Affiliate links are labelled on the page they appear, not buried in a footer nobody reads.",
  },
  {
    Icon: Ban,
    title: "No pay-to-win rankings",
    body: "Commission rates are stored separately from editorial scores and are never an input to ranking or ordering.",
  },
];

export function TrustSection() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Methodology"
        title="How SaaSTally evaluates software"
        description="We would rather be useful than loud. Here is the standard every page is held to."
      />

      <AnimatedSection className="mt-10 grid gap-4 sm:grid-cols-2">
        {principles.map(({ Icon, title, body }) => (
          <AnimatedItem key={title} className="h-full">
            <div className="flex h-full gap-4 rounded-card border border-border bg-card p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-primary">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </div>
          </AnimatedItem>
        ))}
      </AnimatedSection>

      <p className="mt-6 text-sm text-subtle">
        Questions about our process?{" "}
        <Link href="/about" className="text-foreground underline underline-offset-4">
          Read more about SaaSTally
        </Link>
        .
      </p>
    </Section>
  );
}
