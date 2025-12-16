/**
 * Polar Payment Integration
 * 
 * Polar.sh is a merchant of record for software subscriptions.
 * Set up your products at https://polar.sh
 * 
 * Environment variables needed:
 * - POLAR_ACCESS_TOKEN: Your Polar API access token
 * - POLAR_WEBHOOK_SECRET: Webhook secret for verifying events
 * - NEXT_PUBLIC_POLAR_ORG_ID: Your Polar organization ID (for checkout links)
 */

export interface PolarSubscription {
  id: string;
  status: "active" | "canceled" | "past_due" | "unpaid";
  current_period_end: string;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: "month" | "year";
  };
}

export interface PolarCheckoutSession {
  id: string;
  url: string;
  status: "open" | "complete" | "expired";
}

const POLAR_API_URL = "https://api.polar.sh/v1";

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession(
  productId: string,
  successUrl: string,
  customerId?: string,
  metadata?: Record<string, string>
): Promise<PolarCheckoutSession> {
  const response = await fetch(`${POLAR_API_URL}/checkouts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      success_url: successUrl,
      customer_id: customerId,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create checkout session");
  }

  return response.json();
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<PolarSubscription | null> {
  const response = await fetch(`${POLAR_API_URL}/subscriptions/${subscriptionId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch subscription");
  }

  return response.json();
}

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(customerId: string): Promise<PolarSubscription[]> {
  const response = await fetch(`${POLAR_API_URL}/subscriptions?customer_id=${customerId}`, {
    headers: {
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch subscriptions");
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const response = await fetch(`${POLAR_API_URL}/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to cancel subscription");
  }
}

/**
 * Verify Polar webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Subscription tier mapping
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    contractsPerMonth: 3,
    features: ["Basic analysis", "3 contracts/month", "No save/export"],
  },
  pro: {
    name: "Pro",
    productId: process.env.POLAR_PRO_PRODUCT_ID || "",
    price: 1900, // $19/month in cents
    contractsPerMonth: -1, // unlimited
    features: [
      "Unlimited contracts",
      "Contract comparison",
      "Financial projections",
      "Negotiation suggestions",
      "Version tracking",
      "Calendar alerts",
      "PDF export",
      "Portfolio dashboard",
    ],
  },
  team: {
    name: "Team",
    productId: process.env.POLAR_TEAM_PRODUCT_ID || "",
    price: 4900, // $49/month in cents
    contractsPerMonth: -1,
    features: [
      "Everything in Pro",
      "5 team members",
      "Shared workspace",
      "Lawyer collaboration",
      "Priority support",
      "Custom branding",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (!tierConfig) return false;
  
  // Free tier gets basic access
  if (tier === "free") {
    return !["comparison", "financial", "negotiation", "versions", "calendar", "export", "dashboard"].includes(feature);
  }
  
  return true;
}

/**
 * Check if user can analyze more contracts
 */
export function canAnalyzeMore(tier: SubscriptionTier, currentCount: number): boolean {
  const limit = SUBSCRIPTION_TIERS[tier].contractsPerMonth;
  if (limit === -1) return true;
  return currentCount < limit;
}


