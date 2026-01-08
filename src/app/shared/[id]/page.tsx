"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { ContractAnalysis } from "@/types/contract";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  CheckCircle2,
  ChevronRight,
  PenTool,
  UserCircle,
  Lock,
  MessageCircle,
} from "lucide-react";
import { MusicLoader } from "@/components/MusicLoader";
import { ContractComments } from "@/components/ContractComments";

// Dynamically import PDF viewer
const PDFViewerWithSearch = dynamic(
  () => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <MusicLoader />
      </div>
    ),
  }
);

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
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [share, setShare] = useState<Share | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showDocument, setShowDocument] = useState(true);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string>("");
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);

  const shareId = params.id as string;

  // Fetch share and contract data
  const fetchShareData = useCallback(async () => {
    try {
      // Get share details
      const { data: shareData, error: shareError } = await supabase
        .from("contract_shares")
        .select(`
          *,
          owner:profiles!owner_id (
            full_name,
            email
          )
        `)
        .eq("id", shareId)
        .single();

      if (shareError || !shareData) {
        setError("Share not found or you don't have access");
        setLoading(false);
        return;
      }

      setShare(shareData as Share);

      // Get contract details
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

      // Mark as viewed if still pending
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
    setLoadingPdf(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/file`);
      const data = await response.json();
      if (response.ok && data.url) {
        setPdfUrl(data.url);
      }
    } catch (err) {
      console.error("Error fetching PDF:", err);
    } finally {
      setLoadingPdf(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchShareData();
    }
  }, [authLoading, fetchShareData]);

  // Handle clause click for highlighting
  const handleClauseClick = (originalText: string | undefined) => {
    if (originalText) {
      setHighlightedText(originalText);
      setShowDocument(true);
    }
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-purple-500" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Sign in to view this contract</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Someone shared a contract with you. Sign in or create an account to view it.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/login?redirect=/shared/${shareId}`}>
            <button className="h-10 px-6 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
              Sign In
            </button>
          </Link>
          <Link href={`/login?mode=signup&redirect=/shared/${shareId}`}>
            <button className="h-10 px-6 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors">
              Create Account
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  if (error || !share || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
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

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-14 px-4 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Shared by</span>
            <span className="text-sm font-medium text-foreground">{ownerName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {share.permission === "sign" && share.status !== "signed" && (
            <button
              className="h-8 px-4 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              onClick={() => {
                // TODO: Open signature modal
                alert("Signature feature coming soon!");
              }}
            >
              <PenTool className="w-3.5 h-3.5" />
              Sign Contract
            </button>
          )}
          {share.status === "signed" && (
            <span className="h-8 px-3 text-xs font-medium bg-green-500/10 text-green-500 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signed
            </span>
          )}
          {(share.permission === "comment" || share.permission === "sign") && (
            <button
              onClick={() => setShowDiscussion(!showDiscussion)}
              className={cn(
                "h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors",
                showDiscussion
                  ? "bg-purple-500 text-white"
                  : "text-muted-foreground hover:text-foreground border border-border hover:bg-muted"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Discussion
            </button>
          )}
        </div>
      </header>

      {/* Shared message banner */}
      {share.message && (
        <div className="px-4 py-3 bg-purple-500/5 border-b border-purple-500/10">
          <div className="flex items-start gap-3 max-w-4xl mx-auto">
            <UserCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Message from {ownerName}</p>
              <p className="text-sm text-foreground">{share.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document Panel */}
        <div
          className={cn(
            "h-full flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out overflow-hidden",
            showDocument ? "w-2/5 min-w-[400px]" : "w-0"
          )}
        >
          {showDocument && (
            <>
              <div className="shrink-0 h-10 px-3 border-b border-border bg-card flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{contract.title}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                {pdfUrl && contract.file_type === "application/pdf" ? (
                  loadingPdf ? (
                    <div className="flex items-center justify-center h-full">
                      <MusicLoader />
                    </div>
                  ) : (
                    <PDFViewerWithSearch fileUrl={pdfUrl} searchText={highlightedText} className="h-full" />
                  )
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                      {contract.extracted_text || "No text available"}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Analysis Content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: "#fcfcfc" }}>
          {/* Title and Toggle */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: "#1d1b1a" }}>
                {contract.title}
              </h1>
              {analysis?.overallRiskAssessment && (
                <span
                  className={cn(
                    "inline-flex items-center mt-2 px-2.5 py-1 text-xs font-medium rounded-md",
                    analysis.overallRiskAssessment === "low" && "bg-green-500/10 text-green-500",
                    analysis.overallRiskAssessment === "medium" && "bg-amber-500/10 text-amber-500",
                    analysis.overallRiskAssessment === "high" && "bg-red-500/10 text-red-500"
                  )}
                >
                  {analysis.overallRiskAssessment.charAt(0).toUpperCase() + analysis.overallRiskAssessment.slice(1)} Risk
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setShowDocument(!showDocument);
                if (showDocument) setHighlightedText("");
              }}
              className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shrink-0"
              style={{ backgroundColor: "#f3f1f0", color: "#797875" }}
            >
              <FileText className="w-3.5 h-3.5" />
              {showDocument ? "Hide PDF" : "Show PDF"}
            </button>
          </div>

          {analysis ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#f3f1f0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#797875" }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#797875" }}>
                    Summary
                  </span>
                </div>
                <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "#ffffff" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "#1d1b1a" }}>
                    {analysis.summary}
                  </p>
                </div>
              </div>

              {/* Key Financials */}
              {analysis.financialTerms && (
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#f3f1f0" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#797875" }} />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#797875" }}>
                      Key Financials
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {analysis.financialTerms?.royaltyRate && (
                      <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "#ffffff" }}>
                        <div className="px-4 py-2" style={{ backgroundColor: "#f7f6f5", borderBottom: "1px solid #f3f1f0" }}>
                          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9a9895" }}>
                            Royalty
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm font-semibold" style={{ color: "#1d1b1a" }}>
                            {analysis.financialTerms.royaltyRate}
                          </p>
                        </div>
                      </div>
                    )}
                    {analysis.termLength && (
                      <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "#ffffff" }}>
                        <div className="px-4 py-2" style={{ backgroundColor: "#f7f6f5", borderBottom: "1px solid #f3f1f0" }}>
                          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9a9895" }}>
                            Term
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm font-semibold" style={{ color: "#1d1b1a" }}>
                            {analysis.termLength}
                          </p>
                        </div>
                      </div>
                    )}
                    {analysis.financialTerms?.advanceAmount && (
                      <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: "#ffffff" }}>
                        <div className="px-4 py-2" style={{ backgroundColor: "#f7f6f5", borderBottom: "1px solid #f3f1f0" }}>
                          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#9a9895" }}>
                            Advance
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-sm font-semibold" style={{ color: "#1d1b1a" }}>
                            {analysis.financialTerms.advanceAmount}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Terms */}
              {analysis.keyTerms && analysis.keyTerms.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#f3f1f0" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid #ffffff" }}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#797875" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#797875" }}>
                        Key Terms
                      </span>
                    </div>
                  </div>
                  {analysis.keyTerms.slice(0, 5).map((term, i) => {
                    const isExpanded = expandedTerm === i;
                    return (
                      <div key={i}>
                        <div
                          className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#eae8e7] transition-colors"
                          style={{
                            borderBottom: i < Math.min(analysis.keyTerms!.length, 5) - 1 || isExpanded ? "1px solid #ffffff" : "none",
                            backgroundColor: isExpanded ? "#eae8e7" : undefined,
                          }}
                          onClick={() => setExpandedTerm(isExpanded ? null : i)}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "#e5e3e1" }}
                          >
                            <FileText className="w-4 h-4" style={{ color: "#797875" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs mb-0.5 capitalize" style={{ color: "#9a9895" }}>
                              {term.riskLevel} Risk
                            </p>
                            <p className="text-sm font-medium" style={{ color: "#1d1b1a" }}>
                              {term.title}
                            </p>
                            {!isExpanded && (
                              <p className="text-xs mt-1 line-clamp-1" style={{ color: "#9a9895" }}>
                                {term.explanation}
                              </p>
                            )}
                          </div>
                          <ChevronRight
                            className={cn("w-4 h-4 shrink-0 transition-transform", isExpanded && "rotate-90")}
                            style={{ color: "#9a9895" }}
                          />
                        </div>
                        <motion.div
                          initial={false}
                          animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pt-3 pb-4 space-y-3" style={{ backgroundColor: "#f3f1f0" }}>
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "#9a9895" }}>
                                Summary
                              </p>
                              <p className="text-sm leading-relaxed" style={{ color: "#1d1b1a" }}>
                                {term.content}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "#9a9895" }}>
                                In Plain English
                              </p>
                              <p className="text-sm leading-relaxed" style={{ color: "#1d1b1a" }}>
                                {term.explanation}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClauseClick(term.originalText);
                              }}
                              className="text-xs font-medium flex items-center gap-1.5 transition-colors hover:opacity-70"
                              style={{ color: "#797875" }}
                            >
                              <Eye className="w-3 h-3" /> View in contract
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Concerns */}
              {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#f3f1f0" }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid #ffffff" }}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#797875" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#797875" }}>
                        Potential Concerns
                      </span>
                    </div>
                  </div>
                  {analysis.potentialConcerns.slice(0, 4).map((concern, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#eae8e7] transition-colors"
                      style={{
                        borderBottom: i < Math.min(analysis.potentialConcerns!.length, 4) - 1 ? "1px solid #ffffff" : "none",
                      }}
                      onClick={() => {
                        const snippet = analysis.concernSnippets?.[i];
                        if (snippet) handleClauseClick(snippet);
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#e5e3e1" }}
                      >
                        <AlertTriangle className="w-4 h-4" style={{ color: "#797875" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#1d1b1a" }}>
                          {concern}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#9a9895" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No analysis available</p>
            </div>
          )}
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
