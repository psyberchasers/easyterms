"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "Try EasyTerms with one free contract analysis.",
    features: [
      "1 contract analysis",
      "Basic AI analysis",
      "Plain-English summary",
      "No credit card required",
    ],
    ctaLabel: "Current Plan",
  },
  {
    id: "artist",
    name: "Artist",
    price: "$29.99",
    period: "/year",
    description: "For independent artists and those newer to the industry.",
    features: [
      "10 contracts per year",
      "Full AI analysis",
      "Industry-specific templates",
      "Key term flagging & risk alerts",
      "Email support",
    ],
    ctaLabel: "Upgrade",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79.99",
    period: "/year",
    description: "For managers, agents, and professionals who handle contracts regularly.",
    features: [
      "Unlimited contracts",
      "Everything in Artist, plus:",
      "Negotiation suggestions",
      "Redlining tools",
      "Contract comparisons",
      "AI chatbot",
      "In-app signing",
      "Pre-send review",
      "Email support",
    ],
    popular: true,
    ctaLabel: "Upgrade",
  },
];

export default function BillingPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const currentTier = profile?.subscription_tier || "free";

  const handleUpgrade = async (planId: string) => {
    if (planId === "free" || currentTier === planId) return;
    setLoading(planId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: planId }),
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-lg font-medium text-muted-foreground">Manage your subscription</h1>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;
            const isLoading = loading === plan.id;

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
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Popular</span>
                  )}
                </div>

                <div className="mb-1">
                  <span className="text-2xl font-semibold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <div className="mb-3" />

                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                <div className="space-y-2 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        plan.popular ? "bg-purple-500/20" : "bg-foreground/10"
                      )}>
                        <Check className={cn("w-2.5 h-2.5", plan.popular ? "text-purple-400" : "text-foreground")} strokeWidth={3} />
                      </div>
                      <span className="text-xs text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || isLoading}
                  className={cn(
                    "w-full py-2 mt-5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5",
                    isCurrentPlan
                      ? "bg-muted text-muted-foreground cursor-default"
                      : plan.popular
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-foreground text-background hover:bg-foreground/90"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isCurrentPlan ? (
                    "Current plan"
                  ) : (
                    <>
                      {plan.ctaLabel}
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Method */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">Payment Method</h2>
          <p className="text-xs text-muted-foreground mb-3">No payment method on file</p>
          <button className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors">
            Add payment method
          </button>
        </div>

        {/* Billing History */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">Billing History</h2>
          <p className="text-xs text-muted-foreground">No billing history yet</p>
        </div>
      </div>
    </div>
  );
}
