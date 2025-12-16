"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { SUBSCRIPTION_TIERS, SubscriptionTier, hasFeatureAccess, canAnalyzeMore } from "@/lib/polar";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  tierName: string;
  isLoading: boolean;
  isPro: boolean;
  isTeam: boolean;
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

  const isPro = tier === "pro";
  const isTeam = tier === "team";
  const isFree = tier === "free";

  // Calculate contracts remaining
  const limit = tierConfig.contractsPerMonth;
  const contractsRemaining = limit === -1 ? null : Math.max(0, limit - contractsThisMonth);
  const canAnalyze = canAnalyzeMore(tier, contractsThisMonth);

  return {
    tier,
    tierName: tierConfig.name,
    isLoading: loading,
    isPro,
    isTeam,
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
 * - "team" - Team features (shared workspace, etc.)
 */
export const FEATURE_NAMES = {
  COMPARISON: "comparison",
  FINANCIAL: "financial",
  NEGOTIATION: "negotiation",
  VERSIONS: "versions",
  CALENDAR: "calendar",
  EXPORT: "export",
  DASHBOARD: "dashboard",
  TEAM: "team",
} as const;

