import { ImageIcon } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ModeBanner } from "@/components/admin/mode-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStaff } from "@/lib/auth";
import { listBucketStatus, type BucketName } from "@/lib/storage";

export const metadata = { title: "Media" };

// Asks Storage for the real state of each bucket, so never cached.
export const dynamic = "force-dynamic";

const descriptions: Record<BucketName, string> = {
  "tool-logos": "Vendor logos, collected by the ingest pipeline from each vendor's own markup.",
  "tool-screenshots": "Product screenshots. Uploaded by hand from a tool's edit page.",
  "article-images": "Guide hero and inline images.",
  authors: "Author avatars.",
  "site-assets": "OG images, brand assets and static illustrations.",
};

export default async function AdminMediaPage() {
  const profile = await requireStaff();
  const buckets = await listBucketStatus();

  const missing = (buckets ?? []).filter((bucket) => !bucket.exists);

  return (
    <>
      <AdminHeader profile={profile} title="Media" />
      <div className="space-y-6 p-5 sm:p-8">
        <ModeBanner />

        {buckets === null ? (
          <EmptyState
            icon={<ImageIcon className="size-5" aria-hidden="true" />}
            title="Storage cannot be reached"
            description="Reading bucket status needs SUPABASE_SECRET_KEY on the server. Without it the app still renders whatever logos are already on the rows, but nothing can be uploaded or collected."
          />
        ) : (
          <>
            {missing.length > 0 ? (
              <Card className="border-l-2 border-l-warning p-5 text-sm leading-relaxed text-muted">
                <p className="font-medium text-foreground">
                  {missing.length} bucket{missing.length === 1 ? " is" : "s are"} missing
                </p>
                <p className="mt-2">
                  Run <code className="text-xs">supabase/migrations/0007_storage_and_screenshots.sql</code>{" "}
                  against the project. It creates the buckets and the policies on{" "}
                  <code className="text-xs">storage.objects</code> — without those, an upload fails
                  even for a signed-in admin, because storage has row-level security on by default
                  and no policies of its own.
                </p>
              </Card>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buckets.map((bucket) => (
                <Card key={bucket.name} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-sm font-medium">{bucket.name}</p>
                    <Badge tone={bucket.exists ? "primary" : "outline"}>
                      {bucket.exists ? "Ready" : "Missing"}
                    </Badge>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {descriptions[bucket.name]}
                  </p>

                  {bucket.exists ? (
                    <p className="mt-3 text-xs text-subtle">
                      {bucket.error
                        ? bucket.error
                        : bucket.objects === 0
                          ? "Empty"
                          : `${bucket.objects} object${bucket.objects === 1 ? "" : "s"} at the root`}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>

            <Card className="p-5 text-sm leading-relaxed text-muted">
              <p className="font-medium text-foreground">Who puts what here</p>
              <p className="mt-2">
                Logos arrive on their own: the pipeline reads the mark a vendor publishes in their
                own markup and stores a copy, which is the same nominative use as printing their
                name. It never replaces a logo that is already set.
              </p>
              <p className="mt-2">
                Screenshots do not, and will not. A screenshot asserts what a product looks like
                today — that is a claim, and claims on this site are made by people. Upload them
                from the tool&apos;s edit page.
              </p>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
