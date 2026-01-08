import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareEmailRequest {
  share_id: string;
  contract_id: string;
  recipient_email: string;
  owner_id: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { share_id, contract_id, recipient_email, owner_id, message } =
      await req.json() as ShareEmailRequest;

    // Initialize Supabase client to fetch data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get owner details
    const { data: owner } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", owner_id)
      .single();

    // Get contract details
    const { data: contract } = await supabase
      .from("contracts")
      .select("title")
      .eq("id", contract_id)
      .single();

    const ownerName = owner?.full_name || owner?.email || "Someone";
    const contractTitle = contract?.title || "a contract";

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TODO: Change to "EasyTerms <noreply@easyterms.ai>" once domain is verified in Resend
        from: "EasyTerms <onboarding@resend.dev>",
        to: recipient_email,
        subject: `${ownerName} shared a contract with you`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 600; margin: 0;">EasyTerms</h1>
              </div>

              <div style="background-color: #1a1a1a; border-radius: 16px; padding: 32px; border: 1px solid #2a2a2a;">
                <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">You've been invited to review a contract</h2>

                <p style="color: #a1a1aa; margin: 0 0 24px 0; line-height: 1.6;">
                  <strong style="color: #ffffff;">${ownerName}</strong> has shared
                  <strong style="color: #ffffff;">"${contractTitle}"</strong> with you on EasyTerms.
                </p>

                ${message ? `
                <div style="background-color: #0f0f0f; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="color: #a1a1aa; margin: 0; font-size: 14px; font-style: italic;">"${message}"</p>
                </div>
                ` : ""}

                <a href="https://easyterms.ai/shared/${share_id}"
                   style="display: block; background-color: #a855f7; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; text-align: center;">
                  View Contract
                </a>
              </div>

              <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 32px;">
                This email was sent by EasyTerms. If you didn't expect this email, you can safely ignore it.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", resend_error: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await emailResponse.json();
    console.log("Email sent:", result);

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
