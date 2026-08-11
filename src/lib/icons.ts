import {
  Sparkles,
  Search,
  Megaphone,
  Palette,
  Server,
  ShoppingCart,
  Users,
  KanbanSquare,
  Workflow,
  Code2,
  Zap,
  BarChart3,
  ShieldCheck,
  Mail,
  type LucideIcon,
} from "lucide-react";

/**
 * Category icons are stored in the database as stable string keys so editors
 * never paste raw component names. Unknown keys fall back to `Sparkles`.
 */
export const categoryIcons: Record<string, LucideIcon> = {
  ai: Sparkles,
  seo: Search,
  marketing: Megaphone,
  design: Palette,
  hosting: Server,
  ecommerce: ShoppingCart,
  crm: Users,
  "project-management": KanbanSquare,
  automation: Workflow,
  "developer-tools": Code2,
  productivity: Zap,
  analytics: BarChart3,
  security: ShieldCheck,
  email: Mail,
};

export function getCategoryIcon(key: string | null | undefined): LucideIcon {
  if (!key) return Sparkles;
  return categoryIcons[key] ?? Sparkles;
}
