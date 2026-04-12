import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionTier } from "@/lib/polar";
import { Webhook } from "standardwebhooks";

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Verify webhook signature using Standard Webhooks
  if (process.env.POLAR_WEBHOOK_SECRET) {
    try {
      const wh = new Webhook(btoa(process.env.POLAR_WEBHOOK_SECRET));
      const headers = {
        "webhook-id": request.headers.get("webhook-id") || "",
        "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
        "webhook-signature": request.headers.get("webhook-signature") || "",
      };
      wh.verify(body, headers);
    } catch (err) {
      console.error("Invalid Polar webhook signature:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(body);
  const supabase = await createClient();

  console.log("Polar webhook event:", event.type);

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const subscription = event.data;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.error("No user_id in subscription metadata");
          break;
        }

        // Determine tier based on product
        let tier: SubscriptionTier = "free";
        if (subscription.product_id === process.env.POLAR_ARTIST_PRODUCT_ID) {
          tier = "artist";
        } else if (subscription.product_id === process.env.POLAR_PRO_PRODUCT_ID) {
          tier = "pro";
        }

        // Update user's subscription tier
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("Failed to update user subscription:", error);
        } else {
          console.log(`Updated user ${userId} to tier: ${tier}`);
        }
        break;
      }

      case "subscription.canceled": {
        const subscription = event.data;
        const userId = subscription.metadata?.user_id;

        if (!userId) break;

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("Failed to downgrade user:", error);
        } else {
          console.log(`Downgraded user ${userId} to free tier`);
        }
        break;
      }

      case "checkout.completed": {
        const checkout = event.data;
        console.log("Checkout completed:", checkout.id);
        break;
      }

      default:
        console.log("Unhandled Polar event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
