"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For individuals getting started",
    features: [
      "3 contracts per month",
      "Basic AI analysis",
      "5 MB upload limit",
    ],
    current: true,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$12",
    period: "/month",
    description: "For professionals and creators",
    features: [
      "Unlimited contracts",
      "Advanced AI analysis",
      "Priority support",
      "50 MB upload limit",
    ],
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$29",
    period: "/user/month",
    description: "For teams and organizations",
    features: [
      "Everything in Plus",
      "Team collaboration",
      "Admin controls",
      "API access",
    ],
  },
];

export default function BillingPage() {
  const { profile } = useAuth();
  const currentTier = profile?.subscription_tier || "free";

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg font-medium text-muted-foreground">Manage your subscription</h1>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl border p-5 transition-all flex flex-col",
                  plan.popular
                    ? "border-purple-500/50 bg-purple-500/5"
                    : "border-border bg-card"
                )}
              >
                {/* Plan Name */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-2xl font-semibold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mb-4">
                  {plan.description}
                </p>

                {/* Features */}
                <div className="space-y-2 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-foreground" strokeWidth={3} />
                      </div>
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className={cn(
                    "w-full py-2 mt-5 text-xs font-semibold rounded-lg transition-colors",
                    isCurrentPlan
                      ? "bg-muted text-muted-foreground cursor-default"
                      : plan.popular
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-foreground text-background hover:bg-foreground/90"
                  )}
                >
                  {isCurrentPlan ? "Current plan" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Method */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">Payment Method</h2>
          <p className="text-xs text-muted-foreground mb-3">
            No payment method on file
          </p>
          <button className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors">
            Add payment method
          </button>
        </div>

        {/* Billing History */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">Billing History</h2>
          <p className="text-xs text-muted-foreground">
            No billing history yet
          </p>
        </div>
      </div>
    </div>
  );
}
