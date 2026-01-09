"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { ContractAnalysis } from "@/types/contract";
import { ContractAnalysisView } from "@/components/ContractAnalysisView";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  UserCircle,
  CheckCircle2,
  PenTool,
  MessageCircle,
} from "lucide-react";
import { MusicLoader } from "@/components/MusicLoader";
import { ContractComments } from "@/components/ContractComments";

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
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [share, setShare] = useState<Share | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);

  const shareId = params.id as string;

  // Fetch share and contract data
  const fetchShareData = useCallback(async () => {
    try {
      // First get the share
      const { data: shareData, error: shareError } = await supabase
        .from("contract_shares")
        .select("*")
        .eq("id", shareId)
        .single();

      if (shareError || !shareData) {
        console.error("Share fetch error:", shareError);
        setError("Share not found or you don't have access");
        setLoading(false);
        return;
      }

      // Then get the owner's profile separately
      let ownerProfile = null;
      if (shareData.owner_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", shareData.owner_id)
          .single();
        ownerProfile = profile;
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
          .eq("id", shareId);
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
  }, [shareId, user, supabase]);

  const fetchPdfUrl = async (contractId: string) => {
    try {
      console.log("Fetching PDF for contract:", contractId);
      const response = await fetch(`/api/contracts/${contractId}/file`);
      const data = await response.json();
      console.log("PDF fetch response:", response.status, data);
      if (response.ok && data.url) {
        setPdfUrl(data.url);
      } else {
        console.error("PDF fetch error:", response.status, data.error);
      }
    } catch (err) {
      console.error("Error fetching PDF:", err);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchShareData();
    }
  }, [authLoading, fetchShareData]);

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
            <UserCircle className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Shared by</span>
            <span className="text-xs font-medium text-foreground">{ownerName}</span>
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
          {(share.permission === "comment" || share.permission === "sign") && (
            <button
              onClick={() => setShowDiscussion(!showDiscussion)}
              className={cn(
                "h-7 px-2 text-[11px] rounded-md flex items-center gap-1.5 transition-colors",
                showDiscussion
                  ? "bg-purple-500 text-white"
                  : "text-muted-foreground hover:text-foreground border border-border hover:bg-muted"
              )}
            >
              <MessageCircle className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Analysis View - using the shared component */}
        <div className={cn(
          "flex-1 overflow-hidden transition-all duration-300",
          showDiscussion && "md:mr-0"
        )}>
          <ContractAnalysisView
            analysis={analysis}
            fileName={contract.title}
            fileUrl={pdfUrl || ""}
            contractId={null}
          />
        </div>

        {/* Discussion Panel */}
        <div
          className={cn(
            "h-full flex flex-col bg-card border-l border-border transition-all duration-300 ease-in-out overflow-hidden",
            showDiscussion ? "w-96" : "w-0"
          )}
        >
          {showDiscussion && (
            <ContractComments
              contractId={contract.id}
              isOwner={false}
              canComment={share.permission === "comment" || share.permission === "sign"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
