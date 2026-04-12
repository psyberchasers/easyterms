"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    ctaLabel: "Upgrade to Artist",
    popular: false,
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
      "AI chatbot for follow-up questions",
      "In-app contract signing",
      "Pre-send contract review",
      "Email support",
    ],
    ctaLabel: "Upgrade to Pro",
    popular: true,
  },
];

export default function BillingPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const currentTier = profile?.subscription_tier || "free";

  const handleSubscribe = async (planId: string) => {
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
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar showBorder />

      <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-circular)" }}>Billing</h1>
          <p className="text-white/40 text-sm" style={{ fontFamily: "var(--font-circular)" }}>Manage your subscription and billing details.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;
            const isLoading = loading === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl border p-6 flex flex-col transition-all",
                  plan.popular
                    ? "border-purple-500/30 bg-purple-500/[0.04]"
                    : "border-white/[0.08] bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-circular)" }}>
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20" style={{ fontFamily: "var(--font-circular)" }}>
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]" style={{ fontFamily: "var(--font-circular)" }}>
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-circular)" }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-white/30" style={{ fontFamily: "var(--font-circular)" }}>{plan.period}</span>
                  )}
                </div>

                <p className="text-sm text-white/40 mb-6" style={{ fontFamily: "var(--font-circular)" }}>
                  {plan.description}
                </p>

                <div className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                        plan.popular ? "bg-purple-500/20" : "bg-white/[0.08]"
                      )}>
                        <Check className={cn("w-3 h-3", plan.popular ? "text-purple-400" : "text-white/50")} strokeWidth={3} />
                      </div>
                      <span className="text-sm text-white/60" style={{ fontFamily: "var(--font-circular)" }}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || isLoading}
                  className={cn(
                    "w-full py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                    isCurrentPlan
                      ? "bg-white/[0.06] text-white/30 cursor-default"
                      : plan.popular
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-white text-black hover:bg-white/90"
                  )}
                  style={{ fontFamily: "var(--font-circular)" }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    <>
                      {plan.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: "var(--font-circular)" }}>Billing History</h2>
          <p className="text-sm text-white/40" style={{ fontFamily: "var(--font-circular)" }}>
            No billing history yet. Your invoices will appear here once you subscribe to a paid plan.
          </p>
        </div>
      </main>
    </div>
  );
}
