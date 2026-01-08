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
  History,
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
} from "@hugeicons-pro/core-duotone-rounded";
import { ViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { MusicLoader } from "@/components/MusicLoader";
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
}: ContractAnalysisViewProps) {
  // UI state
  const [showDocument, setShowDocument] = useState(false);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedTerm, setExpandedTerm] = useState<number | null>(0);
  const [selectedFinancial, setSelectedFinancial] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);

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
    ...(contractId ? [
      { id: "versions", label: "Versions" },
      { id: "dates", label: "Dates" },
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
                  initialScale={isMobile ? 0.8 : 1.0}
                />
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
              <h1 className="text-sm font-medium text-foreground">{analysis.contractType || fileName}</h1>
              <span className="text-[10px] text-muted-foreground/40">•</span>
              <span className={cn(
                "text-[10px] uppercase font-medium",
                analysis.overallRiskAssessment === "low" ? "text-green-600" :
                analysis.overallRiskAssessment === "medium" ? "text-yellow-600" :
                analysis.overallRiskAssessment === "high" ? "text-red-600" :
                "text-muted-foreground"
              )}>
                {analysis.overallRiskAssessment === "low" ? "LOW RISK" :
                 analysis.overallRiskAssessment === "medium" ? "MEDIUM RISK" :
                 analysis.overallRiskAssessment === "high" ? "HIGH RISK" : "ANALYZED"}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
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
                  const sentences = analysis.summary.match(/[^.!?]+[.!?]+/g) || [analysis.summary];
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
            {analysis.financialTerms && (
              <div>
                <div className="flex items-center gap-2 mb-4 -mr-6">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Financial Analysis</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-0 -mt-1">
                  {analysis.financialTerms.royaltyRate && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('royalty');
                        handleClauseClick(analysis.financialTerms.royaltyRate);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : 'var(--foreground)' }}>Royalty</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(analysis.financialTerms.royaltyRate)}
                        </p>
                      </div>
                    </div>
                  )}
                  {analysis.termLength && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('term');
                        handleClauseClick(analysis.termLength);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'term' ? '#a855f7' : 'var(--foreground)' }}>Term</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'term' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'term' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(analysis.termLength)}
                        </p>
                      </div>
                    </div>
                  )}
                  {analysis.financialTerms.advanceAmount && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('advance');
                        handleClauseClick(analysis.financialTerms.advanceAmount);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : 'var(--foreground)' }}>Advance</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(analysis.financialTerms.advanceAmount)}
                        </p>
                      </div>
                    </div>
                  )}
                  {analysis.financialTerms.paymentSchedule && (
                    <div
                      className="py-3 cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                      onClick={() => {
                        setSelectedFinancial('payment');
                        handleClauseClick(analysis.financialTerms.paymentSchedule);
                      }}
                    >
                      <div className="flex items-center">
                        <p className="text-[10px] font-medium uppercase tracking-wider shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : 'var(--foreground)' }}>Payment</p>
                        <span className="mx-2 text-[10px] transition-colors duration-300" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : 'var(--muted-foreground)' }}>·</span>
                        <p className="text-[10px] tracking-wider uppercase shrink-0 transition-colors duration-300" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : 'var(--foreground)' }}>
                          {renderValue(analysis.financialTerms.paymentSchedule)}
                        </p>
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
                  {analysis.potentialConcerns && analysis.potentialConcerns.length > 4 && (
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      onClick={() => setActiveTab('terms')}
                    >
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
                  {analysis.missingClauses && analysis.missingClauses.length > 3 && (
                    <span
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      onClick={() => setActiveTab('terms')}
                    >
                      +{analysis.missingClauses.length - 3} more
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
                  if (analysis.parties) {
                    const labels: Record<string, string> = {
                      artist: 'Artist', label: 'Label', publisher: 'Publisher', manager: 'Manager',
                      distributor: 'Distributor', brand: 'Brand', team: 'Team', client: 'Client',
                      landlord: 'Landlord', tenant: 'Tenant', individual: 'Individual', company: 'Company',
                    };
                    Object.entries(analysis.parties).forEach(([key, value]) => {
                      if (value && key !== 'other') {
                        keyInfoItems.push({ id: `party-${key}`, label: labels[key] || key, value: renderValue(value), isBlue: true });
                      }
                    });
                  }
                  if (analysis.contractType) keyInfoItems.push({ id: 'type', label: 'Contract Type', value: analysis.contractType });
                  if (analysis.effectiveDate) keyInfoItems.push({ id: 'date', label: 'Effective Date', value: renderValue(analysis.effectiveDate) });
                  if (analysis.termLength) keyInfoItems.push({ id: 'term', label: 'Term Length', value: renderValue(analysis.termLength) });
                  if (analysis.rightsAndOwnership?.territorialRights) keyInfoItems.push({ id: 'territory', label: 'Territory', value: renderValue(analysis.rightsAndOwnership.territorialRights) });
                  if (analysis.rightsAndOwnership?.exclusivity) keyInfoItems.push({ id: 'exclusivity', label: 'Exclusivity', value: renderValue(analysis.rightsAndOwnership.exclusivity) });

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
            {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (() => {
              const colorScheme = { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', dot: 'bg-purple-400/60' };
              const headerColors = { bg: 'rgba(168, 85, 247, 0.08)', line: '#a855f7' };

              return (
                <div className={`${colorScheme.bg} overflow-hidden`}>
                  <div
                    className="px-6 py-2.5 flex items-center gap-2"
                    style={{ backgroundColor: headerColors.bg }}
                  >
                    <span className={`text-xs font-medium ${colorScheme.text} leading-none`}>{analysis.potentialConcerns.length} Concerns to Address</span>
                  </div>
                  <ul className="px-6 py-4 space-y-2">
                    {analysis.potentialConcerns.map((concern, i) => {
                      const matchingTermIndex = analysis.keyTerms?.findIndex(term => {
                        const concernLower = concern.toLowerCase();
                        const titleLower = term.title.toLowerCase();
                        const contentLower = term.content.toLowerCase();
                        const keywords = concernLower.split(/\s+/).filter(w => w.length > 4);
                        return keywords.some(kw => titleLower.includes(kw) || contentLower.includes(kw));
                      });
                      const snippet = analysis.concernSnippets?.[i];
                      const matchingTerm = matchingTermIndex !== undefined && matchingTermIndex >= 0
                        ? analysis.keyTerms?.[matchingTermIndex]
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

            {(!analysis.keyTerms || analysis.keyTerms.length === 0) && (
              <div className="border-y border-border p-8 text-center">
                <FileText className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No key terms extracted</p>
              </div>
            )}
            {analysis.keyTerms?.map((term, i) => {
              const isExpanded = expandedTerm === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "border-b border-dashed border-border transition-all overflow-hidden",
                    i === 0 && "border-t border-dashed",
                    isExpanded && "border-b-0"
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

          {/* Financial Calculator Tab */}
          <TabsContent value="financial">
            <FinancialCalculator
              contractData={{
                royaltyRate: analysis.financialTerms?.royaltyRate,
                advanceAmount: analysis.financialTerms?.advanceAmount,
                termLength: analysis.termLength,
              }}
            />
          </TabsContent>

          {/* Advice Tab */}
          <TabsContent value="advice" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
            {(!analysis.recommendations || analysis.recommendations.length === 0) && (
              <div className="border-y border-border p-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No recommendations available</p>
              </div>
            )}
            {analysis.recommendations?.map((rec, i) => {
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
            <TabsContent value="versions" className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-foreground">Version History</h4>
                {onUploadVersion && (
                  <button
                    onClick={() => versionInputRef.current?.click()}
                    disabled={uploadingVersion}
                    className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-purple-400/60 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
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

              {loadingVersions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-10 border border-border rounded-lg">
                  <History className="w-6 h-6 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">No version history yet</p>
                  <p className="text-[10px] text-muted-foreground/60">Upload a new version to start tracking changes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(versions) && versions.map((version, i) => (
                    <div key={version.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Version {version.version_number}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {version.changes_summary && (
                        <p className="text-xs text-muted-foreground mb-2">{version.changes_summary}</p>
                      )}
                      {version.analysis?.improvements && version.analysis.improvements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {version.analysis.improvements.map((imp, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <ArrowUpRight className="w-3 h-3" /> {imp}
                            </span>
                          ))}
                        </div>
                      )}
                      {version.analysis?.regressions && version.analysis.regressions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {version.analysis.regressions.map((reg, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[10px] text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">
                              <ArrowDownRight className="w-3 h-3" /> {reg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Dates Tab */}
          {contractId && (
            <TabsContent value="dates" className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-foreground">Key Dates</h4>
                <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                  <DialogTrigger asChild>
                    <button className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-purple-400/60 rounded-md flex items-center gap-1.5 transition-colors">
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

              {loadingDates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/60" />
                </div>
              ) : dates.length === 0 ? (
                <div className="text-center py-10 border border-border rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">No key dates tracked</p>
                  <p className="text-[10px] text-muted-foreground/60">Add important deadlines and milestones</p>
                </div>
              ) : (
                <div className="space-y-2">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Contract</DialogTitle>
            <DialogDescription>
              Invite someone to view, comment on, or sign this contract
            </DialogDescription>
          </DialogHeader>

          {shareSuccess ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm font-medium text-foreground">Invitation sent!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {shareEmail} will receive an email shortly
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Email address</label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Permission Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Permission</label>
                <Select value={sharePermission} onValueChange={(v: "view" | "comment" | "sign") => setSharePermission(v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Can view</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comment">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Can comment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sign">
                      <div className="flex items-center gap-2">
                        <Send className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Request signature</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Message <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Add a personal note..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50"
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
                  className="flex-1 h-9 text-sm text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={!shareEmail || sharing}
                  className="flex-1 h-9 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
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
