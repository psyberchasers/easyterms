"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Check, Zap } from "lucide-react";
import { useSubscription, FEATURE_NAMES } from "@/hooks/useSubscription";

interface UpgradePromptProps {
  feature: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEATURE_DETAILS: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  [FEATURE_NAMES.COMPARISON]: {
    title: "Contract Comparison",
    description: "Compare multiple contracts side-by-side and see exactly what changed between versions.",
    icon: Lock,
  },
  [FEATURE_NAMES.FINANCIAL]: {
    title: "Financial Calculator",
    description: "Calculate streaming royalties, break-even points, and sync licensing projections.",
    icon: Lock,
  },
  [FEATURE_NAMES.NEGOTIATION]: {
    title: "Negotiation Assistant",
    description: "Get AI-powered counter-offer suggestions and template emails for negotiations.",
    icon: Lock,
  },
  [FEATURE_NAMES.VERSIONS]: {
    title: "Version Tracking",
    description: "Track changes across contract versions and monitor negotiation progress.",
    icon: Lock,
  },
  [FEATURE_NAMES.CALENDAR]: {
    title: "Calendar & Alerts",
    description: "Never miss a deadline with automatic date extraction and calendar integration.",
    icon: Lock,
  },
  [FEATURE_NAMES.EXPORT]: {
    title: "PDF Export",
    description: "Generate professional PDF reports to share with your lawyer or team.",
    icon: Lock,
  },
  [FEATURE_NAMES.DASHBOARD]: {
    title: "Portfolio Dashboard",
    description: "Get a complete overview of all your contracts with risk distribution and stats.",
    icon: Lock,
  },
};

export function UpgradePrompt({ feature, open, onOpenChange }: UpgradePromptProps) {
  const { tier } = useSubscription();
  const details = FEATURE_DETAILS[feature] || {
    title: "Premium Feature",
    description: "Upgrade to Pro to unlock this feature and more.",
    icon: Lock,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/30">
              Pro Feature
            </Badge>
          </div>
          <DialogTitle>{details.title}</DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Unlock with Pro
            </p>
            <ul className="space-y-2">
              {[
                "Unlimited contract analysis",
                "All premium features",
                "Version tracking & calendar",
                "Financial projections",
              ].map((benefit, i) => (
                <li key={i} className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">$19/month</p>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
            <Link href="/pricing">
              <Button>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simple inline upgrade banner for embedding in feature areas
 */
export function UpgradeBanner({ feature }: { feature: string }) {
  const { isFree } = useSubscription();
  const details = FEATURE_DETAILS[feature];

  if (!isFree || !details) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm">{details.title}</p>
          <p className="text-xs text-muted-foreground mb-3">{details.description}</p>
          <Link href="/pricing">
            <Button size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}





