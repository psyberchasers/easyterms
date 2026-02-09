import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Documenso } from "@documenso/sdk-typescript";

const documenso = new Documenso({
  apiKey: process.env.DOCUMENSO_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractId, signerEmail, signerName, message } = body;

    if (!contractId || !signerEmail) {
      return NextResponse.json(
        { error: "Contract ID and signer email are required" },
        { status: 400 }
      );
    }

    // Get contract and verify ownership
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, title, file_url, file_type, user_id")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    if (contract.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to request signatures for this contract" },
        { status: 403 }
      );
    }

    // Only PDFs can be signed
    if (contract.file_type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF contracts can be signed" },
        { status: 400 }
      );
    }

    // Get the PDF file from Supabase storage
    const adminClient = createAdminClient();
    const filePath = contract.file_url?.replace(/^.*\/contracts\//, "") || "";

    const { data: fileData, error: fileError } = await adminClient.storage
      .from("contracts")
      .download(filePath);

    if (fileError || !fileData) {
      console.error("Error downloading file:", fileError);
      return NextResponse.json(
        { error: "Failed to retrieve contract file" },
        { status: 500 }
      );
    }

    // Convert Blob to ArrayBuffer for Documenso SDK
    const arrayBuffer = await fileData.arrayBuffer();

    // Create document in Documenso with recipient and signature field inline
    const createResult = await documenso.documents.create({
      payload: {
        title: contract.title || "Contract Agreement",
        externalId: contractId, // Link back to our contract
        recipients: [
          {
            email: signerEmail,
            name: signerName || signerEmail.split("@")[0],
            role: "SIGNER",
            // Add signature and date fields for this recipient
            fields: [
              {
                type: "SIGNATURE",
                pageNumber: 1,
                pageX: 35, // Centered horizontally (percentage)
                pageY: 85, // Near bottom (percentage)
                width: 30, // Width (percentage)
                height: 5, // Height (percentage)
              },
              {
                type: "DATE",
                pageNumber: 1,
                pageX: 70,
                pageY: 85,
                width: 15,
                height: 5,
              },
            ],
          },
        ],
        meta: {
          message: message || `Please review and sign this contract: ${contract.title}`,
          subject: `Signature requested: ${contract.title}`,
          // Use NONE so we can send our own branded email/link instead of Documenso's
          distributionMethod: "NONE",
        },
      },
      file: {
        fileName: `${contract.title || "contract"}.pdf`,
        content: new Uint8Array(arrayBuffer),
      },
    });

    const documentId = createResult.id;

    if (!documentId) {
      console.error("Documenso create failed:", createResult);
      return NextResponse.json(
        { error: "Failed to create signature request" },
        { status: 500 }
      );
    }

    // Send for signing (distribute the document)
    await documenso.documents.distribute({
      documentId,
      meta: {
        subject: `Signature requested: ${contract.title}`,
        message: message || `Please review and sign this contract: ${contract.title}`,
      },
    });

    // Get the document to retrieve the recipient's signing token
    const docDetails = await documenso.documents.get({ documentId });
    const recipient = docDetails.recipients?.find(
      (r) => r.email.toLowerCase() === signerEmail.toLowerCase()
    );
    const signingToken = recipient?.token;

    // Construct the EasyTerms signing URL (branded experience)
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const easyTermsSigningUrl = signingToken
      ? `${protocol}://${host}/sign/${signingToken}`
      : null;

    // Store the Documenso document ID and signing token in our database
    await supabase
      .from("contract_shares")
      .update({
        documenso_document_id: documentId,
        documenso_signing_token: signingToken,
        status: "pending_signature",
      })
      .eq("contract_id", contractId)
      .eq("shared_with_email", signerEmail.toLowerCase());

    // Create notification for the signer if they have an account
    const { data: signerUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", signerEmail.toLowerCase())
      .single();

    if (signerUser) {
      await supabase.from("notifications").insert({
        user_id: signerUser.id,
        type: "signature_requested",
        title: "Signature Requested",
        message: `You've been asked to sign "${contract.title}"`,
        contract_id: contractId,
        from_user_id: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      documentId,
      signingToken,
      signingUrl: easyTermsSigningUrl,
      message: "Signature request sent successfully",
    });
  } catch (err) {
    console.error("Error creating signature request:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Get signature status for a contract
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json(
        { error: "Contract ID is required" },
        { status: 400 }
      );
    }

    // Get shares with signature info
    const { data: shares, error } = await supabase
      .from("contract_shares")
      .select("id, shared_with_email, documenso_document_id, status")
      .eq("contract_id", contractId)
      .eq("permission", "sign");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch signature status" },
        { status: 500 }
      );
    }

    // Get detailed status from Documenso for each share
    const signaturesWithStatus = await Promise.all(
      (shares || []).map(async (share) => {
        if (share.documenso_document_id) {
          try {
            const docStatus = await documenso.documents.get({
              documentId: share.documenso_document_id,
            });
            return {
              ...share,
              documensoStatus: docStatus.status,
              completedAt: docStatus.completedAt,
            };
          } catch {
            return share;
          }
        }
        return share;
      })
    );

    return NextResponse.json({ signatures: signaturesWithStatus });
  } catch (err) {
    console.error("Error fetching signature status:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
