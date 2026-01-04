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
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { MusicLoader } from "@/components/MusicLoader";

// Dynamically import components
const PDFViewerWithSearch = dynamic(() => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <MusicLoader />
    </div>
  ),
});


type AnalysisStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

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

export default function AnalyzeDemoPage() {
  const { user } = useAuth();

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
  const [showDocument, setShowDocument] = useState(true);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  useEffect(() => {
    if (status === "uploading" || status === "analyzing") {
      const interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
      return () => clearInterval(interval);
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

      // Add missing clauses if not present
      if (!data.analysis.missingClauses) {
        data.analysis.missingClauses = DEFAULT_MISSING_CLAUSES;
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
  // IDLE STATE - Upload Modal (Centered card design)
  // ============================================
  if (status === "idle") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="idle-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full flex items-center justify-center p-8 overflow-hidden"
          style={{
            backgroundColor: '#fcfcfc',
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
          >
          {/* Header */}
          <div className="px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={FileUploadDuotoneIcon} size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Upload Contract</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Analyze your music contract with AI</p>
          </div>

          {/* Upload Zone */}
          <div className="p-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="relative rounded-xl p-10 text-center transition-all cursor-pointer"
              style={{
                border: `2px dashed ${isHovering ? '#8b5cf6' : '#d1d5db'}`,
                backgroundColor: isHovering ? '#faf5ff' : '#fafafa',
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
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: isHovering ? '#ede9fe' : '#f3f4f6',
                  }}
                >
                  <HugeiconsIcon
                    icon={FileUploadIcon}
                    size={28}
                    style={{
                      color: isHovering ? '#8b5cf6' : '#9ca3af',
                      transition: 'color 0.2s ease'
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Drop your file here, or{" "}
                    <span
                      className="text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, TXT up to 200MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#fafafa] border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {["PDF", "DOC", "DOCX", "TXT"].map((format) => (
                  <span
                    key={format}
                    className="px-2 py-1 text-[10px] font-medium rounded-md bg-white border border-border text-muted-foreground"
                  >
                    {format}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Max 200 MB
              </span>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ============================================
  // LOADING STATE - Dashboard style with purple theme
  // ============================================
  if (status === "uploading" || status === "analyzing") {
    const currentStep = status === "uploading" ? 0 : 1;
    const steps = [
      { label: "Uploading", sublabel: "Securing your document" },
      { label: "Analyzing", sublabel: "Reading contract terms" },
      { label: "Generating", sublabel: "Building insights" },
    ];

    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="h-full flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: '#fcfcfc' }}
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Music Loader - Purple tinted */}
          <div className="flex justify-center">
            <div className="w-32 h-32" style={{ filter: 'hue-rotate(220deg) saturate(1.5)' }}>
              <Lottie animationData={loadMusicAnimation} loop={true} />
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
                className="flex justify-center text-lg font-medium"
                style={{ color: '#565c65' }}
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

          {/* Progress Bar - animated purple */}
          <div className="space-y-4">
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ backgroundColor: '#e5e6e7' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#8b5cf6' }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Step Pills */}
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
                  style={i < currentStep ? { backgroundColor: '#ede9fe' } : i === currentStep ? { backgroundColor: '#f3f4f6' } : {}}
                >
                  {i < currentStep ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : i === currentStep ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="w-3 h-3 flex items-center justify-center text-[10px]">{i + 1}</span>
                  )}
                  <span className="hidden sm:inline font-semibold">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{fileName}</p>
            </div>
          </div>

          {/* Tip */}
          <div className="flex justify-center">
            <p className="text-xs text-muted-foreground/60 text-center">
              Checking for 50+ common contract pitfalls
            </p>
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
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#fcfcfc' }}>
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
                <span className="text-sm text-foreground">{fileName}</span>
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
              <PDFViewerWithSearch
                fileUrl={fileUrl}
                searchText={highlightedClause || ""}
                className="h-full"
              />
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
              <h1 className="text-sm font-medium text-foreground">{analysis.contractType || fileName}</h1>
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
                      layoutId="tab-underline-analyze-demo"
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
                    // Split summary into paragraphs every 2-3 sentences
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
                        style={{
                          borderColor: selectedFinancial === 'royalty' ? '#a855f7' : undefined,
                          transition: 'border-color 0.3s ease'
                        }}
                        onClick={() => {
                          setSelectedFinancial('royalty');
                          handleClauseClick(analysis.financialTerms.royaltyRate);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm mb-0.5">
                              {highlightKeyValues(analysis.financialTerms.royaltyRate, selectedFinancial === 'royalty')}
                            </p>
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'royalty' ? '#a855f7' : '#a0a0a0', transition: 'color 0.3s ease' }}>Royalty</p>
                        </div>
                      </div>
                    )}
                    {analysis.termLength && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{
                          borderColor: selectedFinancial === 'term' ? '#a855f7' : undefined,
                          transition: 'border-color 0.3s ease'
                        }}
                        onClick={() => {
                          setSelectedFinancial('term');
                          handleClauseClick(analysis.termLength);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm mb-0.5">
                              {highlightKeyValues(analysis.termLength, selectedFinancial === 'term')}
                            </p>
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'term' ? '#a855f7' : '#a0a0a0', transition: 'color 0.3s ease' }}>Term</p>
                        </div>
                      </div>
                    )}
                    {analysis.financialTerms.advanceAmount && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{
                          borderColor: selectedFinancial === 'advance' ? '#a855f7' : undefined,
                          transition: 'border-color 0.3s ease'
                        }}
                        onClick={() => {
                          setSelectedFinancial('advance');
                          handleClauseClick(analysis.financialTerms.advanceAmount);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm mb-0.5">
                              {highlightKeyValues(analysis.financialTerms.advanceAmount, selectedFinancial === 'advance')}
                            </p>
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'advance' ? '#a855f7' : '#a0a0a0', transition: 'color 0.3s ease' }}>Advance</p>
                        </div>
                      </div>
                    )}
                    {analysis.financialTerms.paymentSchedule && (
                      <div
                        className="py-3 border-b border-dashed cursor-pointer hover:bg-muted/30 transition-colors -mx-1 px-1"
                        style={{
                          borderColor: selectedFinancial === 'payment' ? '#a855f7' : 'transparent',
                          transition: 'border-color 0.3s ease'
                        }}
                        onClick={() => {
                          setSelectedFinancial('payment');
                          handleClauseClick(analysis.financialTerms.paymentSchedule);
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm mb-0.5">
                              {highlightKeyValues(analysis.financialTerms.paymentSchedule, selectedFinancial === 'payment')}
                            </p>
                          </div>
                          <p className="text-[10px] font-medium uppercase tracking-wider shrink-0" style={{ color: selectedFinancial === 'payment' ? '#a855f7' : '#a0a0a0', transition: 'color 0.3s ease' }}>Payment</p>
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
                        style={{ backgroundColor: '#f0f0f0', color: '#565c65' }}
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
                        style={{ backgroundColor: '#f0f0f0', color: '#565c65' }}
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

                    return keyInfoItems.map((item) => {
                      const isSelected = selectedKeyInfo === item.id;

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          style={{
                            transformOrigin: "50% 50% 0px",
                            borderRadius: isSelected ? "16px" : "9999px",
                            zIndex: isSelected ? 50 : 1,
                          }}
                          className="relative overflow-hidden"
                        >
                          {/* Collapsed pill */}
                          <motion.button
                            onClick={() => setSelectedKeyInfo(isSelected ? null : item.id)}
                            style={{
                              pointerEvents: !isSelected ? "all" : "none",
                              display: isSelected ? "none" : "flex",
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 35 }}
                            layoutId={`pill-${item.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium cursor-pointer"
                            {...(item.isBlue ? {
                              style: { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', pointerEvents: !isSelected ? "all" : "none", display: isSelected ? "none" : "flex" }
                            } : {
                              style: { backgroundColor: '#f0f0f0', color: '#565c65', pointerEvents: !isSelected ? "all" : "none", display: isSelected ? "none" : "flex" }
                            })}
                          >
                            {item.value}
                          </motion.button>

                          {/* Expanded card */}
                          <AnimatePresence mode="popLayout">
                            {isSelected && (
                              <motion.div
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 550,
                                  damping: 45,
                                  mass: 0.7,
                                }}
                                className="bg-white border border-border rounded-2xl p-4 shadow-lg min-w-[200px]"
                                style={{ transformOrigin: "50% 50% 0px" }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                                  <button
                                    onClick={() => setSelectedKeyInfo(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <motion.p
                                  layoutId={`pill-${item.id}`}
                                  className="text-sm font-medium"
                                  style={{ color: item.isBlue ? '#3b82f6' : '#202020' }}
                                >
                                  {item.value}
                                </motion.p>
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

            {/* Key Terms Tab - Expandable Cards */}
            <TabsContent value="terms" className="space-y-4">
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

                const colorScheme = {
                  high: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', dot: 'bg-red-400/60' },
                  medium: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', dot: 'bg-amber-400/60' },
                  low: { border: 'border-green-500/30', bg: 'bg-green-500/5', text: 'text-green-400', dot: 'bg-green-400/60' },
                }[highestRisk];

                const headerColors = {
                  high: { bg: 'rgba(239, 68, 68, 0.08)', line: '#ef4444' },
                  medium: { bg: 'rgba(245, 158, 11, 0.08)', line: '#f59e0b' },
                  low: { bg: 'rgba(34, 197, 94, 0.08)', line: '#22c55e' },
                }[highestRisk];

                return (
                <div className={`border ${colorScheme.border} ${colorScheme.bg} rounded-xl overflow-hidden`}>
                  {/* Header with colored line */}
                  <div
                    className="px-4 py-2.5 flex items-center gap-2 border-b"
                    style={{ backgroundColor: headerColors.bg, borderColor: headerColors.line }}
                  >
                    <HugeiconsIcon icon={Alert02Icon} size={14} className={colorScheme.text} />
                    <span className={`text-xs font-medium ${colorScheme.text} leading-none`}>{analysis.potentialConcerns.length} Concerns to Address</span>
                  </div>
                  <ul className="p-4 space-y-2">
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
                <div className="border border-border p-8 text-center rounded-lg">
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
                      "border border-border transition-all rounded-lg overflow-hidden",
                      isExpanded && "border-[#d1d5db]"
                    )}
                  >
                    <button
                      onClick={() => setExpandedTerm(isExpanded ? null : i)}
                      className="w-full p-3 flex items-center gap-3 text-left transition-colors rounded-t-lg"
                      style={{ backgroundColor: '#f5f5f4' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-foreground font-medium">{term.title}</span>
                          <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full capitalize", getRiskColor(term.riskLevel))}>
                            {term.riskLevel}
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
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden bg-white"
                    >
                      <div className="border-t border-border">
                        <div className="p-3 space-y-4">
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
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Risk Assessment</p>
                            <div className="flex items-start gap-2">
                              <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full capitalize shrink-0", getRiskColor(term.riskLevel))}>
                                {term.riskLevel}
                              </span>
                              <p className="text-xs text-foreground">
                                {term.riskLevel === "high" && "This term significantly favors the other party and could limit your rights or earnings."}
                                {term.riskLevel === "medium" && "This term has some elements that could be improved but is within industry norms."}
                                {term.riskLevel === "low" && "This term is favorable or standard for agreements of this type."}
                              </p>
                            </div>
                          </div>

                          {/* Questions to Ask Your Lawyer */}
                          <div>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Questions to Ask Your Lawyer</p>
                            <ul className="text-xs text-muted-foreground space-y-2">
                              {(term.actionItems || getTermChecklist(term.title)).map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <HugeiconsIcon icon={HelpSquareIcon} size={12} className="text-primary shrink-0" />
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
                          className="w-full px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                          style={{ backgroundColor: '#f5f5f4' }}
                        >
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
              <FinancialCalculator
                contractData={{
                  royaltyRate: analysis.financialTerms?.royaltyRate,
                  advanceAmount: analysis.financialTerms?.advanceAmount,
                  termLength: analysis.termLength,
                }}
              />
            </TabsContent>

            {/* Advice Tab - Expandable Cards */}
            <TabsContent value="advice" className="space-y-2">
              {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                <div className="border border-border p-8 text-center rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No recommendations available</p>
                </div>
              )}
              {analysis.recommendations?.map((rec, i) => {
                const isExpanded = expandedAdvice === i;
                // Handle both legacy string format and new object format
                const isStructured = typeof rec === 'object' && rec !== null;
                const advice = isStructured ? rec.advice : rec;
                const rationale = isStructured ? rec.rationale : "Following this recommendation helps protect your rights and ensures you maintain leverage in negotiations. Industry standards support this approach.";
                const howToImplement = isStructured ? rec.howToImplement : "Bring this up during your next negotiation session. Frame it as a standard industry practice.";
                const priority = isStructured ? rec.priority : "medium";

                const priorityColor = priority === "high" ? "text-red-400" : priority === "medium" ? "text-amber-500" : "text-green-400";
                const priorityLabel = priority === "high" ? "Address immediately" : priority === "medium" ? "Address before signing" : "Nice to have";

                return (
                  <div
                    key={i}
                    className={cn(
                      "border border-border transition-all rounded-lg",
                      isExpanded && "bg-card border-[#404040]"
                    )}
                  >
                    <button
                      onClick={() => setExpandedAdvice(isExpanded ? null : i)}
                      className="w-full p-3 flex items-start gap-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{advice}</p>
                        {isStructured && (
                          <span className={cn("text-[10px] mt-1 inline-block", priorityColor)}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                          </span>
                        )}
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
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border">
                        <div className="p-3 space-y-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Rationale</p>
                            <p className="text-xs text-muted-foreground">{rationale}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">How to Implement</p>
                            <p className="text-xs text-muted-foreground">{howToImplement}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Priority</p>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs", priorityColor)}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                              <span className="text-[10px] text-muted-foreground/60">{priorityLabel}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors disabled:opacity-50"
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

                        <div className={cn(
                          "border border-border p-3 rounded-lg",
                          i === 0 && "border-[#404040]"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 border border-border">
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
          </Tabs>
        </main>
      </div>
    </div>
  );
}
