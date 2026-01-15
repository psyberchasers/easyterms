"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { ContractAnalysis } from "@/types/contract";
import { ContractAnalysisView } from "@/components/ContractAnalysisView";
import {
  AlertTriangle,
  ArrowLeft,
  Share2,
  CheckCircle2,
  PenTool,
} from "lucide-react";
import { MusicLoader } from "@/components/MusicLoader";

interface Share {
  id: string;
  contract_id: string;
  owner_id: string;
  shared_with_email: string;
  permission: "view" | "comment" | "sign";
  status: "pending" | "viewed" | "signed" | "declined";
  message: string | null;
  created_at: string;
  owner?: {
    full_name: string | null;
    email: string | null;
  };
}

interface Contract {
  id: string;
  title: string;
  file_url: string | null;
  file_type: string | null;
  extracted_text: string | null;
  analysis: ContractAnalysis | null;
}

export default function SharedContractPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const initialTab = searchParams.get("tab") || "overview";

  const [share, setShare] = useState<Share | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const contractId = params.id as string;

  // Fetch share and contract data
  const fetchShareData = useCallback(async () => {
    try {
      // First get the share by contract_id (not share id)
      const { data: shareData, error: shareError } = await supabase
        .from("contract_shares")
        .select("*")
        .eq("contract_id", contractId)
        .or(`shared_with_user_id.eq.${user?.id},shared_with_email.eq.${user?.email}`)
        .single();

      if (shareError || !shareData) {
        console.error("Share fetch error:", shareError);
        setError("Share not found or you don't have access");
        setLoading(false);
        return;
      }

      // Get owner info - try profiles first, fall back to auth.users via API
      let ownerProfile = null;
      if (shareData.owner_id) {
        try {
          const response = await fetch(`/api/users/${shareData.owner_id}/profile`);
          if (response.ok) {
            ownerProfile = await response.json();
          }
        } catch (e) {
          console.log("Could not fetch owner profile");
        }
      }

      setShare({
        ...shareData,
        owner: ownerProfile
      } as Share);

      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("id, title, file_url, file_type, extracted_text, analysis")
        .eq("id", shareData.contract_id)
        .single();

      if (contractError || !contractData) {
        setError("Contract not found");
        setLoading(false);
        return;
      }

      setContract(contractData as Contract);

      if (shareData.status === "pending" && user) {
        await supabase
          .from("contract_shares")
          .update({ status: "viewed" })
          .eq("id", shareData.id);
      }

      // Fetch PDF URL if available
      if (contractData.file_url && contractData.file_type === "application/pdf") {
        fetchPdfUrl(contractData.id);
      }
    } catch (err) {
      console.error("Error fetching share:", err);
      setError("Failed to load shared contract");
    } finally {
      setLoading(false);
    }
  }, [contractId, user, supabase]);

  const fetchPdfUrl = async (contractId: string) => {
    try {
      console.log("Fetching PDF for contract:", contractId);
      setPdfError(null);
      const response = await fetch(`/api/contracts/${contractId}/file`);
      const data = await response.json();
      console.log("PDF fetch response:", response.status, data);
      if (response.ok && data.url) {
        setPdfUrl(data.url);
      } else {
        console.error("PDF fetch error:", response.status, data.error);
        setPdfError(data.error || "Failed to load PDF");
      }
    } catch (err) {
      console.error("Error fetching PDF:", err);
      setPdfError("Failed to load PDF");
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchShareData();
    }
  }, [authLoading, user, fetchShareData]);

  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <MusicLoader />
      </div>
    );
  }

  if (error || !share || !contract) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card gap-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <h1 className="text-lg font-medium text-foreground">{error || "Contract not found"}</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This link may have expired or you may not have permission to view this contract.
        </p>
        <Link href="/dashboard">
          <button className="h-9 px-4 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Go to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  const analysis = contract.analysis;
  const ownerName = share.owner?.full_name || share.owner?.email || "Someone";

  // Download report handler for shared view
  const handleDownloadReport = async () => {
    if (!analysis) return;

    const report = `CONTRACT ANALYSIS REPORT
========================

Contract: ${contract.title}
Shared by: ${ownerName}
Overall Risk: ${analysis.overallRiskAssessment?.toUpperCase() || 'N/A'}

SUMMARY
-------
${analysis.summary}

KEY TERMS
---------
${analysis.keyTerms?.map((term: any) => `
${term.title} (${term.riskLevel.toUpperCase()} RISK)
${term.content}
Explanation: ${term.explanation}
`).join('\n') || 'No key terms found.'}

FINANCIAL TERMS
---------------
Royalty Rate: ${analysis.financialTerms?.royaltyRate || 'N/A'}
Advance: ${analysis.financialTerms?.advanceAmount || 'N/A'}
Term Length: ${analysis.termLength || 'N/A'}
Payment Schedule: ${analysis.financialTerms?.paymentSchedule || 'N/A'}

POTENTIAL CONCERNS
------------------
${analysis.potentialConcerns?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n') || 'No concerns identified.'}

RECOMMENDATIONS
---------------
${analysis.recommendations?.map((r: any, i: number) => {
  if (typeof r === 'string') return `${i + 1}. ${r}`;
  return `${i + 1}. ${r.advice}`;
}).join('\n') || 'No recommendations.'}

---
Generated by EasyTerms
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.title.replace(/[^a-z0-9]/gi, '_')}_analysis.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-card gap-4">
        <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No analysis available for this contract</p>
        <Link href="/dashboard">
          <button className="h-9 px-4 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Go to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Shared Banner */}
      <div className="shrink-0 px-4 py-2 bg-purple-500/5 border-b border-purple-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-500" />
            <span className="text-xs"><span className="text-muted-foreground">Shared by </span><span className="font-medium text-foreground">{ownerName}</span></span>
          </div>
          {share.message && (
            <>
              <span className="text-[10px] text-muted-foreground/40">•</span>
              <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-md">"{share.message}"</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {share.permission === "sign" && share.status !== "signed" && (
            <button
              className="h-7 px-3 text-[11px] font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-1.5 transition-colors"
              onClick={() => alert("Signature feature coming soon!")}
            >
              <PenTool className="w-3 h-3" />
              Sign
            </button>
          )}
          {share.status === "signed" && (
            <span className="h-7 px-3 text-[11px] font-medium bg-green-500/10 text-green-500 rounded-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Signed
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ContractAnalysisView
          analysis={analysis}
          fileName={contract.title}
          fileUrl={pdfUrl || ""}
          contractId={contract.id}
          pdfError={pdfError}
          showDiscussionTab={share.permission === "comment" || share.permission === "sign"}
          canComment={share.permission === "comment" || share.permission === "sign"}
          isSharedView={true}
          initialTab={initialTab}
          onDownloadReport={handleDownloadReport}
          discussionMembers={share.owner ? [{
            id: share.owner_id,
            name: share.owner.full_name,
            email: share.owner.email,
            avatar_url: null,
          }] : []}
        />
      </div>
    </div>
  );
}
