"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ContractAnalysis } from "@/types/contract";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Download,
  Upload,
  Calendar,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  FileOutput,
  Share2,
  Send,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  HelpSquareIcon,
  FolderClockIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import { ViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import { SpamIcon, Money03Icon, CalendarFavorite01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { SentIcon, Comment01Icon, SignatureIcon } from "@hugeicons-pro/core-bulk-rounded";
import { AiVisionIcon } from "@/components/icons/AiVisionIcon";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { MusicLoader } from "@/components/MusicLoader";
import { ContractComments } from "@/components/ContractComments";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { exportAnnotatedContract } from "@/lib/pdf-export";

const PDFViewerWithSearch = dynamic(() => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <MusicLoader />
    </div>
  ),
});

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

interface ContractDate {
  id: string;
  date_type: string;
  date: string;
  description: string;
}

interface ContractAnalysisViewProps {
  analysis: ContractAnalysis;
  fileName: string;
  fileUrl: string;
  contractId?: string | null;
  onReset?: () => void;
  onDownloadReport?: () => Promise<void>;
  onExportPDF?: () => Promise<void>;
  // Version management
  versions?: ContractVersion[];
  loadingVersions?: boolean;
  uploadingVersion?: boolean;
  onUploadVersion?: (file: File) => Promise<void>;
  // Date management
  dates?: ContractDate[];
  loadingDates?: boolean;
  onAddDate?: (date: { date_type: string; date: string; description: string }) => Promise<void>;
  onDeleteDate?: (dateId: string) => Promise<void>;
  // Save state
  saving?: boolean;
  // Original file for export
  originalFile?: File | null;
  // PDF error state
  pdfError?: string | null;
  // Discussion/Comments for shared views
  showDiscussionTab?: boolean;
  canComment?: boolean;
  isSharedView?: boolean;
  // Initial tab to show (for deep linking from notifications)
  initialTab?: string;
}

// Helper to safely render values that might be objects
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    // Handle objects like { Albums: "15%", "12-inch Singles": "12%" }
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '';
    if (entries.length === 1) return String(entries[0][1]);
    return entries.map(([key, val]) => `${key}: ${val}`).join(', ');
  }
  return String(value);
}

// Risk color helper
function getRiskColor(level: string) {
  switch (level) {
    case "high":
      return "text-red-600 bg-red-500/10";
    case "medium":
      return "text-yellow-600 bg-yellow-500/10";
    case "low":
      return "text-green-600 bg-green-500/10";
    default:
      return "text-muted-foreground";
  }
}

// Term checklist helper
function getTermChecklist(termTitle: string): string[] {
  const title = termTitle.toLowerCase();
  if (title.includes('royalt')) {
    return ["What is the royalty base (gross vs net)?", "Are there any deductions before royalties are calculated?", "How often are royalties paid and reported?"];
  }
  if (title.includes('term') || title.includes('duration')) {
    return ["Can the term be extended and under what conditions?", "What happens to rights after the term ends?", "Are there performance triggers for early termination?"];
  }
  if (title.includes('right') || title.includes('grant') || title.includes('license')) {
    return ["Which specific rights are being granted?", "Are there any rights you should carve out?", "What territories and media formats are included?"];
  }
  if (title.includes('exclusiv')) {
    return ["Is exclusivity necessary for this deal?", "Can you negotiate a shorter exclusivity period?", "What happens if they don't actively exploit your work?"];
  }
  return ["Is this term standard for the industry?", "What's the worst-case scenario with this term?", "Is there room to negotiate better terms?"];
}

export function ContractAnalysisView({
  analysis,
  fileName,
  fileUrl,
  contractId,
  onReset,
  onDownloadReport,
  onExportPDF,
  versions = [],
  loadingVersions = false,
  uploadingVersion = false,
  onUploadVersion,
  dates = [],
  loadingDates = false,
  onAddDate,
  onDeleteDate,
  saving = false,
  originalFile,
  pdfError,
  showDiscussionTab = false,
  canComment = false,
  isSharedView = false,
  initialTab = "overview",
}: ContractAnalysisViewProps) {
  // UI state
  const [showDocument, setShowDocument] = useState(false);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);
  const [selectedFinancial, setSelectedFinancial] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Version selection state - null means original (Version 1)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionFileUrls, setVersionFileUrls] = useState<Record<string, string>>({});

  // Compute active analysis and file URL based on selected version
  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const activeAnalysis = selectedVersion?.analysis || analysis;
  const activeFileUrl = selectedVersionId && versionFileUrls[selectedVersionId] ? versionFileUrls[selectedVersionId] : fileUrl;
  const activeVersionNumber = selectedVersion?.version_number || 1;

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "comment" | "sign">("view");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Date management
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState({ date_type: "", date: "", description: "" });

  // Refs
  const versionInputRef = useRef<HTMLInputElement>(null);

  // Fetch signed URL for version file when selected
  useEffect(() => {
    const fetchVersionFileUrl = async () => {
      if (!selectedVersionId || !contractId) return;
      if (versionFileUrls[selectedVersionId]) return; // Already fetched

      const version = versions.find(v => v.id === selectedVersionId);
      if (!version?.file_url) return;

      try {
        const response = await fetch(`/api/contracts/${contractId}/file?path=${encodeURIComponent(version.file_url)}`);
        if (response.ok) {
          const data = await response.json();
          setVersionFileUrls(prev => ({ ...prev, [selectedVersionId]: data.url }));
        }
      } catch (err) {
        console.error("Error fetching version file URL:", err);
      }
    };

    fetchVersionFileUrl();
  }, [selectedVersionId, contractId, versions, versionFileUrls]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(true);

  // Show PDF by default on desktop only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowDocument(true);
      }
    }
  }, []);

  // Handle clause click to highlight in PDF
  const handleClauseClick = useCallback((text: string | undefined) => {
    if (!text) return;
    setShowDocument(true);
    const cleanText = text.slice(0, 100).replace(/[^\w\s]/g, ' ').trim();
    setHighlightedClause(cleanText);
  }, []);

  // Handle download report
  const handleDownloadReport = async () => {
    if (onDownloadReport) {
      setDownloading(true);
      try {
        await onDownloadReport();
      } finally {
        setDownloading(false);
      }
    }
  };

  // Handle export PDF
  const handleExportPDF = async () => {
    if (onExportPDF) {
      setExporting(true);
      try {
        await onExportPDF();
      } finally {
        setExporting(false);
      }
    }
  };

  // Handle share contract
  const handleShare = async () => {
    if (!contractId || !shareEmail) return;

    setSharing(true);
    setShareError(null);

    try {
      const response = await fetch("/api/contracts/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          email: shareEmail,
          permission: sharePermission,
          message: shareMessage || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to share contract");
      }

      setShareSuccess(true);
      setTimeout(() => {
        setShowShareModal(false);
        setShareEmail("");
        setShareMessage("");
        setSharePermission("view");
        setShareSuccess(false);
      }, 2000);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : "Failed to share contract");
    } finally {
      setSharing(false);
    }
  };

  // Build tabs array
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "terms", label: "Key Terms" },
    { id: "financial", label: "Finances" },
    { id: "advice", label: "Advice" },
    ...(contractId && !isSharedView ? [
      { id: "versions", label: "Versions" },
      { id: "dates", label: "Dates" },
    ] : []),
    ...(showDiscussionTab ? [
      { id: "discussion", label: "Discussion" },
    ] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-full bg-card"
    >
      {/* Document Side Panel - Full screen overlay on mobile, side panel on desktop */}
      <div
        className={cn(
          "flex flex-col bg-background transition-all duration-300 ease-in-out",
          showDocument
            ? "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto md:w-1/2 md:max-w-2xl md:h-full md:border-r md:border-border"
            : "w-0 h-full hidden md:block"
        )}
      >
        {showDocument && (
          <>
            {/* Panel Header */}
            <div className="shrink-0 h-12 px-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{fileName}</span>
                {/* Version Selector in PDF Header */}
                {versions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 px-2 text-xs border border-border bg-muted/50 rounded-md flex items-center gap-1 focus:outline-none focus:border-purple-500 transition-colors">
                        <span className={cn(
                          "font-medium",
                          selectedVersionId ? "text-purple-400" : "text-muted-foreground"
                        )}>
                          V{activeVersionNumber}
                        </span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-xl">
                      <DropdownMenuRadioGroup
                        value={selectedVersionId || "original"}
                        onValueChange={(value) => setSelectedVersionId(value === "original" ? null : value)}
                      >
                        <DropdownMenuRadioItem value="original">
                          <span className="flex items-center gap-2">
                            V1 <span className="text-muted-foreground/60">(Original)</span>
                          </span>
                        </DropdownMenuRadioItem>
                        {versions.map((v) => (
                          <DropdownMenuRadioItem key={v.id} value={v.id}>
                            <span className="flex items-center gap-2">
                              V{v.version_number}
                              <span className="text-muted-foreground/60 text-[10px]">
                                {new Date(v.created_at).toLocaleDateString()}
                              </span>
                            </span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {highlightedClause && (
                  <span className="text-xs text-muted-foreground/60 px-2 py-0.5 border border-border rounded-lg">Highlighting</span>
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
              {activeFileUrl ? (
                <PDFViewerWithSearch
                  fileUrl={activeFileUrl}
                  searchText={highlightedClause || ""}
                  className="h-full"
                  initialScale={isMobile ? 0.8 : 1.0}
                />
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">PDF not available</p>
                  <p className="text-xs text-muted-foreground/60 max-w-xs">
                    The document file could not be loaded. The analysis is still available.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <MusicLoader />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-auto flex flex-col bg-card">
        {/* Sticky Header - Row 1: Title */}
        <div className="sticky top-0 z-20 bg-card shrink-0">
          <div className={cn(
            "px-6 py-3 md:py-0 md:h-12 flex flex-col md:flex-row md:items-center md:justify-between border-b border-border gap-2 md:gap-0",
            !showDocument && "max-w-4xl mx-auto"
          )}>
            {/* Left: Title + Risk Assessment */}
            <div className="flex items-center gap-2 shrink-0">
              <h1 className="text-sm font-medium text-foreground">{activeAnalysis.contractType || fileName}</h1>
              <span className="text-[10px] text-muted-foreground/40">•</span>
              <span className={cn(
                "text-[10px] uppercase font-medium",
                activeAnalysis.overallRiskAssessment === "low" ? "text-green-600" :
                activeAnalysis.overallRiskAssessment === "medium" ? "text-yellow-600" :
                activeAnalysis.overallRiskAssessment === "high" ? "text-red-600" :
                "text-muted-foreground"
              )}>
                {activeAnalysis.overallRiskAssessment === "low" ? "LOW RISK" :
                 activeAnalysis.overallRiskAssessment === "medium" ? "MEDIUM RISK" :
                 activeAnalysis.overallRiskAssessment === "high" ? "HIGH RISK" : "ANALYZED"}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {versions.length > 0 && (
                <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-1 rounded-md">
                  V{activeVersionNumber}
                </span>
              )}
              <button
                onClick={() => setShowDocument(!showDocument)}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors rounded-md"
              >
                <Eye className="w-3 h-3" />
                {showDocument ? "Hide PDF" : "Show PDF"}
              </button>
              {onExportPDF && (
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors disabled:opacity-50 rounded-md"
                >
                  {exporting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileOutput className="w-3 h-3" />
                  )}
                  Export
                </button>
              )}
              {onDownloadReport && (
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
              )}
              {contractId && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="h-7 px-2 text-[11px] text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:bg-purple-500/10 flex items-center gap-1.5 transition-colors rounded-md"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors rounded-md"
                >
                  New
                </button>
              )}

              {/* Upload New Version - only if saved */}
              {contractId && onUploadVersion && (
                <>
                  <input
                    ref={versionInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadVersion(file);
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
                </>
              )}

              {/* Save indicator */}
              {saving ? (
                <div className="h-7 w-7 flex items-center justify-center border border-border rounded-md">
                  <Loader2 className="w-3 h-3 text-muted-foreground/60 animate-spin" />
                </div>
              ) : contractId ? (
                <div className="h-7 w-7 flex items-center justify-center border border-border rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Row 2: Tabs */}
          <div className={cn(
            "px-6 flex items-center border-b border-border h-[49px]",
            !showDocument && "max-w-4xl mx-auto"
          )}>
            <div className="flex gap-6 h-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative h-full flex items-center text-xs font-medium transition-colors",
                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-underline-contract-view"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className={cn(
          "px-6 py-6 pb-24 transition-all duration-300 flex-1 overflow-auto",
          showDocument ? "w-full" : "max-w-4xl mx-auto"
        )}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 mb-4 -mr-6">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Summary</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-3">
                {(() => {
                  const sentences = activeAnalysis.summary.match(/[^.!?]+[.!?]+/g) || [activeAnalysis.summary];
                  const paragraphs: string[] = [];
                  for (let i = 0; i < sentences.length; i += 3) {
                    paragraphs.push(sentences.slice(i, i + 3).join(' ').trim());
                  }
                  return paragraphs.map((para, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed">{para}</p>
                  ));
                })()}
              </div>
            </div>

            {/* Financial Terms */}
            {activeAnalysis.financialTerms && (
              <div>
                <div className="flex items-center gap-2 mb-4 -mr-6">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Financial Analysis</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-0 -mt-1">
                  {activeAnalysis.financialTerms.royaltyRate && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('royalty');
                        handleClauseClick(activeAnalysis.financialTerms.royaltyRate);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : 'var(--foreground)' }}>Royalty</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(activeAnalysis.financialTerms.royaltyRate)}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeAnalysis.termLength && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('term');
                        handleClauseClick(activeAnalysis.termLength);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'term' ? '#a855f7' : 'var(--foreground)' }}>Term</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'term' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'term' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(activeAnalysis.termLength)}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeAnalysis.financialTerms.advanceAmount && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('advance');
                        handleClauseClick(activeAnalysis.financialTerms.advanceAmount);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : 'var(--foreground)' }}>Advance</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(activeAnalysis.financialTerms.advanceAmount)}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeAnalysis.financialTerms.paymentSchedule && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('payment');
                        handleClauseClick(activeAnalysis.financialTerms.paymentSchedule);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : 'var(--foreground)' }}>Payment</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(activeAnalysis.financialTerms.paymentSchedule)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues Overview */}
            {((activeAnalysis.potentialConcerns && activeAnalysis.potentialConcerns.length > 0) || (activeAnalysis.missingClauses && activeAnalysis.missingClauses.length > 0)) && (
              <div>
                <div className="flex items-center gap-2 mb-4 -mr-6">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Issues to Review</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeAnalysis.potentialConcerns?.slice(0, 4).map((concern, i) => {
                    const matchingTerm = activeAnalysis.keyTerms?.find(term => {
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
                      <span
                        key={`concern-${i}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: colorStyles.bg, color: colorStyles.text }}
                        onClick={() => setActiveTab('terms')}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.dot}`} />
                        {concern.length > 40 ? concern.slice(0, 40) + '...' : concern}
                      </span>
                    );
                  })}
                  {activeAnalysis.potentialConcerns && activeAnalysis.potentialConcerns.length > 4 && (
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      onClick={() => setActiveTab('terms')}
                    >
                      +{activeAnalysis.potentialConcerns.length - 4} more
                    </span>
                  )}
                  {activeAnalysis.missingClauses?.slice(0, 3).map((clause, i) => {
                    const severityColors = {
                      critical: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', dot: 'bg-red-500' },
                      high: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', dot: 'bg-red-500' },
                      medium: { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', dot: 'bg-yellow-500' },
                      low: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', dot: 'bg-green-500' },
                    }[clause.severity] || { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04', dot: 'bg-yellow-500' };
                    return (
                      <span
                        key={`missing-${i}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: severityColors.bg, color: severityColors.text }}
                        onClick={() => setActiveTab('terms')}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${severityColors.dot}`} />
                        {clause.clause}
                      </span>
                    );
                  })}
                  {activeAnalysis.missingClauses && activeAnalysis.missingClauses.length > 3 && (
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      onClick={() => setActiveTab('terms')}
                    >
                      +{activeAnalysis.missingClauses.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Key Information */}
            <div>
              <div className="flex items-center gap-2 mb-4 -mr-6">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Key Information</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const keyInfoItems: { id: string; label: string; value: string; isBlue?: boolean }[] = [];
                  if (activeAnalysis.parties) {
                    const labels: Record<string, string> = {
                      artist: 'Artist', label: 'Label', publisher: 'Publisher', manager: 'Manager',
                      distributor: 'Distributor', brand: 'Brand', team: 'Team', client: 'Client',
                      landlord: 'Landlord', tenant: 'Tenant', individual: 'Individual', company: 'Company',
                    };
                    Object.entries(activeAnalysis.parties).forEach(([key, value]) => {
                      if (value && key !== 'other') {
                        keyInfoItems.push({ id: `party-${key}`, label: labels[key] || key, value: renderValue(value), isBlue: true });
                      }
                    });
                  }
                  if (activeAnalysis.contractType) keyInfoItems.push({ id: 'type', label: 'Contract Type', value: activeAnalysis.contractType });
                  if (activeAnalysis.effectiveDate) keyInfoItems.push({ id: 'date', label: 'Effective Date', value: renderValue(activeAnalysis.effectiveDate) });
                  if (activeAnalysis.termLength) keyInfoItems.push({ id: 'term', label: 'Term Length', value: renderValue(activeAnalysis.termLength) });
                  if (activeAnalysis.rightsAndOwnership?.territorialRights) keyInfoItems.push({ id: 'territory', label: 'Territory', value: renderValue(activeAnalysis.rightsAndOwnership.territorialRights) });
                  if (activeAnalysis.rightsAndOwnership?.exclusivity) keyInfoItems.push({ id: 'exclusivity', label: 'Exclusivity', value: renderValue(activeAnalysis.rightsAndOwnership.exclusivity) });

                  return (
                    <TooltipProvider>
                      {keyInfoItems.map((item) => (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>
                            <span
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full cursor-default"
                              style={item.isBlue ? {
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6'
                              } : {
                                backgroundColor: 'var(--muted)',
                                color: 'var(--foreground)'
                              }}
                            >
                              {item.value}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{item.label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  );
                })()}
              </div>
            </div>
          </TabsContent>

          {/* Key Terms Tab */}
          <TabsContent value="terms" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
            {/* Concerns Section */}
            {activeAnalysis.potentialConcerns && activeAnalysis.potentialConcerns.length > 0 && (() => {
              const colorScheme = { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', dot: 'bg-purple-400/60' };
              const headerColors = { bg: 'rgba(168, 85, 247, 0.08)', line: '#a855f7' };

              return (
                <div className={`${colorScheme.bg} overflow-hidden`}>
                  <div
                    className="px-6 py-2.5 flex items-center gap-2"
                    style={{ backgroundColor: headerColors.bg }}
                  >
                    <HugeiconsIcon icon={SpamIcon} size={16} className={colorScheme.text} />
                    <span className={`text-xs font-medium ${colorScheme.text} leading-none`}>{activeAnalysis.potentialConcerns.length} Concerns to Address</span>
                  </div>
                  <ul className="px-6 py-4 space-y-2">
                    {activeAnalysis.potentialConcerns.map((concern, i) => {
                      const matchingTermIndex = activeAnalysis.keyTerms?.findIndex(term => {
                        const concernLower = concern.toLowerCase();
                        const titleLower = term.title.toLowerCase();
                        const contentLower = term.content.toLowerCase();
                        const keywords = concernLower.split(/\s+/).filter(w => w.length > 4);
                        return keywords.some(kw => titleLower.includes(kw) || contentLower.includes(kw));
                      });
                      const snippet = activeAnalysis.concernSnippets?.[i];
                      const matchingTerm = matchingTermIndex !== undefined && matchingTermIndex >= 0
                        ? activeAnalysis.keyTerms?.[matchingTermIndex]
                        : null;

                      return (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                          onClick={() => {
                            const textToHighlight = snippet || matchingTerm?.originalText;
                            if (textToHighlight) {
                              handleClauseClick(textToHighlight);
                            }
                            if (matchingTermIndex !== undefined && matchingTermIndex >= 0) {
                              setExpandedTerm(matchingTermIndex);
                            }
                          }}
                        >
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

            {(!activeAnalysis.keyTerms || activeAnalysis.keyTerms.length === 0) && (
              <div className="border-y border-border p-8 text-center">
                <FileText className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No key terms extracted</p>
              </div>
            )}
            {activeAnalysis.keyTerms?.map((term, i) => {
              const isExpanded = expandedTerm === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "border-b border-dashed transition-all overflow-hidden duration-300",
                    i === 0 ? "border-t border-dashed" : "",
                    isExpanded ? "border-purple-500/50 border-t border-t-purple-500/50 border-b-purple-500/50" : "border-border"
                  )}
                >
                  <button
                    onClick={() => setExpandedTerm(isExpanded ? null : i)}
                    className="w-full px-6 py-3 flex items-center gap-3 text-left transition-colors"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-foreground font-medium">{term.title}</span>
                        <span className="text-[10px] text-muted-foreground/40">•</span>
                        <span className={cn("text-[10px] uppercase font-medium", getRiskColor(term.riskLevel).replace(/bg-\S+\s?/g, ''))}>
                          {term.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{term.content}</p>
                    </div>
                    <div className={cn(
                      "text-muted-foreground/60 transition-transform shrink-0",
                      isExpanded && "rotate-180"
                    )}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key="term-content"
                        initial={{ height: 0, opacity: 0, '--mask-stop': '0%', y: 20 } as any}
                        animate={{ height: 'auto', opacity: 1, '--mask-stop': '100%', y: 0 } as any}
                        exit={{ height: 0, opacity: 0, '--mask-stop': '0%', y: 20 } as any}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        style={{
                          maskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
                          WebkitMaskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
                          overflow: 'hidden',
                        }}
                        className="bg-card"
                      >
                        <div className="border-t border-dashed border-border">
                          <div className="px-6 py-3 space-y-4">
                            <div>
                              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">What This Says</p>
                              <p className="text-xs text-foreground">{term.content}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">In Plain English</p>
                              <p className="text-xs text-foreground">{term.explanation}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Risk Assessment</p>
                                <span className="text-[10px] text-muted-foreground/40">•</span>
                                <span className={cn("text-[10px] uppercase font-medium", getRiskColor(term.riskLevel).replace(/bg-\S+\s?/g, ''))}>
                                  {term.riskLevel.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {term.riskLevel === "high" && "This term significantly favors the other party and could limit your rights or earnings."}
                                {term.riskLevel === "medium" && "This term has some elements that could be improved but is within industry norms."}
                                {term.riskLevel === "low" && "This term is favorable or standard for agreements of this type."}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Questions to Ask Your Lawyer</p>
                              <ul className="text-xs text-muted-foreground space-y-2">
                                {(term.actionItems || getTermChecklist(term.title)).map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                    <span className="leading-none">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClauseClick(term.originalText);
                            }}
                            className="w-full px-6 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                            style={{ backgroundColor: 'var(--muted)' }}
                          >
                            <HugeiconsIcon icon={ViewIcon} size={14} /> View in contract
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </TabsContent>

          {/* Financial Terms Tab */}
          <TabsContent value="financial" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
            {(() => {
              const financialTerms: { id: string; title: string; value: string; explanation: string; industryContext: string; questionsToAsk: string[] }[] = [];

              // Detect contract type for context-aware explanations
              const contractType = (activeAnalysis.contractType || '').toLowerCase();
              const isSyncLicense = contractType.includes('sync') || contractType.includes('license');
              const isRecordingDeal = contractType.includes('recording') || contractType.includes('record deal');
              const isPublishing = contractType.includes('publishing') || contractType.includes('songwriter');
              const isProducer = contractType.includes('producer');
              const isDistribution = contractType.includes('distribution');

              if (activeAnalysis.financialTerms?.royaltyRate) {
                let explanation = 'The percentage of revenue you receive from sales or streams of your work.';
                let industryContext = 'Standard royalties range from 12-20% for new artists, while established artists may negotiate 20-25% or higher.';
                let questions = [
                  'Is this royalty calculated on gross or net revenue?',
                  'What deductions are taken before royalties are calculated?',
                  'Does the rate escalate based on sales milestones?',
                ];

                if (isPublishing) {
                  explanation = 'Your share of income from mechanical royalties, sync placements, and performance royalties collected by PROs.';
                  industryContext = 'Standard publishing splits are 50/50 to 75/25 (in artist favor). Co-publishing deals typically offer 75% of publisher share.';
                  questions = [
                    'Does this include all income streams (mechanical, sync, performance)?',
                    'What is the split on sync licensing income specifically?',
                    'Are there different rates for different uses?',
                  ];
                } else if (isProducer) {
                  explanation = 'Points or percentage of revenue paid to the producer, typically calculated after recoupment.';
                  industryContext = 'Producer royalties typically range from 2-4 points (percentage of retail/wholesale price). Top producers may get 4-5 points.';
                  questions = [
                    'Are producer points calculated on the same base as artist royalties?',
                    'Is the producer paid from record one or after recoupment?',
                    'What happens to producer royalties if the project is shelved?',
                  ];
                }

                financialTerms.push({
                  id: 'royalty',
                  title: 'Royalty Rate',
                  value: renderValue(activeAnalysis.financialTerms.royaltyRate),
                  explanation,
                  industryContext,
                  questionsToAsk: questions,
                });
              }

              if (activeAnalysis.financialTerms?.advanceAmount) {
                let title = 'Advance';
                let explanation = 'An upfront payment that is recoupable from your future royalties. You keep the advance, but won\'t receive royalty payments until it\'s paid back.';
                let industryContext = 'Advances vary widely based on the artist\'s track record, genre, and label. They can range from $10,000 for new artists to millions for established acts.';
                let questions = [
                  'What expenses are recoupable against this advance?',
                  'Is the advance cross-collateralized with other agreements?',
                  'What happens to unrecouped advances at the end of the term?',
                ];

                // Check if this is actually a license fee (sync deals)
                if (isSyncLicense) {
                  title = 'License Fee';
                  explanation = 'A flat fee paid for the right to use your music in visual media. Unlike an advance, this is NOT recoupable - it\'s yours to keep regardless of the project\'s success.';
                  industryContext = 'Sync license fees vary dramatically: $500-5,000 for indie films, $10,000-50,000 for TV shows, $50,000-500,000+ for major film/commercial placements. Fees depend on usage, media, territory, and term.';
                  questions = [
                    'Does this fee cover all the uses specified, or are there additional fees for expanded use?',
                    'Is there a "most favored nations" clause ensuring you\'re paid equally to other artists?',
                    'What happens if the production budget increases or the placement gets more prominent?',
                  ];
                } else if (isProducer) {
                  title = 'Producer Fee';
                  explanation = 'An upfront payment for production services. This may or may not be recoupable from royalties depending on the deal structure.';
                  industryContext = 'Producer fees range from $1,000-5,000 per track for emerging producers to $25,000-100,000+ per track for top-tier producers.';
                  questions = [
                    'Is the producer fee in addition to royalty points, or all-in?',
                    'Is any portion of the fee recoupable from producer royalties?',
                    'When is payment due (on delivery, on release, etc.)?',
                  ];
                }

                financialTerms.push({
                  id: 'advance',
                  title,
                  value: renderValue(activeAnalysis.financialTerms.advanceAmount),
                  explanation,
                  industryContext,
                  questionsToAsk: questions,
                });
              }

              if (activeAnalysis.termLength) {
                let explanation = 'The duration of the agreement. This determines how long the other party has rights to your work.';
                let industryContext = 'Major label deals typically span 5-7 albums or 7-10 years. Shorter terms give you more flexibility to renegotiate.';
                let questions = [
                  'Can the term be extended, and under what conditions?',
                  'What triggers the start of each option period?',
                  'What happens to unreleased material at the end of the term?',
                ];

                if (isSyncLicense) {
                  explanation = 'How long the licensee can use your music in their production. After this period, they must renew or stop using it.';
                  industryContext = 'Sync licenses often run 1-5 years for TV, or "in perpetuity" for film. Perpetual licenses should command higher fees.';
                  questions = [
                    'Does the term include automatic renewal clauses?',
                    'What is the renewal fee if they want to extend?',
                    'Is the term tied to the production\'s distribution window?',
                  ];
                } else if (isDistribution) {
                  explanation = 'How long the distributor controls your releases. Shorter terms let you renegotiate or switch distributors more easily.';
                  industryContext = 'Distribution deals range from 1-3 years for digital-only to 5-7 years for full service deals. Avoid perpetual distribution terms.';
                  questions = [
                    'What happens to your catalog when the term ends?',
                    'Is there a minimum release commitment during the term?',
                    'Can you terminate early if performance benchmarks aren\'t met?',
                  ];
                }

                financialTerms.push({
                  id: 'term',
                  title: 'Contract Term',
                  value: renderValue(activeAnalysis.termLength),
                  explanation,
                  industryContext,
                  questionsToAsk: questions,
                });
              }

              if (activeAnalysis.financialTerms?.paymentSchedule) {
                financialTerms.push({
                  id: 'payment',
                  title: 'Payment Schedule',
                  value: renderValue(activeAnalysis.financialTerms.paymentSchedule),
                  explanation: 'When and how often you receive payments. This affects your cash flow and ability to plan financially.',
                  industryContext: 'Industry standard is semi-annual (twice yearly) royalty statements, though some deals offer quarterly. Payment usually follows 45-90 days after the statement period.',
                  questionsToAsk: [
                    'How soon after the accounting period do payments arrive?',
                    'Is there a minimum threshold before payment is issued?',
                    'Can you request more frequent statements or audits?',
                  ],
                });
              }

              // Territory (especially important for sync/licensing)
              if (activeAnalysis.rightsAndOwnership?.territorialRights) {
                let explanation = 'The geographic regions where the agreement applies.';
                let industryContext = 'Worldwide rights are standard but may not be necessary. Retaining certain territories can be valuable for separate deals.';
                let questions = [
                  'Can you carve out specific territories for separate deals?',
                  'Are there different fee structures for different territories?',
                  'What happens if the work is used outside licensed territories?',
                ];

                if (isSyncLicense) {
                  explanation = 'Where the licensee can distribute productions containing your music. Broader territories should mean higher fees.';
                  industryContext = '"Universe" or "Worldwide" is common for major studio releases. Limited territories (e.g., "North America only") should have lower fees but allow separate licensing elsewhere.';
                  questions = [
                    'Is the fee appropriate for the territory scope?',
                    'Can you license to other productions in non-covered territories?',
                    'Are there step-ups if territory expands later?',
                  ];
                }

                financialTerms.push({
                  id: 'territory',
                  title: 'Territory',
                  value: renderValue(activeAnalysis.rightsAndOwnership.territorialRights),
                  explanation,
                  industryContext,
                  questionsToAsk: questions,
                });
              }

              // Rights Reversion
              if (activeAnalysis.rightsAndOwnership?.reversion) {
                financialTerms.push({
                  id: 'reversion',
                  title: 'Rights Reversion',
                  value: renderValue(activeAnalysis.rightsAndOwnership.reversion),
                  explanation: 'When and if the rights to your work return to you. This is crucial for long-term ownership of your creative output.',
                  industryContext: 'Life-of-copyright deals are common but unfavorable. Better deals include reversion after 15-35 years or based on recoupment.',
                  questionsToAsk: [
                    'Is there a sunset clause for rights reversion?',
                    'What triggers early reversion (e.g., full recoupment)?',
                    'Do rights revert automatically or require written notice?',
                  ],
                });
              }

              // Exclusivity (financial impact)
              if (activeAnalysis.rightsAndOwnership?.exclusivity) {
                financialTerms.push({
                  id: 'exclusivity',
                  title: 'Exclusivity',
                  value: renderValue(activeAnalysis.rightsAndOwnership.exclusivity),
                  explanation: 'Whether this deal prevents you from working with others or licensing your work elsewhere. Exclusivity has significant financial implications.',
                  industryContext: 'Exclusive deals should pay significantly more than non-exclusive. If granting exclusivity, ensure the compensation reflects the opportunity cost.',
                  questionsToAsk: [
                    'Is exclusivity necessary for this type of deal?',
                    'Can you negotiate carve-outs for certain uses or platforms?',
                    'What is the premium being paid for exclusivity vs. non-exclusive?',
                  ],
                });
              }

              return (
                <>
                  {/* Financial Summary Header */}
                  <div className="bg-emerald-500/5 overflow-hidden">
                    <div className="px-6 py-2.5 flex items-center gap-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                      <HugeiconsIcon icon={Money03Icon} size={16} className="text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400 leading-none">{financialTerms.length} Financial Terms</span>
                    </div>
                  </div>

                  {financialTerms.length === 0 ? (
                    <div className="border-y border-border p-8 text-center">
                      <FileText className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No financial terms extracted</p>
                    </div>
                  ) : (
                    financialTerms.map((term, i) => {
                      const isExpanded = selectedFinancial === term.id;
                      return (
                        <div
                          key={term.id}
                          className={cn(
                            "border-b border-dashed transition-all overflow-hidden duration-300",
                            i === 0 ? "border-t border-dashed" : "",
                            isExpanded ? "border-emerald-500/50 border-t border-t-emerald-500/50 border-b-emerald-500/50" : "border-border"
                          )}
                        >
                          <button
                            onClick={() => setSelectedFinancial(isExpanded ? null : term.id)}
                            className="w-full px-6 py-3 flex items-center gap-3 text-left transition-colors"
                            style={{ backgroundColor: 'var(--muted)' }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-foreground font-medium">{term.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{term.value}</p>
                            </div>
                            <div className={cn(
                              "text-muted-foreground/60 transition-transform shrink-0",
                              isExpanded && "rotate-180"
                            )}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                key="financial-content"
                                initial={{ height: 0, opacity: 0, '--mask-stop': '0%', y: 20 } as any}
                                animate={{ height: 'auto', opacity: 1, '--mask-stop': '100%', y: 0 } as any}
                                exit={{ height: 0, opacity: 0, '--mask-stop': '0%', y: 20 } as any}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                style={{
                                  maskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
                                  WebkitMaskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
                                  overflow: 'hidden',
                                }}
                                className="bg-card"
                              >
                                <div className="border-t border-dashed border-border">
                                  <div className="px-6 py-3 space-y-4">
                                    <div>
                                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Value</p>
                                      <p className="text-sm text-foreground font-medium">{term.value}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">What This Means</p>
                                      <p className="text-xs text-foreground">{term.explanation}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Industry Context</p>
                                      <p className="text-xs text-muted-foreground">{term.industryContext}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Questions to Ask</p>
                                      <ul className="text-xs text-muted-foreground space-y-2">
                                        {term.questionsToAsk.map((q, idx) => (
                                          <li key={idx} className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                            <span className="leading-none">{q}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClauseClick(term.value);
                                    }}
                                    className="w-full px-6 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                                    style={{ backgroundColor: 'var(--muted)' }}
                                  >
                                    <HugeiconsIcon icon={ViewIcon} size={14} /> View in contract
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* Advice Tab */}
          <TabsContent value="advice" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
            {(!activeAnalysis.recommendations || activeAnalysis.recommendations.length === 0) && (
              <div className="border-y border-border p-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No recommendations available</p>
              </div>
            )}
            {activeAnalysis.recommendations?.map((rec, i) => {
              const isStructured = typeof rec === 'object' && rec !== null;
              const advice = isStructured ? rec.advice : rec;
              const rationale = isStructured ? rec.rationale : "Following this recommendation helps protect your rights and ensures you maintain leverage in negotiations.";
              const howToImplement = isStructured ? rec.howToImplement : "Bring this up during your next negotiation session.";
              const priority = isStructured ? rec.priority : "medium";
              const sampleLanguage = isStructured ? rec.sampleLanguage : undefined;
              const riskIfIgnored = isStructured ? rec.riskIfIgnored : undefined;
              const negotiationQuestions = isStructured ? rec.negotiationQuestions : undefined;

              const priorityColor = priority === "high" ? "text-red-400" : priority === "medium" ? "text-amber-500" : "text-green-400";
              const priorityLabel = priority === "high" ? "Address immediately" : priority === "medium" ? "Address before signing" : "Nice to have";

              return (
                <div
                  key={i}
                  className={cn(
                    "border-b border-border transition-all overflow-hidden",
                    i === 0 && "border-t"
                  )}
                >
                  <div
                    className="px-6 py-3 text-left"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] uppercase font-semibold", priorityColor)}>
                        {priority} priority
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">•</span>
                      <span className="text-[10px] text-muted-foreground/60 uppercase font-semibold">{priorityLabel}</span>
                    </div>
                    <p className="text-xs text-foreground font-medium">{advice}</p>
                  </div>
                  <div className="border-t border-dashed border-border bg-card">
                    <div className="px-6 py-3 space-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Rationale</p>
                        <p className="text-xs text-foreground">{rationale}</p>
                      </div>
                      {riskIfIgnored && (
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Risk if Ignored</p>
                          <p className="text-xs text-foreground">{riskIfIgnored}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">How to Implement</p>
                        <p className="text-xs text-foreground">{howToImplement}</p>
                      </div>
                      {sampleLanguage && (
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Suggested Language</p>
                          <p className="text-xs text-foreground italic border-l-2 border-muted-foreground/20 pl-3">&ldquo;{sampleLanguage}&rdquo;</p>
                        </div>
                      )}
                      {negotiationQuestions && negotiationQuestions.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Questions to Ask</p>
                          <ul className="text-xs text-foreground space-y-1.5">
                            {negotiationQuestions.map((q, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0 mt-1.5" />
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Version History Tab */}
          {contractId && (
            <TabsContent value="versions" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
              <div className="bg-purple-500/5 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-2.5" style={{ backgroundColor: 'rgba(168, 85, 247, 0.08)' }}>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={FolderClockIcon} size={16} className="text-purple-400" />
                    <span className="text-xs font-medium text-purple-400 leading-none">Version History</span>
                  </div>
                  {onUploadVersion && (
                    <button
                      onClick={() => versionInputRef.current?.click()}
                      disabled={uploadingVersion}
                      className="h-7 px-3 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/60 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 bg-purple-500/10 hover:bg-purple-500/20"
                    >
                      {uploadingVersion ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      Upload New Version
                    </button>
                  )}
                </div>
              </div>

              {loadingVersions ? (
                <div className="flex items-center justify-center py-8 px-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 mx-6 mt-4 border border-dashed border-border rounded-lg">
                  <div className="flex justify-center mb-2">
                    <HugeiconsIcon icon={FolderClockIcon} size={24} className="text-muted-foreground/60" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">No version history yet</p>
                  <p className="text-[10px] text-muted-foreground/60">Upload a new version to start tracking changes</p>
                </div>
              ) : (
                <div className="relative px-6 pt-4">
                  {/* Timeline */}
                  {Array.isArray(versions) && versions.map((version, i) => {
                    const isLast = i === versions.length - 1;
                    return (
                      <div key={version.id} className="relative flex gap-4">
                        {/* Timeline line and dot */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-purple-500/30 z-10 shrink-0" />
                          {!isLast && (
                            <div className="w-px flex-1 border-l border-dashed border-purple-500/30 -mt-0.5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">Version {version.version_number}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(version.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Changes Summary */}
                          {version.changes_summary && (
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{version.changes_summary}</p>
                          )}

                          {/* Pills */}
                          <div className="space-y-2">
                            {version.analysis?.improvements && version.analysis.improvements.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {version.analysis.improvements.map((imp, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
                                    <ArrowUpRight className="w-3 h-3" /> {imp}
                                  </span>
                                ))}
                              </div>
                            )}
                            {version.analysis?.regressions && version.analysis.regressions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {version.analysis.regressions.map((reg, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                                    <ArrowDownRight className="w-3 h-3" /> {reg}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}

          {/* Dates Tab */}
          {contractId && (
            <TabsContent value="dates" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
              <div className="bg-orange-500/5 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-2.5" style={{ backgroundColor: 'rgba(249, 115, 22, 0.08)' }}>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CalendarFavorite01Icon} size={16} className="text-orange-400" />
                    <span className="text-xs font-medium text-orange-400 leading-none">Key Dates</span>
                  </div>
                  <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                    <DialogTrigger asChild>
                      <button className="h-7 px-3 text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 hover:border-orange-400/60 rounded-lg flex items-center gap-1.5 transition-colors bg-orange-500/10 hover:bg-orange-500/20">
                        <Plus className="w-3 h-3" />
                        Add Date
                      </button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Key Date</DialogTitle>
                      <DialogDescription>Track important contract deadlines and milestones</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <Select value={newDate.date_type} onValueChange={(v) => setNewDate({ ...newDate, date_type: v })}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select date type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="renewal">Renewal Date</SelectItem>
                          <SelectItem value="termination">Termination Notice</SelectItem>
                          <SelectItem value="payment">Payment Due</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={newDate.date}
                        onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newDate.description}
                        onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
                        className="text-xs"
                      />
                      <button
                        onClick={async () => {
                          if (onAddDate) {
                            await onAddDate(newDate);
                            setNewDate({ date_type: "", date: "", description: "" });
                            setShowAddDate(false);
                          }
                        }}
                        disabled={!newDate.date_type || !newDate.date}
                        className="w-full h-8 text-xs bg-foreground text-background hover:bg-foreground/90 rounded-md disabled:opacity-50"
                      >
                        Add Date
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {loadingDates ? (
                <div className="flex items-center justify-center py-8 px-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
                </div>
              ) : dates.length === 0 ? (
                <div className="text-center py-10 mx-6 mt-4 border border-dashed border-border rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">No key dates tracked</p>
                  <p className="text-[10px] text-muted-foreground/60">Add important deadlines and milestones</p>
                </div>
              ) : (
                <div className="space-y-2 px-6 pt-4">
                  {Array.isArray(dates) && dates.map((date) => (
                    <div key={date.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase font-medium text-muted-foreground">{date.date_type}</span>
                          <span className="text-xs font-medium">{new Date(date.date).toLocaleDateString()}</span>
                        </div>
                        {date.description && <p className="text-xs text-muted-foreground">{date.description}</p>}
                      </div>
                      {onDeleteDate && (
                        <button
                          onClick={() => onDeleteDate(date.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Discussion Tab */}
          {showDiscussionTab && contractId && (
            <TabsContent value="discussion" className="h-full -mx-6 -mt-6 -mb-24">
              <ContractComments
                contractId={contractId}
                isOwner={false}
                canComment={canComment}
                className="h-full"
              />
            </TabsContent>
          )}
        </main>
      </Tabs>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={(open) => {
        setShowShareModal(open);
        if (!open) {
          setShareEmail("");
          setShareMessage("");
          setSharePermission("view");
          setShareError(null);
          setShareSuccess(false);
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0" showCloseButton={false}>
          <div className="bg-muted/50 px-6 py-4 border-b border-dashed border-border">
            <DialogHeader className="gap-1">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <DialogTitle className="text-base font-medium">Share Contract</DialogTitle>
              </div>
              <DialogDescription>
                Invite someone to view, comment on, or sign this contract
              </DialogDescription>
            </DialogHeader>
          </div>

          {shareSuccess ? (
            <div className="py-8 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Invitation sent!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {shareEmail} will receive an email shortly
              </p>
            </div>
          ) : (
            <div className="space-y-4 px-6 pt-4 pb-6">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email address</label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="text-sm rounded-lg"
                  data-rounded="true"
                />
              </div>

              {/* Permission Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Permission</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full h-9 flex items-center justify-between gap-2 border border-border rounded-lg bg-background px-3 text-sm text-left focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {sharePermission === "view" && <AiVisionIcon size={14} className="text-muted-foreground" />}
                        {sharePermission === "comment" && <HugeiconsIcon icon={Comment01Icon} size={14} className="text-muted-foreground" />}
                        {sharePermission === "sign" && <HugeiconsIcon icon={SignatureIcon} size={14} className="text-muted-foreground" />}
                        {sharePermission === "view" && "Can view"}
                        {sharePermission === "comment" && "Can comment"}
                        {sharePermission === "sign" && "Request signature"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                    <DropdownMenuRadioGroup
                      value={sharePermission}
                      onValueChange={(v) => setSharePermission(v as "view" | "comment" | "sign")}
                    >
                      <DropdownMenuRadioItem value="view" className="flex items-center gap-2">
                        <AiVisionIcon size={14} className="text-muted-foreground" />
                        Can view
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="comment" className="flex items-center gap-2">
                        <HugeiconsIcon icon={Comment01Icon} size={14} className="text-muted-foreground" />
                        Can comment
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="sign" className="flex items-center gap-2">
                        <HugeiconsIcon icon={SignatureIcon} size={14} className="text-muted-foreground" />
                        Request signature
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Optional Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Message <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Add a personal note..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50"
                />
              </div>

              {/* Error Message */}
              {shareError && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {shareError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 h-9 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={!shareEmail || sharing}
                  className="flex-1 h-9 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <HugeiconsIcon icon={SentIcon} size={14} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
