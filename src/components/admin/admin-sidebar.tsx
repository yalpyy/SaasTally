"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  GitCompareArrows,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  ListOrdered,
  Package,
  RadioTower,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";
import type { StaffRole } from "@/types";

const items = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true, adminOnly: false },
  { href: "/admin/tools", label: "Tools", Icon: Package, exact: false, adminOnly: false },
  { href: "/admin/categories", label: "Categories", Icon: LayoutGrid, exact: false, adminOnly: false },
  { href: "/admin/articles", label: "Articles", Icon: FileText, exact: false, adminOnly: false },
  { href: "/admin/reviews", label: "Reviews", Icon: Star, exact: false, adminOnly: false },
  {
    href: "/admin/comparisons",
    label: "Comparisons",
    Icon: GitCompareArrows,
    exact: false,
    adminOnly: false,
  },
  { href: "/admin/best", label: "Best lists", Icon: ListOrdered, exact: false, adminOnly: false },
  { href: "/admin/authors", label: "Authors", Icon: Users, exact: false, adminOnly: false },
  { href: "/admin/sources", label: "Sources", Icon: RadioTower, exact: false, adminOnly: false },
  { href: "/admin/affiliate", label: "Affiliate", Icon: Link2, exact: false, adminOnly: true },
  { href: "/admin/media", label: "Media", Icon: ImageIcon, exact: false, adminOnly: false },
  { href: "/admin/settings", label: "Settings", Icon: Settings, exact: false, adminOnly: true },
];

export function AdminSidebar({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const visible = items.filter((item) => !item.adminOnly || role === "admin");

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-elevated lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <LogoMark className="size-6" />
        <span className="text-sm font-semibold tracking-tight">
          SaaS<span className="text-primary">Tally</span>
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-subtle">Admin</span>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {visible.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-card text-foreground"
                      : "text-muted hover:bg-card hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
        >
          <BarChart3 className="size-4" aria-hidden="true" />
          View public site
        </Link>
      </div>
    </aside>
  );
}
