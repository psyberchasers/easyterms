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
  customerEmail?: string,
  metadata?: Record<string, string>
): Promise<PolarCheckoutSession> {
  const body: Record<string, unknown> = {
    products: [productId],
    success_url: successUrl,
    metadata,
  };
  if (customerEmail) {
    body.customer_email = customerEmail;
  }

  const response = await fetch(`${POLAR_API_URL}/checkouts/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Polar checkout error:", response.status, errorBody);
    throw new Error(`Polar checkout failed (${response.status}): ${errorBody}`);
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

// Webhook verification is handled by standardwebhooks package in the webhook route

/**
 * Subscription tier mapping
 * Matches pricing page: Free / Artist ($29.99/yr) / Pro ($79.99/yr)
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    contractsPerYear: 1,
    features: [
      "1 contract analysis",
      "Basic AI analysis",
      "Plain-English summary",
    ],
  },
  artist: {
    name: "Artist",
    productId: process.env.POLAR_ARTIST_PRODUCT_ID || "",
    price: 2999, // $29.99/year in cents
    contractsPerYear: 10,
    features: [
      "10 contracts per year",
      "Full AI analysis",
      "Industry-specific templates",
      "Key term flagging & risk alerts",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    productId: process.env.POLAR_PRO_PRODUCT_ID || "",
    price: 7999, // $79.99/year in cents
    contractsPerYear: -1, // unlimited
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
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (!tierConfig) return false;

  // Free tier gets basic access only
  if (tier === "free") {
    return !["comparison", "negotiation", "redlining", "chatbot", "signing", "presend", "templates"].includes(feature);
  }

  // Artist tier doesn't get pro-only features
  if (tier === "artist") {
    return !["comparison", "negotiation", "redlining", "chatbot", "signing", "presend"].includes(feature);
  }

  return true;
}

/**
 * Check if user can analyze more contracts
 */
export function canAnalyzeMore(tier: SubscriptionTier, currentCount: number): boolean {
  const limit = SUBSCRIPTION_TIERS[tier].contractsPerYear;
  if (limit === -1) return true;
  return currentCount < limit;
}





