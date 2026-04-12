"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { SUBSCRIPTION_TIERS, SubscriptionTier, hasFeatureAccess, canAnalyzeMore } from "@/lib/polar";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  tierName: string;
  isLoading: boolean;
  isArtist: boolean;
  isPro: boolean;
  isFree: boolean;
  contractsRemaining: number | null; // null = unlimited
  canAnalyze: boolean;
  features: string[];
  hasAccess: (feature: string) => boolean;
}

export function useSubscription(): SubscriptionStatus {
  const { profile, loading } = useAuth();

  const tier = (profile?.subscription_tier as SubscriptionTier) || "free";
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const contractsThisMonth = profile?.contracts_this_month || 0;

  const isArtist = tier === "artist";
  const isPro = tier === "pro";
  const isFree = tier === "free";

  // Calculate contracts remaining
  const contractsUsed = profile?.contracts_this_month || 0;
  const limit = tierConfig.contractsPerYear;
  const contractsRemaining = limit === -1 ? null : Math.max(0, limit - contractsUsed);
  const canAnalyze = canAnalyzeMore(tier, contractsUsed);

  return {
    tier,
    tierName: tierConfig.name,
    isLoading: loading,
    isArtist,
    isPro,
    isFree,
    contractsRemaining,
    canAnalyze,
    features: [...tierConfig.features],
    hasAccess: (feature: string) => hasFeatureAccess(tier, feature),
  };
}

/**
 * Feature names for access checks:
 * - "comparison" - Contract comparison
 * - "financial" - Financial calculator/projections
 * - "negotiation" - Negotiation assistant
 * - "versions" - Version tracking
 * - "calendar" - Calendar & alerts
 * - "export" - PDF export
 * - "dashboard" - Portfolio dashboard
 */
export const FEATURE_NAMES = {
  COMPARISON: "comparison",
  NEGOTIATION: "negotiation",
  REDLINING: "redlining",
  CHATBOT: "chatbot",
  SIGNING: "signing",
  PRESEND: "presend",
  TEMPLATES: "templates",
} as const;

