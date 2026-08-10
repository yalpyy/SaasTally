import { ImageIcon } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "Media" };

const buckets = [
  { name: "tool-logos", body: "Vendor logos. Public read, staff write." },
  { name: "tool-screenshots", body: "Evidence screenshots supporting editorial claims." },
  { name: "article-images", body: "Guide hero and inline images." },
  { name: "authors", body: "Author avatars." },
  { name: "site-assets", body: "OG images, brand assets and static illustrations." },
];

export default async function AdminMediaPage() {
  const profile = await requireStaff();

  return (
    <>
      <AdminHeader profile={profile} title="Media" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buckets.map((bucket) => (
            <Card key={bucket.name} className="p-5">
              <p className="font-mono text-sm font-medium">{bucket.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{bucket.body}</p>
            </Card>
          ))}
        </div>

        <EmptyState
          icon={<ImageIcon className="size-5" aria-hidden="true" />}
          title="Storage is not connected"
          description="Create the buckets above in Supabase Storage, then wire the upload UI. Until then, the app renders monogram placeholders instead of vendor logos."
        />
      </div>
    </>
  );
}
