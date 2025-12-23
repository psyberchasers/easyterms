import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, SUBSCRIPTION_TIERS, SubscriptionTier } from "@/lib/polar";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { tier } = await request.json();

  if (!tier || !["pro", "team"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tierConfig = SUBSCRIPTION_TIERS[tier as SubscriptionTier];
  if (!tierConfig || !("productId" in tierConfig) || !tierConfig.productId) {
    return NextResponse.json({ error: "Tier not configured" }, { status: 400 });
  }

  try {
    // Get or create Polar customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("polar_customer_id")
      .eq("id", user.id)
      .single();

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?checkout=success`;

    const checkout = await createCheckoutSession(
      tierConfig.productId,
      successUrl,
      profile?.polar_customer_id,
      { user_id: user.id }
    );

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout" },
      { status: 500 }
    );
  }
}





