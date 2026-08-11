import type { PricingModel } from "@/types";
import { Badge } from "./badge";

const labels: Record<PricingModel, string> = {
  free: "Free",
  freemium: "Freemium",
  subscription: "Subscription",
  "one-time": "One-time",
  "usage-based": "Usage-based",
  custom: "Custom pricing",
};

export function PricingBadge({
  startingPrice,
  model,
}: {
  startingPrice: string | null;
  model: PricingModel;
}) {
  if (startingPrice) {
    return (
      <span className="text-sm font-medium">
        {startingPrice}
        <span className="ml-1.5 text-xs font-normal text-subtle">{labels[model]}</span>
      </span>
    );
  }

  return <Badge tone="outline">{labels[model]}</Badge>;
}
