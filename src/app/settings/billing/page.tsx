"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "FREE",
    badge: null,
    price: "Free forever",
    priceSubtext: null,
    description: "Share your thoughts in one of the the world's biggest creative networks.",
    features: [
      "3 contracts per month",
      "Basic AI analysis",
      "5 MB upload limit",
      "Email support",
    ],
    cta: "Your current plan",
    ctaStyle: "outline",
    illustration: "/gradient1.jpeg",
  },
  {
    id: "plus",
    name: "PLUS",
    badge: { text: "BEST VALUE", color: "bg-purple-500" },
    price: "$12",
    priceSubtext: "/month",
    description: "Plan for content creators and heavy users. Best for looking for new opportunities.",
    features: [
      "Everything in free plan",
      "Analytic boards",
      "Edit any posts",
      "Longer posts",
      "10 MB upload limit",
      "Creator subscriptions",
    ],
    cta: "Get 1 month free",
    ctaStyle: "primary",
    illustration: "/gradient2.jpeg",
  },
  {
    id: "premium",
    name: "PREMIUM",
    badge: { text: "MOST POPULAR", color: "bg-neutral-900" },
    price: "$18",
    priceSubtext: "/month",
    description: "Build for premium users that looking for the best experience. Best for top voices, founders and influencers.",
    features: [
      "Everything in free plan",
      "Verified checkmark",
      "Analytic boards",
      "Edit any posts",
      "Longer posts",
      "No advertisements",
      "40 MB upload limit",
      "Creator subscriptions",
    ],
    cta: "Get 1 month free",
    ctaStyle: "primary",
    illustration: "/gradient1.jpeg",
  },
  {
    id: "team",
    name: "TEAM",
    badge: null,
    price: "$10",
    priceSubtext: "/user/month",
    description: "Team premium plan for medium to large teams, including job posting and freelancer searching.",
    features: [
      "Everything in free plan",
      "Team verified checkmark",
      "Team analytic boards",
      "Edit any posts",
      "Custom domain",
      "Longer posts",
      "No advertisements",
      "100 MB upload limit",
      "Verified all users",
      "Share projects privately",
    ],
    cta: "Contact sales",
    ctaStyle: "outline",
    illustration: "/gradient2.jpeg",
  },
];

export default function BillingPage() {
  const { profile } = useAuth();
  const currentTier = profile?.subscription_tier || "free";

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar showBorder />

      <main className="max-w-5xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Billing</h1>
          <p className="text-neutral-500">Manage your subscription and billing details.</p>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-white rounded-2xl overflow-hidden",
                  plan.id === "premium" && "ring-2 ring-neutral-900"
                )}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Content */}
                  <div className="flex-1 p-6 lg:p-8">
                    {/* Plan Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-semibold tracking-wider text-neutral-500">
                        {plan.name}
                      </span>
                      {plan.badge && (
                        <Badge className={cn("text-[10px] font-semibold text-white", plan.badge.color)}>
                          {plan.badge.text}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-2xl lg:text-3xl font-semibold text-neutral-900">
                        {plan.price}
                      </span>
                      {plan.priceSubtext && (
                        <span className="text-neutral-500">{plan.priceSubtext}</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-neutral-500 mb-6 max-w-md">
                      {plan.description}
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-neutral-900 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-neutral-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      className={cn(
                        "px-5 py-2.5 text-sm font-medium rounded-full transition-colors",
                        plan.ctaStyle === "primary"
                          ? "bg-neutral-900 text-white hover:bg-neutral-800"
                          : "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50",
                        isCurrentPlan && "cursor-default"
                      )}
                    >
                      {isCurrentPlan ? "Your current plan" : plan.cta}
                    </button>
                  </div>

                  {/* Illustration */}
                  <div className="hidden lg:block w-72 shrink-0">
                    <div className="h-full relative overflow-hidden rounded-r-2xl">
                      <img
                        src={plan.illustration}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Overlay content could go here */}
                      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Billing Info Section */}
        <div className="mt-8 bg-white rounded-2xl p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment Method</h2>
          <p className="text-sm text-neutral-500 mb-4">
            No payment method on file. Add a payment method to upgrade your plan.
          </p>
          <button className="px-5 py-2.5 text-sm font-medium rounded-full bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 transition-colors">
            Add payment method
          </button>
        </div>

        {/* Billing History */}
        <div className="mt-4 bg-white rounded-2xl p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Billing History</h2>
          <p className="text-sm text-neutral-500">
            No billing history yet. Your invoices will appear here once you subscribe to a paid plan.
          </p>
        </div>
      </main>
    </div>
  );
}
