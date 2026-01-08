"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useAuth } from "@/components/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  X,
  Shield,
  Eye,
  Download,
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  History,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  FileOutput,
} from "lucide-react";
import { exportAnnotatedContract } from "@/lib/pdf-export";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LegalDocument01Icon,
  Coins01Icon,
  Alert02Icon,
  HelpSquareIcon,
  AiIdeaIcon,
  DollarCircleIcon,
  Idea01Icon,
  FileUploadIcon as FileUploadDuotoneIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import { Calendar03Icon, Invoice03Icon } from "@hugeicons-pro/core-solid-rounded";
import { FileUploadIcon, DocumentAttachmentIcon, PayByCheckIcon, ViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import Lottie from "lottie-react";
import loadMusicAnimation from "@/../public/loadmusic.json";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { MusicLoader } from "@/components/MusicLoader";
import { DownloadIcon as AnimatedDownloadIcon, DownloadHandle } from "@/components/DownloadIcon";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { DocumentScanner } from "@/components/DocumentScanner";
import { Camera } from "lucide-react";

// Dynamically import components
const PDFViewerWithSearch = dynamic(() => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <MusicLoader />
    </div>
  ),
});


type AnalysisStatus = "idle" | "uploading" | "analyzing" | "complete" | "success" | "error";

// Default missing clauses to check for
const DEFAULT_MISSING_CLAUSES = [
  { clause: "Audit Rights", severity: "critical" as const, description: "No provision allowing you to audit financial records" },
  { clause: "Reversion Clause", severity: "high" as const, description: "No automatic rights reversion if works are unexploited" },
  { clause: "Creative Control", severity: "medium" as const, description: "No approval rights over how your work is used" },
  { clause: "Termination for Cause", severity: "medium" as const, description: "Limited grounds specified for early termination" },
];

// Loading phrases
const loadingPhrases = [
  "Reading contract terms",
  "Analyzing key clauses",
  "Checking risk factors",
  "Identifying obligations",
  "Reviewing financial terms",
];

// Highlight entities (names, companies) in text with pills
function highlightEntities(text: string, entities: string[]): React.ReactNode {
  if (!entities || entities.length === 0) return text;

  // Create a pattern that matches any of the entities (case insensitive)
  const escapedEntities = entities.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedEntities.join('|')})`, 'gi');

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    if (!part) return null;
    const isEntity = entities.some(e => e.toLowerCase() === part.toLowerCase());

    if (isEntity) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mx-0.5"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
          }}
        >
          {part}
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
}

// Highlight key values (numbers, percentages, dollar amounts, time periods, dates) in text
function highlightKeyValues(text: string, isSelected?: boolean): React.ReactNode {
  // Pattern matches: percentages, dollar amounts, numbers with units, spelled-out numbers with units, ordinals, dates with months, standalone numbers
  const pattern = /(\d+(?:\.\d+)?%|\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand|k|m|b))?|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:-|\s)?(?:year|month|week|day|hour)s?|\d+(?:-|\s)?(?:year|month|week|day|hour)s?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+(?:st|nd|rd|th)?|\d+(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)|\d+(?:st|nd|rd|th)|\d+(?:,\d+)*(?:\.\d+)?)/gi;

  const parts = text.split(pattern);

  return parts.map((part, i) => {
    if (!part) return null;
    // Check if this part matches the pattern (odd indices from split with capture group)
    const isKeyValue = pattern.test(part);
    // Reset lastIndex since we're using global flag
    pattern.lastIndex = 0;

    if (isKeyValue) {
      // Check if the next part starts with a comma and remove it
      const nextPart = parts[i + 1];
      if (nextPart && nextPart.startsWith(',')) {
        parts[i + 1] = nextPart.slice(1);
      }

      return (
        <span
          key={i}
          className="font-medium uppercase"
          style={{
            color: isSelected ? '#a855f7' : 'var(--foreground)',
            transition: 'color 0.3s ease'
          }}
        >
          {part}
        </span>
      );
    }

    return (
      <span key={i} style={{ color: 'var(--muted-foreground)' }}>
        {part}
      </span>
    );
  });
}

export default function UploadContractPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Role selection state (local, not from URL)
  const [selectedRole, setSelectedRole] = useState<"recipient" | "sender" | null>(
    pathname.includes("/recipient") ? "recipient" : pathname.includes("/sender") ? "sender" : null
  );
  const [showUploadModal, setShowUploadModal] = useState(pathname.includes("/recipient") || pathname.includes("/sender"));

  // Handle role selection with animation
  const handleRoleSelect = (role: "recipient" | "sender") => {
    setSelectedRole(role);
    // Show upload modal after expansion animation
    setTimeout(() => {
      setShowUploadModal(true);
    }, 400);
  };

  // Core state
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string>("");

  // File state
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // UI state
  const [showDocument, setShowDocument] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Expandable items
  const [expandedTerm, setExpandedTerm] = useState<number | null>(0);
  const [expandedConcern, setExpandedConcern] = useState<number | null>(null);
  const [expandedAdvice, setExpandedAdvice] = useState<number | null>(null);

  // Selected financial item
  const [selectedFinancial, setSelectedFinancial] = useState<string | null>(null);

  // Selected key info pill
  const [selectedKeyInfo, setSelectedKeyInfo] = useState<string | null>(null);

  // Loading phrase animation
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Show PDF panel on desktop by default, hide on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowDocument(true);
    }
  }, []);

  useEffect(() => {
    if (status === "uploading" || status === "analyzing") {
      const interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Transition from complete to success after delay
  useEffect(() => {
    if (status === "complete") {
      const timer = setTimeout(() => {
        setStatus("success");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Set PDF ready when we have a successful analysis
  useEffect(() => {
    if (status === "success") {
      // Small delay to let the fade-in animation start, then show PDF
      const timer = setTimeout(() => {
        setPdfReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (status === "idle") {
      setPdfReady(false);
    }
  }, [status]);

  // Version tracking (for logged-in users)
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

  // Key dates (for logged-in users)
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const downloadIconRef = useRef<DownloadHandle>(null);

  // Document scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setStatus("uploading");
    setFileName(file.name);
    setFileType(file.type);
    setOriginalFile(file);
    setError("");

    // Create blob URL for PDF viewing
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    try {
      setStatus("analyzing");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", "music"); // Default to music, AI will auto-detect

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();

      // Only add missing clauses that are actually missing from the contract
      if (!data.analysis.missingClauses) {
        const contractText = (data.extractedText || "").toLowerCase();
        const actuallyMissing = DEFAULT_MISSING_CLAUSES.filter(item => {
          const clauseLower = item.clause.toLowerCase();
          // Check for common variations of the clause name
          if (clauseLower.includes("audit")) {
            return !contractText.includes("audit");
          }
          if (clauseLower.includes("reversion")) {
            return !contractText.includes("reversion") && !contractText.includes("revert");
          }
          if (clauseLower.includes("creative control")) {
            return !contractText.includes("creative control") && !contractText.includes("approval rights");
          }
          if (clauseLower.includes("termination")) {
            return !contractText.includes("termination") && !contractText.includes("terminate");
          }
          return true; // Default to showing if we can't determine
        });
        data.analysis.missingClauses = actuallyMissing;
      }

      setAnalysis(data.analysis);
      setStatus("complete");

      // Auto-save if user is logged in
      if (user && data.analysis) {
        saveContract(data.analysis, file);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStatus("error");
    }
  }, [user]);

  // Save contract
  const saveContract = useCallback(async (analysisData: ContractAnalysis, file: File) => {
    if (!user) return;

    setSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contractData", JSON.stringify({
        title: analysisData.contractType || file.name,
        extractedText: "",
        analysis: analysisData,
        contractType: analysisData.contractType,
        overallRisk: analysisData.overallRiskAssessment,
        industry: "music",
      }));

      const response = await fetch("/api/contracts/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const data = await response.json();
      setSavedContractId(data.contractId);
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Download report
  const handleDownloadReport = useCallback(async () => {
    if (!analysis) return;

    setDownloading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fileName || analysis.contractType || "Contract Analysis",
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
  }, [analysis, fileName]);

  // Handle export annotated PDF
  const handleExportPDF = useCallback(async () => {
    if (!fileUrl || !analysis) return;

    setExporting(true);
    try {
      // Get key terms for annotation
      const keyTerms = analysis.keyTerms?.map(term => ({
        title: term.title,
        content: term.content,
        riskLevel: term.riskLevel,
        originalText: term.originalText
      })) || [];

      // Export with annotations via server API
      await exportAnnotatedContract(
        fileUrl,
        keyTerms,
        `${fileName || 'contract'}-annotated.pdf`
      );
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setExporting(false);
    }
  }, [fileUrl, analysis, fileName]);

  // Handle clause click for highlighting
  const handleClauseClick = (originalText: string | undefined) => {
    if (originalText) {
      setHighlightedClause(originalText);
      setShowDocument(true);
    }
  };

  // Reset state
  const handleReset = () => {
    setStatus("idle");
    setAnalysis(null);
    setFileName("");
    setFileUrl("");
    setFileType("");
    setOriginalFile(null);
    setError("");
    setShowDocument(false);
    setHighlightedClause(null);
    setSavedContractId(null);
    setSaveError(null);
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Handle scanned document from DocumentScanner
  const handleScanComplete = useCallback((pdfBlob: Blob, fileName: string) => {
    setShowScanner(false);
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });
    handleFileSelect(file);
  }, [handleFileSelect]);

  // Helper functions
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-muted-foreground bg-muted";
    }
  };

  // Get contextual "What to Look For" based on term type
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

  // Fetch versions for saved contract
  const fetchVersions = useCallback(async () => {
    if (!savedContractId) return;
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/contracts/${savedContractId}/versions`);
      const data = await response.json();
      if (response.ok && data.versions) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  }, [savedContractId]);

  // Fetch dates for saved contract
  const fetchDates = useCallback(async () => {
    if (!savedContractId) return;
    setLoadingDates(true);
    try {
      const response = await fetch(`/api/contracts/${savedContractId}/dates`);
      const data = await response.json();
      if (response.ok && data.dates) {
        setDates(data.dates);
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
    } finally {
      setLoadingDates(false);
    }
  }, [savedContractId]);

  // Upload new version
  const uploadNewVersion = useCallback(async (file: File) => {
    if (!savedContractId) return;
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/contracts/${savedContractId}/versions`, {
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
  }, [savedContractId, fetchVersions]);

  // Add date
  const addDate = useCallback(async () => {
    if (!savedContractId || !newDate.date_type || !newDate.date) return;
    try {
      const response = await fetch(`/api/contracts/${savedContractId}/dates`, {
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
  }, [savedContractId, newDate, fetchDates]);

  // Delete date
  const deleteDate = useCallback(async (dateId: string) => {
    if (!savedContractId) return;
    try {
      await fetch(`/api/contracts/${savedContractId}/dates?dateId=${dateId}`, {
        method: "DELETE",
      });
      setDates(dates.filter((d) => d.id !== dateId));
    } catch (err) {
      console.error("Error deleting date:", err);
    }
  }, [savedContractId, dates]);

  // Fetch versions and dates when contract is saved
  useEffect(() => {
    if (savedContractId) {
      fetchVersions();
      fetchDates();
    }
  }, [savedContractId, fetchVersions, fetchDates]);

  // Animated dots component
  const AnimatedDots = () => (
    <span className="inline-flex">
      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>.</motion.span>
      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>.</motion.span>
    </span>
  );

  // ============================================
  // IDLE STATE - Role Selection or Upload
  // ============================================
  if (status === "idle") {
    return (
      <div className="h-full flex flex-col md:flex-row bg-card overflow-hidden">
        {/* Recipient Side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: selectedRole === "sender" ? 0 : 1,
            x: selectedRole === "sender" ? -100 : 0,
            flex: selectedRole === "recipient" ? 1 : selectedRole === "sender" ? 0 : 1
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          onClick={() => !selectedRole && handleRoleSelect("recipient")}
          onMouseEnter={() => !selectedRole && downloadIconRef.current?.startAnimation()}
          onMouseLeave={() => downloadIconRef.current?.stopAnimation()}
          className={cn(
            "flex flex-col items-center justify-center transition-all relative overflow-hidden min-h-[45vh] md:min-h-0",
            !selectedRole && "cursor-pointer hover:bg-muted/50 border-b md:border-b-0 md:border-r border-dashed border-foreground/10 group"
          )}
          style={{ flex: selectedRole === "recipient" ? 1 : selectedRole === "sender" ? 0 : 1 }}
        >

          {/* Role selection content - hide when selected */}
          <AnimatePresence>
            {!selectedRole && (
              <motion.div
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6 max-w-sm text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <AnimatedDownloadIcon ref={downloadIconRef} size={40} className="text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">I received a contract</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload a contract you&apos;ve received to analyze terms, identify risks, and get recommendations
                  </p>
                </div>
                <div className="flex items-center gap-2 text-purple-500 font-medium text-sm group-hover:gap-3 transition-all">
                  <span>Get started</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload modal - slides up from bottom */}
          <AnimatePresence mode="wait">
            {showUploadModal && selectedRole === "recipient" && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex flex-col p-8 z-10"
              >
                {/* Back button and role indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-3 left-4 flex items-center gap-2"
                >
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setTimeout(() => setSelectedRole(null), 400);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Change Role
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-500/10 text-purple-500 rounded-lg">
                    Recipient
                  </div>
                </motion.div>

                <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  className="w-full max-w-4xl p-32 text-center transition-all cursor-pointer rounded-xl"
                  style={{
                    border: `1.5px dashed ${isHovering ? '#8b5cf6' : 'var(--border)'}`,
                    backgroundColor: isHovering ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white">
                      <HugeiconsIcon
                        icon={FileUploadIcon}
                        size={28}
                        style={{
                          color: isHovering ? '#8b5cf6' : 'var(--muted-foreground)',
                          transition: 'color 0.2s ease'
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Drop your file here, or{" "}
                        <span className="text-purple-600 hover:text-purple-700 transition-colors">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, TXT up to 200MB
                      </p>
                    </div>
                    {/* Scan Document Button - Mobile Only */}
                    {isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowScanner(true);
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Scan Document
                      </Button>
                    )}
                  </div>
                </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sender Side */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: selectedRole === "recipient" ? 0 : 1,
            x: selectedRole === "recipient" ? 100 : 0,
            flex: selectedRole === "sender" ? 1 : selectedRole === "recipient" ? 0 : 1
          }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          className="flex flex-col items-center justify-center bg-muted/30 cursor-not-allowed relative overflow-hidden min-h-[45vh] md:min-h-0"
          style={{ flex: selectedRole === "sender" ? 1 : selectedRole === "recipient" ? 0 : 1 }}
        >
          {/* Coming Soon Overlay */}
          {!selectedRole && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-full">
                Coming Soon
              </span>
            </div>
          )}

          <div className="flex flex-col items-center gap-6 max-w-sm text-center opacity-50">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <Upload className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">I&apos;m sending a contract</h2>
              <p className="text-sm text-muted-foreground">
                Create and send contracts with built-in tracking, e-signatures, and analytics
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
              <span>Get started</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // LOADING STATE - Dashboard style with purple theme
  // ============================================
  if (status === "uploading" || status === "analyzing" || status === "complete") {
    const currentStep = status === "uploading" ? 0 : status === "analyzing" ? 1 : 2; // 2 means generating complete
    const steps = [
      { label: "Uploading", sublabel: "Securing your document" },
      { label: "Analyzing", sublabel: "Reading contract terms" },
      { label: "Generating", sublabel: "Building insights" },
    ];

    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0, y: 40 }}
        animate={{
          opacity: status === "complete" ? 0 : 1,
          y: status === "complete" ? -20 : 0
        }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="h-full flex flex-col items-center justify-center p-4 bg-background"
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Music Loader - Purple tinted */}
          <div className="flex justify-center">
            <div className="w-32 h-32" style={{ filter: 'hue-rotate(220deg) saturate(1.5)' }}>
              <Lottie animationData={loadMusicAnimation} loop={status !== "complete"} />
            </div>
          </div>

          {/* Animated Status Text - Rolling characters */}
          <div className="text-center h-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={phraseIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center text-lg font-medium text-muted-foreground"
              >
                {loadingPhrases[phraseIndex].split('').map((letter, index) => {
                  const centerIndex = Math.floor(loadingPhrases[phraseIndex].length / 2);
                  const distanceFromCenter = Math.abs(index - centerIndex);
                  const delay = distanceFromCenter * 0.03;
                  const rollDuration = 0.15 + distanceFromCenter * 0.08;
                  const numberOfRolls = Math.floor(1.5 / rollDuration);
                  const totalMovement = numberOfRolls * 1.2;

                  return (
                    <div
                      key={index}
                      className="relative inline-block overflow-hidden"
                      style={{ height: "1.2em" }}
                    >
                      <motion.span
                        className="flex flex-col"
                        initial={{ y: 0 }}
                        animate={{ y: `-${totalMovement}em` }}
                        transition={{
                          duration: 1.5,
                          ease: [0.15, 1, 0.1, 1],
                          delay: delay,
                        }}
                      >
                        {Array(numberOfRolls + 2)
                          .fill(null)
                          .map((_, copyIndex) => (
                            <span
                              key={copyIndex}
                              className="flex shrink-0 items-center justify-center"
                              style={{ height: "1.2em" }}
                            >
                              {letter === ' ' ? '\u00A0' : letter}
                            </span>
                          ))}
                      </motion.span>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step Pills */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all",
                    i < currentStep
                      ? "text-[#8b5cf6]"
                      : i === currentStep
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                  )}
                  style={i < currentStep ? { backgroundColor: 'rgba(139, 92, 246, 0.15)' } : i === currentStep ? { backgroundColor: 'var(--muted)' } : {}}
                >
                  {i < currentStep ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : i === currentStep ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : null}
                  <span className="hidden sm:inline font-semibold">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}>
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <p className="text-xs font-medium text-foreground">{fileName}</p>
            </div>
          </div>

          {/* Tip */}
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <p className="text-xs text-muted-foreground text-center">
                Checking for 50+ common contract pitfalls
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (status === "error") {
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <div className="text-center space-y-4 max-w-md p-6 border border-border rounded-lg">
          <div className="w-12 h-12 rounded-lg border border-red-400/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">Analysis Failed</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button
            onClick={handleReset}
            className="bg-foreground text-background hover:bg-foreground/90 rounded"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPLETE STATE - Analysis Results
  // ============================================
  if (!analysis) return null;

  // Build tabs array - include Versions/Dates only if logged in and saved
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "terms", label: "Key Terms" },
    { id: "financial", label: "Finances" },
    { id: "advice", label: "Advice" },
    ...(savedContractId ? [
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
      {/* Document Side Panel - Desktop: side panel, Mobile: full-screen overlay */}
      <div
        className={cn(
          "flex flex-col bg-background transition-all duration-300 ease-in-out",
          // Mobile: fixed full-screen overlay
          "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto",
          // Desktop: side panel behavior
          "md:h-full",
          showDocument
            ? "opacity-100 visible md:w-1/2 md:max-w-2xl md:border-r md:border-border"
            : "opacity-0 invisible md:w-0 md:opacity-100 md:visible"
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
                  className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center hover:bg-muted transition-colors rounded-md border border-border md:border-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            {/* PDF Content */}
            <div className="flex-1 overflow-auto bg-card">
              {pdfReady ? (
                <PDFViewerWithSearch
                  fileUrl={fileUrl}
                  searchText={highlightedClause || ""}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
            "px-6 h-12 flex items-center justify-between border-b border-border",
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
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowDocument(!showDocument)}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors rounded-md"
              >
                <Eye className="w-3 h-3" />
                {showDocument ? "Hide PDF" : "Show PDF"}
              </button>
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
              <button
                onClick={handleReset}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:bg-muted flex items-center gap-1.5 transition-colors rounded-md"
              >
                New
              </button>

              {/* Upload New Version - only if logged in and saved */}
              {savedContractId && (
                <>
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
                </>
              )}

              {/* Save indicator */}
              {saving ? (
                <div className="h-7 w-7 flex items-center justify-center border border-border rounded-md">
                  <Loader2 className="w-3 h-3 text-muted-foreground/60 animate-spin" />
                </div>
              ) : savedContractId ? (
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
                      layoutId="tab-underline-analyze-demo"
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
                    // Split summary into paragraphs every 2-3 sentences
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
                            {analysis.financialTerms.royaltyRate}
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
                            {analysis.termLength}
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
                            {analysis.financialTerms.advanceAmount}
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
                            {analysis.financialTerms.paymentSchedule}
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
                    {/* Concerns as pills - colored by related term's risk level */}
                    {analysis.potentialConcerns?.slice(0, 4).map((concern, i) => {
                      // Find matching key term to get its risk level
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

                    {/* Missing clauses as pills - colored by severity */}
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

                {/* Backdrop */}
                <AnimatePresence>
                  {selectedKeyInfo && (
                    <motion.div
                      onClick={() => setSelectedKeyInfo(null)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 flex-wrap relative">
                  {/* Build key info items */}
                  {(() => {
                    const keyInfoItems: { id: string; label: string; value: string; isBlue?: boolean }[] = [];

                    // Parties
                    if (analysis.parties) {
                      const labels: Record<string, string> = {
                        artist: 'Artist', label: 'Label', publisher: 'Publisher', manager: 'Manager',
                        distributor: 'Distributor', brand: 'Brand', team: 'Team', client: 'Client',
                        landlord: 'Landlord', tenant: 'Tenant', individual: 'Individual', company: 'Company',
                      };
                      Object.entries(analysis.parties).forEach(([key, value]) => {
                        if (value && key !== 'other') {
                          keyInfoItems.push({ id: `party-${key}`, label: labels[key] || key, value: value as string, isBlue: true });
                        }
                      });
                    }

                    // Other info
                    if (analysis.contractType) keyInfoItems.push({ id: 'type', label: 'Contract Type', value: analysis.contractType });
                    if (analysis.effectiveDate) keyInfoItems.push({ id: 'date', label: 'Effective Date', value: analysis.effectiveDate });
                    if (analysis.termLength) keyInfoItems.push({ id: 'term', label: 'Term Length', value: analysis.termLength });
                    if (analysis.rightsAndOwnership?.territorialRights) keyInfoItems.push({ id: 'territory', label: 'Territory', value: analysis.rightsAndOwnership.territorialRights });
                    if (analysis.rightsAndOwnership?.exclusivity) keyInfoItems.push({ id: 'exclusivity', label: 'Exclusivity', value: analysis.rightsAndOwnership.exclusivity });

                    return (
                      <TooltipProvider key="tooltip-provider">
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

            {/* Key Terms Tab - Expandable Cards */}
            <TabsContent value="terms" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
              {/* Concerns Section */}
              {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (() => {
                // Determine highest risk level among matched concerns
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

                const colorScheme = { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', dot: 'bg-purple-400/60' };

                const headerColors = { bg: 'rgba(168, 85, 247, 0.08)', line: '#a855f7' };

                return (
                <div className={`${colorScheme.bg} overflow-hidden`}>
                  {/* Header */}
                  <div
                    className="px-6 py-2.5 flex items-center gap-2"
                    style={{ backgroundColor: headerColors.bg }}
                  >
                    <span className={`text-xs font-medium ${colorScheme.text} leading-none`}>{analysis.potentialConcerns.length} Concerns to Address</span>
                  </div>
                  <ul className="px-6 py-4 space-y-2">
                    {analysis.potentialConcerns.map((concern, i) => {
                      // Find matching key term by checking if concern keywords appear in term title/content
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
                              setActiveTab('terms');
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
                              {/* Full Term Value */}
                              <div>
                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">What This Says</p>
                                <p className="text-xs text-foreground">{term.content}</p>
                              </div>

                              {/* Plain English Explanation */}
                              <div>
                                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">In Plain English</p>
                                <p className="text-xs text-foreground">{term.explanation}</p>
                              </div>

                              {/* Risk Assessment */}
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

                              {/* Questions to Ask Your Lawyer */}
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
                            {/* View in contract - full width at bottom */}
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

            {/* Advice Tab - Full Width Cards (Always Open) */}
            <TabsContent value="advice" className="space-y-0 -mx-6 -mt-6 min-w-[calc(100%+48px)] block">
              {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                <div className="border-y border-border p-8 text-center">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No recommendations available</p>
                </div>
              )}
              {analysis.recommendations?.map((rec, i) => {
                // Handle both legacy string format and new object format
                const isStructured = typeof rec === 'object' && rec !== null;
                const advice = isStructured ? rec.advice : rec;
                const rationale = isStructured ? rec.rationale : "Following this recommendation helps protect your rights and ensures you maintain leverage in negotiations. Industry standards support this approach.";
                const howToImplement = isStructured ? rec.howToImplement : "Bring this up during your next negotiation session. Frame it as a standard industry practice.";
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
                    {/* Header */}
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
                    {/* Always visible content */}
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

            {/* Version History Tab - Only for logged in users with saved contract */}
            {savedContractId && (
              <TabsContent value="versions" className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-foreground">Version History</h4>
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
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

                    {versions.map((version, i) => (
                      <div key={version.id} className="relative pl-8 pb-4">
                        {/* Timeline dot */}
                        <div className={cn(
                          "absolute left-1.5 w-4 h-4 flex items-center justify-center",
                          i === 0 ? "bg-foreground text-background" : "bg-muted border border-border text-muted-foreground"
                        )}>
                          <span className="text-[8px] font-bold">{version.version_number + 1}</span>
                        </div>

                        <div className="p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground px-2 py-0.5 border border-border rounded-full">
                              Version {version.version_number + 1}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {new Date(version.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">{version.changes_summary}</p>

                          {version.analysis?.improvements && version.analysis.improvements.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {version.analysis.improvements.slice(0, 2).map((imp, j) => (
                                <div key={j} className="flex items-center gap-1.5 text-[10px] text-green-400">
                                  <ArrowUpRight className="w-2.5 h-2.5" />
                                  <span>{imp}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {version.analysis?.regressions && version.analysis.regressions.length > 0 && (
                            <div className="space-y-1">
                              {version.analysis.regressions.slice(0, 2).map((reg, j) => (
                                <div key={j} className="flex items-center gap-1.5 text-[10px] text-red-400">
                                  <ArrowDownRight className="w-2.5 h-2.5" />
                                  <span>{reg}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Key Dates Tab - Only for logged in users with saved contract */}
            {savedContractId && (
              <TabsContent value="dates" className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-foreground">Key Dates & Deadlines</h4>
                  <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                    <DialogTrigger asChild>
                      <button className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors">
                        <Plus className="w-3 h-3" />
                        Add Date
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground text-sm">Add Key Date</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-xs">
                          Track important deadlines for this contract
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Type</label>
                          <Select
                            value={newDate.date_type}
                            onValueChange={(v) => setNewDate({ ...newDate, date_type: v })}
                          >
                            <SelectTrigger className="bg-transparent border-border text-foreground text-xs h-8">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
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
                          <Input
                            type="date"
                            value={newDate.date}
                            onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                            className="bg-transparent border-border text-foreground text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
                          <Input
                            placeholder="e.g., Album option deadline"
                            value={newDate.description}
                            onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
                            className="bg-transparent border-border text-foreground placeholder:text-muted-foreground/60 text-xs h-8"
                          />
                        </div>
                      </div>
                      <button
                        onClick={addDate}
                        className="w-full h-8 bg-foreground text-background hover:bg-foreground/90 text-xs font-medium transition-colors"
                      >
                        Add Date
                      </button>
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

                      const typeLabels: Record<string, string> = {
                        option_period: "Option Period",
                        termination_window: "Termination",
                        renewal: "Renewal",
                        expiration: "Expiration",
                        payment: "Payment",
                      };

                      return (
                        <div
                          key={date.id}
                          className={cn(
                            "p-2.5 border border-border flex items-center gap-2.5 rounded-lg",
                            isPast && "border-red-400/30",
                            isUrgent && !isPast && "border-yellow-400/30"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground/60">
                                {typeLabels[date.date_type] || date.date_type}
                              </span>
                              {isPast && (
                                <span className="text-[9px] text-red-400 px-1 py-0.5 border border-red-400/30">Overdue</span>
                              )}
                              {isUrgent && !isPast && (
                                <span className="text-[9px] text-yellow-400 px-1 py-0.5 border border-yellow-400/30">
                                  {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-foreground truncate">
                              {date.description || dateObj.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteDate(date.id)}
                            className="shrink-0 w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-muted-foreground/60 hover:text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
        </main>
      </Tabs>

      {/* Document Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Scan Document</DialogTitle>
            <DialogDescription>
              Position your contract pages in the camera view to scan them as a PDF.
            </DialogDescription>
          </DialogHeader>
          <DocumentScanner
            onScanComplete={handleScanComplete}
            onClose={() => setShowScanner(false)}
            className="min-h-[300px]"
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
