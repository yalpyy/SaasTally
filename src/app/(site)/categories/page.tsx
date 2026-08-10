import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { CategoryCard } from "@/components/categories/category-card";
import { getCategories } from "@/services/categories";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Software categories",
  description:
    "Browse software by category — AI, SEO, hosting, CRM, e-commerce, analytics and more.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await getCategories();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
  ];

  return (
    <>
      <PageHeader
        title="Categories"
        description="Start from the job you need done, then narrow to a shortlist you can defend."
        breadcrumbs={breadcrumbs}
      />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </Container>

      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
    </>
  );
}
