import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Documenso webhook events
type DocumensoEvent =
  | "document.created"
  | "document.sent"
  | "document.opened"
  | "document.signed"
  | "document.completed"
  | "document.rejected"
  | "document.cancelled";

interface DocumensoWebhookPayload {
  event: string;
  payload: {
    id: number;
    externalId?: string; // Our contract ID
    title: string;
    status: string;
    completedAt?: string;
    Recipient?: Array<{
      id: number;
      email: string;
      name: string;
      signedAt?: string;
      role: string;
    }>;
  };
}

export async function POST(request: Request) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.DOCUMENSO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-documenso-secret");
      if (signature !== webhookSecret) {
        console.error("Invalid Documenso webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const body: DocumensoWebhookPayload = await request.json();
    const { event, payload } = body;

    console.log("Documenso webhook received:", event, payload.id);

    const supabase = createAdminClient();

    // Get our contract ID from externalId
    const contractId = payload.externalId;

    if (!contractId) {
      // Try to find by documenso_document_id
      const { data: share } = await supabase
        .from("contract_shares")
        .select("contract_id")
        .eq("documenso_document_id", payload.id)
        .single();

      if (!share) {
        console.log("No matching contract found for Documenso document:", payload.id);
        return NextResponse.json({ received: true });
      }
    }

    switch (event) {
      case "document.signed": {
        // A recipient has signed (but document may not be complete yet)
        const signer = payload.Recipient?.find((r) => r.signedAt);

        if (signer && contractId) {
          // Update share status
          await supabase
            .from("contract_shares")
            .update({
              status: "signed",
              signed_at: signer.signedAt || new Date().toISOString(),
            })
            .eq("contract_id", contractId)
            .eq("shared_with_email", signer.email.toLowerCase());

          // Get contract owner for notification
          const { data: contract } = await supabase
            .from("contracts")
            .select("user_id, title")
            .eq("id", contractId)
            .single();

          if (contract) {
            // Notify contract owner
            await supabase.from("notifications").insert({
              user_id: contract.user_id,
              type: "contract_signed",
              title: "Contract Signed",
              message: `${signer.name || signer.email} has signed "${contract.title}"`,
              contract_id: contractId,
            });
          }
        }
        break;
      }

      case "document.completed": {
        // All recipients have signed
        if (contractId) {
          // Update all shares for this contract
          await supabase
            .from("contract_shares")
            .update({
              status: "completed",
              completed_at: payload.completedAt || new Date().toISOString(),
            })
            .eq("contract_id", contractId)
            .eq("permission", "sign");

          // Get contract owner for notification
          const { data: contract } = await supabase
            .from("contracts")
            .select("user_id, title")
            .eq("id", contractId)
            .single();

          if (contract) {
            await supabase.from("notifications").insert({
              user_id: contract.user_id,
              type: "contract_signed",
              title: "All Signatures Complete",
              message: `All parties have signed "${contract.title}"`,
              contract_id: contractId,
            });
          }
        }
        break;
      }

      case "document.rejected": {
        // Someone rejected signing
        if (contractId) {
          const rejector = payload.Recipient?.find((r) => r.role === "SIGNER");

          await supabase
            .from("contract_shares")
            .update({ status: "rejected" })
            .eq("contract_id", contractId)
            .eq("documenso_document_id", payload.id);

          // Get contract owner for notification
          const { data: contract } = await supabase
            .from("contracts")
            .select("user_id, title")
            .eq("id", contractId)
            .single();

          if (contract) {
            await supabase.from("notifications").insert({
              user_id: contract.user_id,
              type: "contract_shared", // Reusing type for rejection notice
              title: "Signature Declined",
              message: `${rejector?.name || rejector?.email || "A recipient"} declined to sign "${contract.title}"`,
              contract_id: contractId,
            });
          }
        }
        break;
      }

      case "document.opened": {
        // Someone opened the document to view/sign
        console.log("Document opened:", payload.id);
        break;
      }

      default:
        console.log("Unhandled Documenso event:", event);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Documenso webhook error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
