"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractAnalysis } from "@/types/contract";
import { Contract } from "@/types/database";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Download,
  Star,
  Trash2,
  Upload,
  History,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  HelpSquareIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import { ContractsIcon, ViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { MusicLoader } from "@/components/MusicLoader";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

// Dynamically import PDF viewer
const PDFViewerWithSearch = dynamic(() => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <MusicLoader />
    </div>
  ),
});

// Default missing clauses
const DEFAULT_MISSING_CLAUSES = [
  { clause: "Audit Rights", severity: "critical" as const, description: "No provision allowing you to audit financial records" },
  { clause: "Reversion Clause", severity: "high" as const, description: "No automatic rights reversion if works are unexploited" },
  { clause: "Creative Control", severity: "medium" as const, description: "No approval rights over how your work is used" },
  { clause: "Termination for Cause", severity: "medium" as const, description: "Limited grounds specified for early termination" },
];

// Highlight key values in text
function highlightKeyValues(text: string, isSelected?: boolean): React.ReactNode {
  const pattern = /(\d+(?:\.\d+)?%|\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand|k|m|b))?|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:-|\s)?(?:year|month|week|day|hour)s?|\d+(?:-|\s)?(?:year|month|week|day|hour)s?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+(?:st|nd|rd|th)?|\d+(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)|\d+(?:st|nd|rd|th)|\d+(?:,\d+)*(?:\.\d+)?)/gi;

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    if (!part) return null;
    const isKeyValue = pattern.test(part);
    pattern.lastIndex = 0;

    if (isKeyValue) {
      const nextPart = parts[i + 1];
      if (nextPart && nextPart.startsWith(',')) {
        parts[i + 1] = nextPart.slice(1);
      }

      return (
        <span
          key={i}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mx-0.5"
          style={{
            backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 0, 0, 0.06)',
            color: isSelected ? '#a855f7' : '#202020',
            transition: 'all 0.3s ease'
          }}
        >
          {part}
        </span>
      );
    }

    return (
      <span key={i} style={{ color: '#565c65' }}>
        {part}
      </span>
    );
  });
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const contractId = params.id as string;

  // Core state
  const [contract, setContract] = useState<Contract | null>(null);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");

  // UI state
  const [showDocument, setShowDocument] = useState(true);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedTerm, setExpandedTerm] = useState<number | null>(0);
  const [expandedAdvice, setExpandedAdvice] = useState<number | null>(null);
  const [selectedFinancial, setSelectedFinancial] = useState<string | null>(null);
  const [selectedKeyInfo, setSelectedKeyInfo] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Version tracking
  interface ContractVersion {
    id: string;
    version_number: number;
    file_url: string;
    changes_summary: string;
    analysis: ContractAnalysis & {
      improvements?: string[];
      regressions?: string[];
    };
    created_at: string;
  }
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const versionInputRef = useRef<HTMLInputElement>(null);

  // Key dates
  interface ContractDate {
    id: string;
    date_type: string;
    date: string;
    description: string;
  }
  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState({ date_type: "", date: "", description: "" });

  // Fetch contract data
  useEffect(() => {
    async function fetchContract() {
      if (!contractId) return;

      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error) throw error;

        setContract(data as Contract);
        if (data?.analysis) {
          const analysisData = data.analysis as ContractAnalysis;
          if (!analysisData.missingClauses) {
            analysisData.missingClauses = DEFAULT_MISSING_CLAUSES;
          }
          setAnalysis(analysisData);
        }

        // Fetch signed URL for PDF
        if (data?.file_url) {
          const fileResponse = await fetch(`/api/contracts/${contractId}/file`);
          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            setFileUrl(fileData.url);
          }
        }
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Failed to load contract");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchContract();
    }
  }, [contractId, authLoading, supabase]);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!contractId) return;
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      const data = await response.json();
      if (response.ok && data.versions) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  }, [contractId]);

  // Fetch dates
  const fetchDates = useCallback(async () => {
    if (!contractId) return;
    setLoadingDates(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/dates`);
      const data = await response.json();
      if (response.ok && data.dates) {
        setDates(data.dates);
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
    } finally {
      setLoadingDates(false);
    }
  }, [contractId]);

  // Upload new version
  const uploadNewVersion = useCallback(async (file: File) => {
    if (!contractId) return;
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchVersions();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to upload version");
      }
    } catch (err) {
      console.error("Error uploading version:", err);
    } finally {
      setUploadingVersion(false);
    }
  }, [contractId, fetchVersions]);

  // Add date
  const addDate = useCallback(async () => {
    if (!contractId || !newDate.date_type || !newDate.date) return;
    try {
      const response = await fetch(`/api/contracts/${contractId}/dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDate),
      });
      if (response.ok) {
        fetchDates();
        setShowAddDate(false);
        setNewDate({ date_type: "", date: "", description: "" });
      }
    } catch (err) {
      console.error("Error adding date:", err);
    }
  }, [contractId, newDate, fetchDates]);

  // Delete date
  const deleteDate = useCallback(async (dateId: string) => {
    if (!contractId) return;
    try {
      await fetch(`/api/contracts/${contractId}/dates?dateId=${dateId}`, {
        method: "DELETE",
      });
      setDates(dates.filter((d) => d.id !== dateId));
    } catch (err) {
      console.error("Error deleting date:", err);
    }
  }, [contractId, dates]);

  // Fetch versions and dates on load
  useEffect(() => {
    if (contractId && !loading) {
      fetchVersions();
      fetchDates();
    }
  }, [contractId, loading, fetchVersions, fetchDates]);

  // Handle clause click for highlighting
  const handleClauseClick = useCallback((originalText: string | undefined) => {
    if (originalText) {
      setHighlightedClause(originalText);
      setShowDocument(true);
    }
  }, []);

  const toggleStar = async () => {
    if (!contract) return;
    await supabase
      .from("contracts")
      .update({ is_starred: !contract.is_starred })
      .eq("id", contract.id);
    setContract({ ...contract, is_starred: !contract.is_starred });
  };

  const handleDelete = async () => {
    if (!contract) return;
    await supabase.from("contracts").delete().eq("id", contract.id);
    router.push("/dashboard/contracts");
  };

  // Download report
  const handleDownloadReport = useCallback(async () => {
    if (!analysis || !contract) return;

    setDownloading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contract.title || analysis.contractType || "Contract Analysis",
          analysis,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const html = await response.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  }, [analysis, contract]);

  // Helper functions
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getTermChecklist = (title: string): string[] => {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("royalt")) {
      return [
        "Verify the exact percentage and what it applies to (gross vs net)",
        "Check if there are different rates for different income sources",
        "Look for any deductions taken before your royalty is calculated"
      ];
    }
    if (titleLower.includes("term") || titleLower.includes("duration") || titleLower.includes("period")) {
      return [
        "Confirm the exact start and end dates of the agreement",
        "Check for automatic renewal or extension clauses",
        "Look for early termination rights and any associated penalties"
      ];
    }
    if (titleLower.includes("rights") || titleLower.includes("ownership") || titleLower.includes("copyright")) {
      return [
        "Clarify exactly which rights you are granting (exclusive vs non-exclusive)",
        "Check if rights revert to you after the term ends",
        "Verify territorial limitations on rights granted"
      ];
    }
    if (titleLower.includes("advance") || titleLower.includes("payment") || titleLower.includes("fee")) {
      return [
        "Confirm the payment schedule and any conditions for payment",
        "Check if the advance is recoupable and from what income sources",
        "Look for audit rights to verify payment accuracy"
      ];
    }
    return [
      "Compare this term against industry standards for similar agreements",
      "Check how this term interacts with other clauses in the contract",
      "Consider if this term could limit your future opportunities"
    ];
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <MusicLoader />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#fcfcfc' }}>
        <div className="text-center space-y-4 max-w-md p-6 border border-border rounded-lg">
          <div className="w-12 h-12 rounded-lg border border-red-400/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">Contract Not Found</p>
            <p className="text-sm text-muted-foreground mt-1">{error || "Unable to load this contract"}</p>
          </div>
          <Link href="/dashboard/contracts">
            <Button className="bg-foreground text-background hover:bg-foreground/90 rounded">
              Back to Contracts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#fcfcfc' }}>
        <div className="text-center space-y-4 max-w-md p-6 border border-border rounded-lg">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">No analysis available for this contract</p>
          <Link href="/dashboard/contracts">
            <Button variant="outline">Back to Contracts</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Build tabs array
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "terms", label: "Key Terms" },
    { id: "financial", label: "Finances" },
    { id: "advice", label: "Advice" },
    { id: "versions", label: "Versions" },
    { id: "dates", label: "Dates" },
  ];

  return (
    <div className="flex h-full" style={{ backgroundColor: '#fcfcfc' }}>
      {/* Document Side Panel */}
      <div
        className={cn(
          "h-full flex flex-col bg-background transition-all duration-300 ease-in-out",
          showDocument ? "w-1/2 max-w-2xl border-r border-border" : "w-0"
        )}
      >
        {showDocument && (
          <>
            {/* Panel Header */}
            <div className="shrink-0 h-12 px-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{contract.title}</span>
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
                  className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            {/* PDF Content */}
            <div className="flex-1 overflow-auto bg-card">
              {fileUrl ? (
                <PDFViewerWithSearch
                  fileUrl={fileUrl}
                  searchText={highlightedClause || ""}
                  className="h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No document available</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Sticky Header */}
        <div className={cn(
          "sticky top-0 z-20 bg-background border-b border-border px-4 h-12 flex items-center",
          showDocument ? "w-full" : ""
        )}>
          <div className={cn(
            "flex items-center justify-between w-full",
            !showDocument && "max-w-4xl mx-auto"
          )}>
            <div className="flex items-center gap-3">
              {/* Breadcrumb */}
              <Link href="/dashboard/contracts" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <HugeiconsIcon icon={ContractsIcon} size={14} />
                <span>Contracts</span>
              </Link>
              <span className="text-muted-foreground/40">/</span>
              <h1 className="text-sm font-medium text-foreground">{contract.title || analysis.contractType}</h1>
              <span className={cn(
                "h-5 px-2 text-[10px] uppercase font-medium rounded-md flex items-center",
                analysis.overallRiskAssessment === "low" ? "bg-green-500/10 text-green-600" :
                analysis.overallRiskAssessment === "medium" ? "bg-yellow-500/10 text-yellow-600" :
                analysis.overallRiskAssessment === "high" ? "bg-red-500/10 text-red-600" :
                "bg-muted text-muted-foreground"
              )}>
                {analysis.overallRiskAssessment === "low" ? "Low Risk" :
                 analysis.overallRiskAssessment === "medium" ? "Medium Risk" :
                 analysis.overallRiskAssessment === "high" ? "High Risk" : "Analyzed"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowDocument(!showDocument)}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors rounded-md"
              >
                <Eye className="w-3 h-3" />
                {showDocument ? "Hide PDF" : "Show PDF"}
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors disabled:opacity-50 rounded-md"
              >
                {downloading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                Download
              </button>

              {/* Upload New Version */}
              <input
                ref={versionInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadNewVersion(file);
                }}
              />
              <button
                onClick={() => versionInputRef.current?.click()}
                disabled={uploadingVersion}
                className="h-7 w-7 flex items-center justify-center border border-border hover:bg-muted transition-colors disabled:opacity-50 rounded-md"
              >
                {uploadingVersion ? (
                  <Loader2 className="w-3 h-3 text-muted-foreground/60 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 text-muted-foreground" />
                )}
              </button>

              <button
                onClick={toggleStar}
                className="h-7 w-7 flex items-center justify-center border border-border hover:bg-muted transition-colors rounded-md"
              >
                <Star className={cn("w-3 h-3", contract.is_starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
              </button>
              <button
                onClick={() => setDeleteModal(true)}
                className="h-7 w-7 flex items-center justify-center border border-border hover:bg-muted transition-colors rounded-md text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <main className={cn(
          "px-6 py-6 pb-24 transition-all duration-300",
          showDocument ? "w-full" : "max-w-4xl mx-auto"
        )}>
          {/* Tabbed Content with animated underlines */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex gap-6 border-b border-border -mr-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative pb-3 text-sm transition-colors",
                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-underline-contract-detail"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3 -mr-6">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Summary</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3">
                  {(() => {
                    const sentences = analysis.summary.match(/[^.!?]+[.!?]+/g) || [analysis.summary];
                    const paragraphs: string[] = [];
                    for (let i = 0; i < sentences.length; i += 3) {
                      paragraphs.push(sentences.slice(i, i + 3).join(' ').trim());
                    }
                    return paragraphs.map((para, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
                    ));
                  })()}
                </div>
              </div>

              {/* Financial Terms */}
              {analysis.financialTerms && (
                <div>
                  <div className="flex items-center gap-2 mb-4 -mr-6">
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Financial Analysis</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-0">
                    {analysis.financialTerms.royaltyRate && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{ borderColor: selectedFinancial === 'royalty' ? '#a855f7' : undefined, transition: 'border-color 0.3s ease' }}
                        onClick={() => { setSelectedFinancial('royalty'); handleClauseClick(analysis.financialTerms.royaltyRate); }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm mb-0.5">{highlightKeyValues(analysis.financialTerms.royaltyRate, selectedFinancial === 'royalty')}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : '#a0a0a0' }}>Royalty</p>
                        </div>
                      </div>
                    )}
                    {analysis.termLength && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{ borderColor: selectedFinancial === 'term' ? '#a855f7' : undefined, transition: 'border-color 0.3s ease' }}
                        onClick={() => { setSelectedFinancial('term'); handleClauseClick(analysis.termLength); }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm mb-0.5">{highlightKeyValues(analysis.termLength, selectedFinancial === 'term')}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'term' ? '#a855f7' : '#a0a0a0' }}>Term</p>
                        </div>
                      </div>
                    )}
                    {analysis.financialTerms.advanceAmount && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{ borderColor: selectedFinancial === 'advance' ? '#a855f7' : undefined, transition: 'border-color 0.3s ease' }}
                        onClick={() => { setSelectedFinancial('advance'); handleClauseClick(analysis.financialTerms.advanceAmount); }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm mb-0.5">{highlightKeyValues(analysis.financialTerms.advanceAmount, selectedFinancial === 'advance')}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : '#a0a0a0' }}>Advance</p>
                        </div>
                      </div>
                    )}
                    {analysis.financialTerms.paymentSchedule && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{ borderColor: selectedFinancial === 'payment' ? '#a855f7' : 'transparent', transition: 'border-color 0.3s ease' }}
                        onClick={() => { setSelectedFinancial('payment'); handleClauseClick(analysis.financialTerms.paymentSchedule); }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm mb-0.5">{highlightKeyValues(analysis.financialTerms.paymentSchedule, selectedFinancial === 'payment')}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : '#a0a0a0' }}>Payment</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Issues Overview */}
              {((analysis.potentialConcerns && analysis.potentialConcerns.length > 0) || (analysis.missingClauses && analysis.missingClauses.length > 0)) && (
                <div>
                  <div className="flex items-center gap-2 mb-4 -mr-6">
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Issues to Review</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.potentialConcerns?.slice(0, 4).map((concern, i) => {
                      const matchingTerm = analysis.keyTerms?.find(term => {
                        const concernLower = concern.toLowerCase();
                        const titleLower = term.title.toLowerCase();
                        const contentLower = term.content.toLowerCase();
                        const keywords = concernLower.split(/\s+/).filter(w => w.length > 4);
                        return keywords.some(kw => titleLower.includes(kw) || contentLower.includes(kw));
                      });
                      const riskLevel = matchingTerm?.riskLevel || 'medium';
                      const colorStyles = {
                        high: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', dot: 'bg-red-500' },
                        medium: { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', dot: 'bg-yellow-500' },
                        low: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', dot: 'bg-green-500' },
                      }[riskLevel];
                      return (
                        <span key={`concern-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: colorStyles.bg, color: colorStyles.text }} onClick={() => setActiveTab('terms')}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.dot}`} />
                          {concern.length > 40 ? concern.slice(0, 40) + '...' : concern}
                        </span>
                      );
                    })}
                    {analysis.potentialConcerns && analysis.potentialConcerns.length > 4 && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: '#f0f0f0', color: '#565c65' }} onClick={() => setActiveTab('terms')}>
                        +{analysis.potentialConcerns.length - 4} more
                      </span>
                    )}
                    {analysis.missingClauses?.slice(0, 3).map((clause, i) => {
                      const severityColors = {
                        critical: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', dot: 'bg-red-500' },
                        high: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', dot: 'bg-red-500' },
                        medium: { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', dot: 'bg-yellow-500' },
                        low: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', dot: 'bg-green-500' },
                      }[clause.severity] || { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', dot: 'bg-yellow-500' };
                      return (
                        <span key={`missing-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: severityColors.bg, color: severityColors.text }} onClick={() => setActiveTab('terms')}>
                          <span className={`w-1.5 h-1.5 rounded-full ${severityColors.dot}`} />
                          {clause.clause}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key Information */}
              <div>
                <div className="flex items-center gap-2 mb-4 -mr-6">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Key Information</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <AnimatePresence>
                  {selectedKeyInfo && (
                    <motion.div onClick={() => setSelectedKeyInfo(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" />
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2 flex-wrap relative">
                  {(() => {
                    const keyInfoItems: { id: string; label: string; value: string; isBlue?: boolean }[] = [];
                    if (analysis.parties) {
                      const labels: Record<string, string> = { artist: 'Artist', label: 'Label', publisher: 'Publisher', manager: 'Manager', distributor: 'Distributor', brand: 'Brand', team: 'Team', client: 'Client', landlord: 'Landlord', tenant: 'Tenant', individual: 'Individual', company: 'Company' };
                      Object.entries(analysis.parties).forEach(([key, value]) => {
                        if (value && key !== 'other') keyInfoItems.push({ id: `party-${key}`, label: labels[key] || key, value: value as string, isBlue: true });
                      });
                    }
                    if (analysis.contractType) keyInfoItems.push({ id: 'type', label: 'Contract Type', value: analysis.contractType });
                    if (analysis.effectiveDate) keyInfoItems.push({ id: 'date', label: 'Effective Date', value: analysis.effectiveDate });
                    if (analysis.termLength) keyInfoItems.push({ id: 'term', label: 'Term Length', value: analysis.termLength });
                    if (analysis.rightsAndOwnership?.territorialRights) keyInfoItems.push({ id: 'territory', label: 'Territory', value: analysis.rightsAndOwnership.territorialRights });
                    if (analysis.rightsAndOwnership?.exclusivity) keyInfoItems.push({ id: 'exclusivity', label: 'Exclusivity', value: analysis.rightsAndOwnership.exclusivity });

                    return keyInfoItems.map((item) => {
                      const isSelected = selectedKeyInfo === item.id;
                      return (
                        <motion.div key={item.id} layout style={{ transformOrigin: "50% 50% 0px", borderRadius: isSelected ? "16px" : "9999px", zIndex: isSelected ? 50 : 1 }} className="relative overflow-hidden">
                          <motion.button onClick={() => setSelectedKeyInfo(isSelected ? null : item.id)} style={{ pointerEvents: !isSelected ? "all" : "none", display: isSelected ? "none" : "flex", backgroundColor: item.isBlue ? 'rgba(59, 130, 246, 0.1)' : '#f0f0f0', color: item.isBlue ? '#3b82f6' : '#565c65' }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 350, damping: 35 }} layoutId={`pill-${item.id}`} className="inline-flex items-center px-3 py-1.5 text-xs font-medium cursor-pointer">
                            {item.value}
                          </motion.button>
                          <AnimatePresence mode="popLayout">
                            {isSelected && (
                              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 550, damping: 45, mass: 0.7 }} className="bg-white border border-border rounded-2xl p-4 shadow-lg min-w-[200px]" style={{ transformOrigin: "50% 50% 0px" }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                                  <button onClick={() => setSelectedKeyInfo(null)} className="text-muted-foreground hover:text-foreground">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                  </button>
                                </div>
                                <motion.p layoutId={`pill-${item.id}`} className="text-sm font-medium" style={{ color: item.isBlue ? '#3b82f6' : '#202020' }}>{item.value}</motion.p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </div>
            </TabsContent>

            {/* Key Terms Tab */}
            <TabsContent value="terms" className="space-y-4">
              {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (() => {
                const matchedRiskLevels = analysis.potentialConcerns.map((concern) => {
                  const matchingTerm = analysis.keyTerms?.find(term => {
                    const concernLower = concern.toLowerCase();
                    const titleLower = term.title.toLowerCase();
                    const contentLower = term.content.toLowerCase();
                    const keywords = concernLower.split(/\s+/).filter(w => w.length > 4);
                    return keywords.some(kw => titleLower.includes(kw) || contentLower.includes(kw));
                  });
                  return matchingTerm?.riskLevel || 'medium';
                });
                const hasHigh = matchedRiskLevels.includes('high');
                const hasMedium = matchedRiskLevels.includes('medium');
                const highestRisk = hasHigh ? 'high' : hasMedium ? 'medium' : 'low';
                const colorScheme = { high: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', dot: 'bg-red-400/60' }, medium: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', dot: 'bg-amber-400/60' }, low: { border: 'border-green-500/30', bg: 'bg-green-500/5', text: 'text-green-400', dot: 'bg-green-400/60' } }[highestRisk];
                const headerColors = { high: { bg: 'rgba(239, 68, 68, 0.08)', line: '#ef4444' }, medium: { bg: 'rgba(245, 158, 11, 0.08)', line: '#f59e0b' }, low: { bg: 'rgba(34, 197, 94, 0.08)', line: '#22c55e' } }[highestRisk];

                return (
                  <div className={`border ${colorScheme.border} ${colorScheme.bg} rounded-xl overflow-hidden`}>
                    <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: headerColors.bg, borderColor: headerColors.line }}>
                      <HugeiconsIcon icon={Alert02Icon} size={14} className={colorScheme.text} />
                      <span className={`text-xs font-medium ${colorScheme.text} leading-none`}>{analysis.potentialConcerns.length} Concerns to Address</span>
                    </div>
                    <ul className="p-4 space-y-2">
                      {analysis.potentialConcerns.map((concern, i) => {
                        const matchingTermIndex = analysis.keyTerms?.findIndex(term => {
                          const concernLower = concern.toLowerCase();
                          const titleLower = term.title.toLowerCase();
                          const contentLower = term.content.toLowerCase();
                          const keywords = concernLower.split(/\s+/).filter(w => w.length > 4);
                          return keywords.some(kw => titleLower.includes(kw) || contentLower.includes(kw));
                        });
                        const snippet = analysis.concernSnippets?.[i];
                        const matchingTerm = matchingTermIndex !== undefined && matchingTermIndex >= 0 ? analysis.keyTerms?.[matchingTermIndex] : null;
                        return (
                          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors group" onClick={() => { const textToHighlight = snippet || matchingTerm?.originalText; if (textToHighlight) handleClauseClick(textToHighlight); if (matchingTermIndex !== undefined && matchingTermIndex >= 0) setExpandedTerm(matchingTermIndex); }}>
                            <span className={`w-1 h-1 rounded-full ${colorScheme.dot} shrink-0 group-hover:bg-primary`} />
                            <span className="leading-tight">{concern}</span>
                            <Eye className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })()}

              {(!analysis.keyTerms || analysis.keyTerms.length === 0) && (
                <div className="border border-border p-8 text-center rounded-lg">
                  <FileText className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No key terms extracted</p>
                </div>
              )}
              {analysis.keyTerms?.map((term, i) => {
                const isExpanded = expandedTerm === i;
                return (
                  <div key={i} className={cn("border border-border transition-all rounded-lg overflow-hidden", isExpanded && "border-[#d1d5db]")}>
                    <button onClick={() => setExpandedTerm(isExpanded ? null : i)} className="w-full p-3 flex items-center gap-3 text-left transition-colors rounded-t-lg" style={{ backgroundColor: '#f5f5f4' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-foreground font-medium">{term.title}</span>
                          <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full capitalize", getRiskColor(term.riskLevel))}>{term.riskLevel}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{term.content}</p>
                      </div>
                      <div className={cn("text-muted-foreground/60 transition-transform shrink-0", isExpanded && "rotate-180")}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </button>
                    <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden bg-white">
                      <div className="border-t border-border">
                        <div className="p-3 space-y-4">
                          <div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">What This Says</p><p className="text-xs text-foreground">{term.content}</p></div>
                          <div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">In Plain English</p><p className="text-xs text-foreground">{term.explanation}</p></div>
                          <div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Risk Assessment</p><div className="flex items-start gap-2"><span className={cn("text-[10px] px-2.5 py-0.5 rounded-full capitalize shrink-0", getRiskColor(term.riskLevel))}>{term.riskLevel}</span><p className="text-xs text-foreground">{term.riskLevel === "high" && "This term significantly favors the other party and could limit your rights or earnings."}{term.riskLevel === "medium" && "This term has some elements that could be improved but is within industry norms."}{term.riskLevel === "low" && "This term is favorable or standard for agreements of this type."}</p></div></div>
                          <div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Questions to Ask Your Lawyer</p><ul className="text-xs text-muted-foreground space-y-2">{(term.actionItems || getTermChecklist(term.title)).map((item, idx) => (<li key={idx} className="flex items-center gap-2"><HugeiconsIcon icon={HelpSquareIcon} size={12} className="text-primary shrink-0" /><span className="leading-none">{item}</span></li>))}</ul></div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleClauseClick(term.originalText); }} className="w-full px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors" style={{ backgroundColor: '#f5f5f4' }}>
                          <HugeiconsIcon icon={ViewIcon} size={14} /> View in contract
                        </button>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </TabsContent>

            {/* Financial Calculator Tab */}
            <TabsContent value="financial">
              <FinancialCalculator contractData={{ royaltyRate: analysis.financialTerms?.royaltyRate, advanceAmount: analysis.financialTerms?.advanceAmount, termLength: analysis.termLength }} />
            </TabsContent>

            {/* Advice Tab */}
            <TabsContent value="advice" className="space-y-2">
              {(!analysis.recommendations || analysis.recommendations.length === 0) && (<div className="border border-border p-8 text-center rounded-lg"><CheckCircle2 className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" /><p className="text-xs text-muted-foreground">No recommendations available</p></div>)}
              {analysis.recommendations?.map((rec, i) => {
                const isExpanded = expandedAdvice === i;
                const isStructured = typeof rec === 'object' && rec !== null;
                const advice = isStructured ? rec.advice : rec;
                const rationale = isStructured ? rec.rationale : "Following this recommendation helps protect your rights and ensures you maintain leverage in negotiations.";
                const howToImplement = isStructured ? rec.howToImplement : "Bring this up during your next negotiation session.";
                const priority = isStructured ? rec.priority : "medium";
                const priorityColor = priority === "high" ? "text-red-400" : priority === "medium" ? "text-amber-500" : "text-green-400";
                const priorityLabel = priority === "high" ? "Address immediately" : priority === "medium" ? "Address before signing" : "Nice to have";
                return (
                  <div key={i} className={cn("border border-border transition-all rounded-lg", isExpanded && "bg-card border-[#404040]")}>
                    <button onClick={() => setExpandedAdvice(isExpanded ? null : i)} className="w-full p-3 flex items-start gap-2.5 text-left hover:bg-muted transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground">{advice}</p>{isStructured && <span className={cn("text-[10px] mt-1 inline-block", priorityColor)}>{priority.charAt(0).toUpperCase() + priority.slice(1)} priority</span>}</div>
                      <div className={cn("text-muted-foreground/60 transition-transform shrink-0", isExpanded && "rotate-180")}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                    </button>
                    <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                      <div className="border-t border-border"><div className="p-3 space-y-3"><div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Rationale</p><p className="text-xs text-muted-foreground">{rationale}</p></div><div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">How to Implement</p><p className="text-xs text-muted-foreground">{howToImplement}</p></div><div><p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Priority</p><div className="flex items-center gap-2"><span className={cn("text-xs", priorityColor)}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span><span className="text-[10px] text-muted-foreground/60">{priorityLabel}</span></div></div></div></div>
                    </motion.div>
                  </div>
                );
              })}
            </TabsContent>

            {/* Version History Tab */}
            <TabsContent value="versions" className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-foreground">Version History</h4>
                <button onClick={() => versionInputRef.current?.click()} disabled={uploadingVersion} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-purple-400/60 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50">
                  {uploadingVersion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Upload New Version
                </button>
              </div>
              {loadingVersions ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 border border-border rounded-lg">
                  <History className="w-6 h-6 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">No version history yet</p>
                  <p className="text-[10px] text-muted-foreground/60">Upload a new version to start tracking changes</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                  {versions.map((version, i) => (
                    <div key={version.id} className="relative pl-8 pb-4">
                      <div className={cn("absolute left-1.5 w-4 h-4 flex items-center justify-center", i === 0 ? "bg-foreground text-background" : "bg-muted border border-border text-muted-foreground")}>
                        <span className="text-[8px] font-bold">{version.version_number + 1}</span>
                      </div>
                      <div className="p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-muted-foreground px-2 py-0.5 border border-border rounded-full">Version {version.version_number + 1}</span>
                          <span className="text-[10px] text-muted-foreground/60">{new Date(version.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{version.changes_summary}</p>
                        {version.analysis?.improvements && version.analysis.improvements.length > 0 && (
                          <div className="space-y-1 mb-2">{version.analysis.improvements.slice(0, 2).map((imp, j) => (<div key={j} className="flex items-center gap-1.5 text-[10px] text-green-400"><ArrowUpRight className="w-2.5 h-2.5" /><span>{imp}</span></div>))}</div>
                        )}
                        {version.analysis?.regressions && version.analysis.regressions.length > 0 && (
                          <div className="space-y-1">{version.analysis.regressions.slice(0, 2).map((reg, j) => (<div key={j} className="flex items-center gap-1.5 text-[10px] text-red-400"><ArrowDownRight className="w-2.5 h-2.5" /><span>{reg}</span></div>))}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Key Dates Tab */}
            <TabsContent value="dates" className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-foreground">Key Dates & Deadlines</h4>
                <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                  <DialogTrigger asChild>
                    <button className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors">
                      <Plus className="w-3 h-3" />Add Date
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground text-sm">Add Key Date</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-xs">Track important deadlines for this contract</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Type</label>
                        <Select value={newDate.date_type} onValueChange={(v) => setNewDate({ ...newDate, date_type: v })}>
                          <SelectTrigger className="bg-transparent border-border text-foreground text-xs h-8"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="option_period">Option Period</SelectItem>
                            <SelectItem value="termination_window">Termination Window</SelectItem>
                            <SelectItem value="renewal">Renewal Date</SelectItem>
                            <SelectItem value="expiration">Expiration</SelectItem>
                            <SelectItem value="payment">Payment Due</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Date</label>
                        <Input type="date" value={newDate.date} onChange={(e) => setNewDate({ ...newDate, date: e.target.value })} className="bg-transparent border-border text-foreground text-xs h-8" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
                        <Input placeholder="e.g., Album option deadline" value={newDate.description} onChange={(e) => setNewDate({ ...newDate, description: e.target.value })} className="bg-transparent border-border text-foreground placeholder:text-muted-foreground/60 text-xs h-8" />
                      </div>
                    </div>
                    <button onClick={addDate} className="w-full h-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors">Add Date</button>
                  </DialogContent>
                </Dialog>
              </div>
              {loadingDates ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" /></div>
              ) : dates.length === 0 ? (
                <div className="text-center py-10 border border-border rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">No key dates tracked</p>
                  <p className="text-[10px] text-muted-foreground/60">Add important deadlines to get reminders</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {dates.map((date) => {
                    const dateObj = new Date(date.date);
                    const today = new Date();
                    const daysUntil = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isPast = daysUntil < 0;
                    const isUrgent = daysUntil >= 0 && daysUntil <= 7;
                    const typeLabels: Record<string, string> = { option_period: "Option Period", termination_window: "Termination", renewal: "Renewal", expiration: "Expiration", payment: "Payment" };
                    return (
                      <div key={date.id} className={cn("p-2.5 border border-border flex items-center gap-2.5 rounded-lg", isPast && "border-red-400/30", isUrgent && !isPast && "border-yellow-400/30")}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/60">{typeLabels[date.date_type] || date.date_type}</span>
                            {isPast && <span className="text-[9px] text-red-400 px-1 py-0.5 border border-red-400/30">Overdue</span>}
                            {isUrgent && !isPast && <span className="text-[9px] text-yellow-400 px-1 py-0.5 border border-yellow-400/30">{daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}</span>}
                          </div>
                          <p className="text-xs text-foreground truncate">{date.description || dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <button onClick={() => deleteDate(date.id)} className="shrink-0 w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors">
                          <Trash2 className="w-2.5 h-2.5 text-muted-foreground/60 hover:text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal open={deleteModal} onOpenChange={setDeleteModal} onConfirm={handleDelete} title={contract.title} versionCount={0} />
    </div>
  );
}
