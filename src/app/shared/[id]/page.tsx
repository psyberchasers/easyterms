"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { ContractAnalysis } from "@/types/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X,
  Info,
  Lightbulb,
  DollarSign,
  Shield,
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
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);

  const shareId = params.id as string;

  // Fetch share and contract data
  const fetchShareData = useCallback(async () => {
    try {
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

  const handleClauseClick = (originalText: string | undefined) => {
    if (originalText) {
      setHighlightedClause(originalText);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-screen bg-card overflow-hidden"
    >
      {/* Document Side Panel */}
      <div
        className={cn(
          "flex flex-col bg-background transition-all duration-300 ease-in-out",
          "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto",
          "md:h-full",
          showDocument
            ? "opacity-100 visible md:w-1/2 md:max-w-2xl md:border-r md:border-border"
            : "opacity-0 invisible md:w-0 md:opacity-100 md:visible"
        )}
      >
        {showDocument && (
          <>
            <div className="shrink-0 h-12 px-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{contract.title}</span>
                {highlightedClause && (
                  <span className="text-xs text-muted-foreground/60 px-2 py-0.5 border border-border">Highlighting</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {highlightedClause && (
                  <button
                    onClick={() => setHighlightedClause(null)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => { setShowDocument(false); setHighlightedClause(null); }}
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-muted transition-colors rounded-md border border-border md:border-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-card">
              {pdfUrl && contract.file_type === "application/pdf" ? (
                loadingPdf ? (
                  <div className="flex items-center justify-center h-full">
                    <MusicLoader />
                  </div>
                ) : (
                  <PDFViewerWithSearch
                    fileUrl={pdfUrl}
                    searchText={highlightedClause || ""}
                    className="h-full"
                  />
                )
              ) : (
                <div className="p-4 text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                  {contract.extracted_text || "No text available"}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-auto flex flex-col bg-card">
        {/* Header Row 1: Title */}
        <div className="sticky top-0 z-20 bg-card shrink-0">
          <div className={cn(
            "px-6 h-12 flex items-center justify-between border-b border-border",
            !showDocument && "max-w-4xl mx-auto"
          )}>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard" className="flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-muted transition-colors mr-2">
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              <h1 className="text-sm font-medium text-foreground">{analysis?.contractType || contract.title}</h1>
              <span className="text-[10px] text-muted-foreground/40">•</span>
              <span className={cn(
                "text-[10px] uppercase font-medium",
                analysis?.overallRiskAssessment === "low" ? "text-green-600" :
                analysis?.overallRiskAssessment === "medium" ? "text-yellow-600" :
                analysis?.overallRiskAssessment === "high" ? "text-red-600" :
                "text-muted-foreground"
              )}>
                {analysis?.overallRiskAssessment === "low" ? "LOW RISK" :
                 analysis?.overallRiskAssessment === "medium" ? "MEDIUM RISK" :
                 analysis?.overallRiskAssessment === "high" ? "HIGH RISK" : "SHARED"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowDocument(!showDocument)}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors rounded-md"
              >
                <Eye className="w-3 h-3" />
                {showDocument ? "Hide PDF" : "Show PDF"}
              </button>
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

          {/* Shared message banner */}
          {share.message && (
            <div className="px-6 py-3 bg-purple-500/5 border-b border-purple-500/10">
              <div className="flex items-start gap-3">
                <UserCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Message from {ownerName}</p>
                  <p className="text-xs text-foreground">{share.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Header Row 2: Tabs */}
          <div className={cn(
            "px-6 h-10 flex items-center gap-1 border-b border-border overflow-x-auto",
            !showDocument && "max-w-4xl mx-auto"
          )}>
            <TabsList className="h-auto p-0 bg-transparent gap-1">
              {[
                { id: "overview", label: "Overview", icon: Info },
                { id: "terms", label: "Key Terms", icon: FileText },
                { id: "financial", label: "Finances", icon: DollarSign },
                { id: "advice", label: "Advice", icon: Lightbulb },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "h-7 px-3 text-[11px] font-medium rounded-md transition-all data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground flex items-center gap-1.5"
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <main className={cn(
          "flex-1 p-6 overflow-auto",
          !showDocument && "max-w-4xl mx-auto w-full"
        )}>
          {analysis ? (
            <>
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Summary */}
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</h2>
                  <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analysis.financialTerms?.royaltyRate && (
                    <div className="p-3 border border-border rounded-lg">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Royalty</p>
                      <p className="text-sm font-semibold text-foreground">{analysis.financialTerms.royaltyRate}</p>
                    </div>
                  )}
                  {analysis.termLength && (
                    <div className="p-3 border border-border rounded-lg">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Term</p>
                      <p className="text-sm font-semibold text-foreground">{analysis.termLength}</p>
                    </div>
                  )}
                  {analysis.financialTerms?.advanceAmount && (
                    <div className="p-3 border border-border rounded-lg">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Advance</p>
                      <p className="text-sm font-semibold text-foreground">{analysis.financialTerms.advanceAmount}</p>
                    </div>
                  )}
                  {analysis.territory && (
                    <div className="p-3 border border-border rounded-lg">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Territory</p>
                      <p className="text-sm font-semibold text-foreground">{analysis.territory}</p>
                    </div>
                  )}
                </div>

                {/* Concerns */}
                {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Potential Concerns</h2>
                    <div className="space-y-2">
                      {analysis.potentialConcerns.map((concern, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleClauseClick(analysis.concernSnippets?.[i])}
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">{concern}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Terms Tab */}
              <TabsContent value="terms" className="mt-0 space-y-4">
                {analysis.keyTerms && analysis.keyTerms.length > 0 ? (
                  analysis.keyTerms.map((term, i) => {
                    const isExpanded = expandedTerm === i;
                    return (
                      <div key={i} className="border border-border rounded-lg overflow-hidden">
                        <div
                          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedTerm(isExpanded ? null : i)}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            term.riskLevel === "high" ? "bg-red-500" :
                            term.riskLevel === "medium" ? "bg-amber-500" : "bg-green-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{term.title}</p>
                            {!isExpanded && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{term.explanation}</p>
                            )}
                          </div>
                          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
                                <div className="pt-3">
                                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Summary</p>
                                  <p className="text-sm text-foreground">{term.content}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Plain English</p>
                                  <p className="text-sm text-foreground">{term.explanation}</p>
                                </div>
                                {term.originalText && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleClauseClick(term.originalText); }}
                                    className="text-xs text-purple-500 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" /> View in contract
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No key terms identified.</p>
                )}
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="mt-0 space-y-6">
                {analysis.financialTerms ? (
                  <div className="grid gap-4">
                    {Object.entries(analysis.financialTerms).map(([key, value]) => (
                      value && (
                        <div key={key} className="p-4 border border-border rounded-lg">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm font-medium text-foreground">{String(value)}</p>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No financial terms identified.</p>
                )}
              </TabsContent>

              {/* Advice Tab */}
              <TabsContent value="advice" className="mt-0 space-y-4">
                {analysis.negotiationAdvice && analysis.negotiationAdvice.length > 0 ? (
                  analysis.negotiationAdvice.map((advice, i) => (
                    <div key={i} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{advice.point}</p>
                          <p className="text-xs text-muted-foreground mt-1">{advice.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No negotiation advice available.</p>
                )}
              </TabsContent>
            </>
          ) : (
            <div className="text-center py-20">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No analysis available</p>
            </div>
          )}
        </main>
      </Tabs>

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
    </motion.div>
  );
}
