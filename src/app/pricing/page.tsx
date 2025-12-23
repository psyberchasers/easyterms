"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Zap,
  FileText,
  GitCompare,
  Calculator,
  Clock,
  Calendar,
  Download,
  Lightbulb,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, DashboardCircleIcon } from "@hugeicons-pro/core-solid-rounded";
import { cn } from "@/lib/utils";

// Animated number component
function AnimatedPrice({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return;

    const startValue = previousValue.current;
    const endValue = value;
    const duration = 400;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{displayValue.toFixed(2)}</>;
}

const plans = [
  {
    id: "free",
    name: "Starter",
    description: "Perfect for trying out EasyTerms",
    price: { monthly: 0, annual: 0 },
    features: [
      { text: "3 contracts/month", icon: FileText },
      { text: "Basic AI analysis", icon: Zap },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "pro",
    name: "Advanced",
    description: "For artists & creators serious about their deals",
    price: { monthly: 9.99, annual: 7.99 },
    features: [
      { text: "Unlimited contracts", icon: FileText },
      { text: "Contract comparison", icon: GitCompare },
      { text: "Financial projections", icon: Calculator },
      { text: "Advice", icon: Lightbulb },
      { text: "Version tracking", icon: Clock },
      { text: "Calendar & alerts", icon: Calendar },
      { text: "PDF export", icon: Download },
      { text: "Portfolio dashboard", icon: DashboardCircleIcon, isHugeIcon: true },
    ],
    cta: "Start Advanced Trial",
    popular: true,
  },
];

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push(`/signup?redirect=/pricing&plan=${planId}`);
      return;
    }

    if (planId === "free") {
      router.push("/dashboard");
      return;
    }

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

  const currentTier = profile?.subscription_tier || "free";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-20 pt-28">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 border border-primary bg-primary/10">
            <HugeiconsIcon icon={SparklesIcon} size={14} className="text-primary" />
            <span className="text-sm font-bold text-primary">Simple Pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Protect Your Career
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. All plans include AI-powered contract analysis.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={cn("text-sm", !isAnnual && "font-semibold")}>Monthly</span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={cn("text-sm", isAnnual && "font-semibold")}>
              Annual
              <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                Save 20%
              </Badge>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const isCurrentPlan = currentTier === plan.id;
            const isLoading = loading === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-none",
                  plan.popular && "border-primary shadow-lg shadow-primary/10 scale-105"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrentPlan && (
                      <Badge variant="outline" className="font-normal">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${price === 0 ? "0" : <AnimatedPrice value={price} />}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">/mo</span>
                      )}
                    </div>
                    {isAnnual && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed annually (${(price * 12).toFixed(2)}/year)
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => {
                      const feat = feature as { text: string; icon: React.ComponentType<{ className?: string }> | unknown; isHugeIcon?: boolean };
                      const Icon = feat.icon as React.ComponentType<{ className?: string }>;
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {feat.isHugeIcon ? (
                            <HugeiconsIcon icon={feat.icon as Parameters<typeof HugeiconsIcon>[0]["icon"]} size={16} className="text-primary shrink-0" />
                          ) : (
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span>{feat.text}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isLoading}
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full rounded-none"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You&apos;ll retain access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely. Your contracts are encrypted in transit and at rest. We never share your data with third parties.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer a 7-day money-back guarantee if you&apos;re not satisfied with our service.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Need custom solutions?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact us for custom integrations and dedicated support for your specific needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Questions? We&apos;re here to help.
          </p>
          <Button variant="outline" className="rounded-none" asChild>
            <a href="mailto:support@easyterms.io">Contact Support</a>
          </Button>
        </div>
      </main>
    </div>
  );
}


