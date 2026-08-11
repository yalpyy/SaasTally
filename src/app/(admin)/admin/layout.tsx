import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | SaaSTally Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate. Every child page also calls requireStaff() so that a
  // future route added outside this layout cannot accidentally be public.
  const profile = await requireStaff();

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
