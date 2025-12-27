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
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
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
} from "@hugeicons-pro/core-duotone-rounded";
import { Calendar03Icon, Invoice03Icon } from "@hugeicons-pro/core-solid-rounded";
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

export default function AnalyzePage() {
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
  
  // Save state
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("overview");

  // Expandable items
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);
  const [expandedConcern, setExpandedConcern] = useState<number | null>(null);
  const [expandedAdvice, setExpandedAdvice] = useState<number | null>(null);

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

  // Check for pending file from homepage upload
  useEffect(() => {
    const pendingFileData = sessionStorage.getItem("pendingFile");
    if (pendingFileData) {
      sessionStorage.removeItem("pendingFile");
      try {
        const { name, type, data } = JSON.parse(pendingFileData);
        // Convert base64 back to File
        const byteString = atob(data.split(",")[1]);
        const mimeType = type || "application/pdf";
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const file = new File([blob], name, { type: mimeType });
        handleFileSelect(file);
      } catch (err) {
        console.error("Error processing pending file:", err);
      }
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

  // Helper functions - Midday style (minimal color)
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 border-red-400/30";
      case "medium": return "text-yellow-400 border-yellow-400/30";
      case "low": return "text-green-400 border-green-400/30";
      default: return "text-muted-foreground border-border";
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

  // ============================================
  // IDLE STATE - Upload Screen (Midday style)
  // ============================================
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar showNewAnalysis={false} />

        {/* Upload Area */}
        <main className="flex-1 flex items-center justify-center p-8 pt-24">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-medium text-white mb-2">Upload Contract</h1>
              <p className="text-[#878787] text-sm">
                Drop a file to get instant AI analysis
              </p>
            </div>

            {/* Upload Zone - Matching homepage style */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-10 text-center transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="p-4 rounded-2xl w-fit mx-auto mb-4 bg-muted/50 group-hover:bg-primary/10 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Drop your contract here</p>
              <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
              <div className="flex justify-center gap-2">
                {["PDF", "Word", "TXT"].map((format) => (
                  <Badge key={format} variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/30">{format}</Badge>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // LOADING STATE - Fresh Design
  // ============================================
  if (status === "uploading" || status === "analyzing") {
    const currentStep = status === "uploading" ? 0 : 1;
    const steps = [
      { label: "Uploading", sublabel: "Securing your document" },
      { label: "Analyzing", sublabel: "AI reading contract terms" },
      { label: "Generating", sublabel: "Building your insights" },
    ];

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Music Loader - Prominent */}
          <div className="flex justify-center">
            <div className="w-40 h-40">
              <Lottie animationData={loadMusicAnimation} loop={true} />
            </div>
          </div>

          {/* Current Status - Large and Clear */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-medium text-white">
              {steps[currentStep].label}
              <span className="inline-flex ml-1">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
                <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
              </span>
            </h2>
            <p className="text-sm text-[#878787]">{steps[currentStep].sublabel}</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="h-1 bg-[#262626] overflow-hidden relative">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                }}
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    "w-5 h-5 flex items-center justify-center text-xs font-medium transition-all",
                    i < currentStep
                      ? "bg-primary text-primary-foreground"
                      : i === currentStep
                        ? "border border-primary text-primary"
                        : "border border-border text-[#525252]"
                  )}>
                    {i < currentStep ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-xs hidden sm:inline transition-colors",
                    i <= currentStep ? "text-[#878787]" : "text-[#525252]"
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* File Card */}
          <div className="border border-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 border border-border flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{fileName}</p>
              <p className="text-xs text-[#525252] mt-0.5">
                {status === "uploading" ? "Uploading..." : "Processing with AI..."}
              </p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          </div>

          {/* Fun Fact / Tip */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30">
              <HugeiconsIcon icon={AiIdeaIcon} size={14} className="text-primary" />
              <span className="text-xs text-primary">Our AI checks for 50+ common contract pitfalls</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE (Midday style)
  // ============================================
  if (status === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 border border-border rounded-lg">
          <div className="w-12 h-12 rounded-lg border border-red-400/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-base font-medium text-white">Analysis Failed</p>
            <p className="text-sm text-[#878787] mt-1">{error}</p>
          </div>
          <Button 
            onClick={handleReset}
            className="bg-white text-black hover:bg-white/90 rounded"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPLETE STATE - Matching contract/[id] page design
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
    <div className="flex flex-col h-screen bg-black overflow-hidden overflow-x-hidden pt-[57px]">
      <Navbar showBorder />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Side Panel */}
        <div
          className={cn(
            "h-full flex flex-col bg-black transition-all duration-300 ease-in-out overflow-hidden",
            showDocument ? "w-1/2 max-w-2xl border-r border-border" : "w-0"
          )}
        >
          {showDocument && (
            <>
              {/* Panel Header */}
              <div className="shrink-0 h-12 px-4 border-b border-border bg-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#878787]" />
                  <span className="text-sm text-white">{fileName}</span>
                  {highlightedClause && (
                    <span className="text-xs text-[#525252] px-2 py-0.5 border border-border">Highlighting</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {highlightedClause && (
                    <button
                      onClick={() => setHighlightedClause(null)}
                      className="text-xs text-[#878787] hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => { setShowDocument(false); setHighlightedClause(null); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                  >
                    <X className="w-4 h-4 text-[#878787]" />
                  </button>
                </div>
              </div>
              {/* PDF Content */}
              <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
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
          <main className={cn(
            "px-6 py-6 pb-24 transition-all duration-300",
            showDocument ? "w-full" : "max-w-4xl mx-auto"
          )}>
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-6">
              <Link href={savedContractId ? "/dashboard" : "/"} className="flex items-center justify-center w-7 h-7 border border-border hover:border-[#404040] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 text-[#878787]" />
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/" className="text-[#878787] hover:text-white transition-colors">
                  Home
                </Link>
                <span className="text-[#525252]">/</span>
                <span className="text-[#878787]">{analysis.contractType || "Contract"}</span>
                <span className="text-[#525252]">/</span>
                <span className="text-white font-medium">Analysis</span>
              </nav>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-medium text-white">{analysis.contractType || fileName}</h1>
                  <span className={cn(
                    "text-xs px-2 py-0.5 border uppercase",
                    analysis.overallRiskAssessment === "low" ? "border-green-500/30 text-green-400" :
                    analysis.overallRiskAssessment === "medium" ? "border-yellow-500/30 text-yellow-400" :
                    analysis.overallRiskAssessment === "high" ? "border-red-500/30 text-red-400" :
                    "border-border text-[#525252]"
                  )}>
                    {analysis.overallRiskAssessment === "low" ? "Low Risk" :
                     analysis.overallRiskAssessment === "medium" ? "Medium Risk" :
                     analysis.overallRiskAssessment === "high" ? "High Risk" : "Analyzed"}
                  </span>
                </div>
                {analysis.parties?.label && (
                  <span className="text-[#525252] text-sm">
                    {analysis.parties.label}
                    {analysis.parties?.artist && ` · ${analysis.parties.artist}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDocument(!showDocument)}
                  className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  {showDocument ? "Hide" : "Show"} PDF
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={downloading}
                  className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  Download Report
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
                      className="h-7 w-7 flex items-center justify-center border border-border hover:border-[#404040] transition-colors disabled:opacity-50"
                    >
                      {uploadingVersion ? (
                        <Loader2 className="w-3 h-3 text-[#525252] animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3 text-[#878787]" />
                      )}
                    </button>
                  </>
                )}

                {/* Save indicator */}
                {saving ? (
                  <div className="h-7 w-7 flex items-center justify-center border border-border">
                    <Loader2 className="w-3 h-3 text-[#525252] animate-spin" />
                  </div>
                ) : savedContractId ? (
                  <div className="h-7 w-7 flex items-center justify-center border border-border">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Tabbed Content with animated underlines */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex gap-6 border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative pb-3 text-sm transition-colors",
                      activeTab === tab.id ? "text-white" : "text-[#525252] hover:text-[#878787]"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="tab-underline-analyze"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Summary */}
                <div className="border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] text-[#525252] uppercase tracking-wider">Summary</span>
                    <div className="h-px flex-1 bg-[#262626]" />
                  </div>
                  <p className="text-sm text-white leading-relaxed">{analysis.summary}</p>

                  {/* Quick Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
                    {analysis.parties?.artist && (
                      <div className="text-xs text-[#525252]">
                        <span className="text-[#878787]">{analysis.parties.artist}</span>
                      </div>
                    )}
                    {analysis.parties?.label && (
                      <div className="text-xs text-[#525252]">
                        <span className="text-[#878787]">{analysis.parties.label}</span>
                      </div>
                    )}
                    {analysis.contractType && (
                      <div className="text-xs">
                        <span className="text-[#878787]">{analysis.contractType}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Terms - Card style */}
                {analysis.financialTerms && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] text-[#525252] uppercase tracking-wider">Financial Terms</span>
                      <div className="h-px flex-1 bg-[#262626]" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {analysis.financialTerms.royaltyRate && (
                        <div className="border border-border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3 h-3 text-[#525252]" />
                            <span className="text-[10px] text-white">Royalty</span>
                          </div>
                          <p className="text-[10px] text-[#525252] mb-3">Your share of net sums</p>
                          <p className="text-sm text-white">{analysis.financialTerms.royaltyRate}</p>
                        </div>
                      )}
                      {analysis.termLength && (
                        <div className="border border-border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <HugeiconsIcon icon={Calendar03Icon} size={12} className="text-[#525252]" />
                            <span className="text-[10px] text-white">Term</span>
                          </div>
                          <p className="text-[10px] text-[#525252] mb-3">Contract duration</p>
                          <p className="text-sm text-white">{analysis.termLength}</p>
                        </div>
                      )}
                      {analysis.financialTerms.advanceAmount && (
                        <div className="border border-border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-3 h-3 text-[#525252]" />
                            <span className="text-[10px] text-white">Advance</span>
                          </div>
                          <p className="text-[10px] text-[#525252] mb-3">Upfront payment</p>
                          <p className="text-sm text-white">{analysis.financialTerms.advanceAmount}</p>
                        </div>
                      )}
                      {analysis.financialTerms.paymentSchedule && (
                        <div className="border border-border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <HugeiconsIcon icon={Invoice03Icon} size={12} className="text-[#525252]" />
                            <span className="text-[10px] text-white">Payment</span>
                          </div>
                          <p className="text-[10px] text-[#525252] mb-3">Payment schedule</p>
                          <p className="text-sm text-white">{analysis.financialTerms.paymentSchedule}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Concerns Preview */}
                {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-2">
                    <div className="border border-border p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">{analysis.potentialConcerns.length} Concerns Found</span>
                      </div>
                      <p className="text-xs text-[#a3a3a3]">{analysis.potentialConcerns[0]}</p>
                    </div>
                    {analysis.missingClauses && analysis.missingClauses.length > 0 && (
                      <div className="border border-border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <HugeiconsIcon icon={HelpSquareIcon} size={12} className="text-yellow-400" />
                          <span className="text-xs text-yellow-400">{analysis.missingClauses.length} Missing Protections</span>
                        </div>
                        <p className="text-xs text-[#a3a3a3]">{analysis.missingClauses[0].clause}: {analysis.missingClauses[0].description}</p>
                      </div>
                    )}
                  </div>
                )}
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

                  return (
                  <div className={`border ${colorScheme.border} ${colorScheme.bg} p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={Alert02Icon} size={14} className={colorScheme.text} />
                      <span className={`text-xs font-medium ${colorScheme.text} leading-none`}>{analysis.potentialConcerns.length} Concerns to Address</span>
                    </div>
                    <ul className="space-y-2">
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
                            className="flex items-center gap-2 text-xs text-[#e5e5e5] cursor-pointer hover:text-white transition-colors group"
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
                            <Eye className="w-3 h-3 text-[#525252] group-hover:text-primary ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  );
                })()}

                {(!analysis.keyTerms || analysis.keyTerms.length === 0) && (
                  <div className="border border-border p-8 text-center">
                    <FileText className="w-6 h-6 text-[#525252] mx-auto mb-2" />
                    <p className="text-xs text-[#878787]">No key terms extracted</p>
                  </div>
                )}
                {analysis.keyTerms?.map((term, i) => {
                  const isExpanded = expandedTerm === i;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "border border-border transition-all",
                        isExpanded && "bg-[#0a0a0a] border-[#404040]"
                      )}
                    >
                      <button
                        onClick={() => setExpandedTerm(isExpanded ? null : i)}
                        className="w-full p-3 flex items-center gap-3 text-left hover:bg-[#1a1a1a] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-white font-medium">{term.title}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 border capitalize", getRiskColor(term.riskLevel))}>
                              {term.riskLevel}
                            </span>
                          </div>
                          <p className="text-xs text-[#e5e5e5] line-clamp-1">{term.content}</p>
                        </div>
                        <div className={cn(
                          "text-[#525252] transition-transform shrink-0",
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
                          <div className="p-3 space-y-4">
                            {/* Full Term Value */}
                            <div>
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">What This Says</p>
                              <p className="text-xs text-white">{term.content}</p>
                            </div>

                            {/* Plain English Explanation */}
                            <div>
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">In Plain English</p>
                              <p className="text-xs text-white">{term.explanation}</p>
                            </div>

                            {/* Risk Assessment */}
                            <div>
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Risk Assessment</p>
                              <div className="flex items-start gap-2">
                                <span className={cn("text-[10px] px-1.5 py-0.5 border capitalize shrink-0", getRiskColor(term.riskLevel))}>
                                  {term.riskLevel}
                                </span>
                                <p className="text-xs text-white">
                                  {term.riskLevel === "high" && "This term significantly favors the other party and could limit your rights or earnings."}
                                  {term.riskLevel === "medium" && "This term has some elements that could be improved but is within industry norms."}
                                  {term.riskLevel === "low" && "This term is favorable or standard for agreements of this type."}
                                </p>
                              </div>
                            </div>

                            {/* Questions to Ask Your Lawyer */}
                            <div>
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Questions to Ask Your Lawyer</p>
                              <ul className="text-xs text-[#e5e5e5] space-y-2">
                                {(term.actionItems || getTermChecklist(term.title)).map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <HugeiconsIcon icon={HelpSquareIcon} size={12} className="text-primary shrink-0" />
                                    <span className="leading-none">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t border-[#1a1a1a]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClauseClick(term.originalText);
                                }}
                                className="text-[10px] text-[#525252] hover:text-white flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-2.5 h-2.5" /> View in contract
                              </button>
                            </div>
                          </div>
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
                  <div className="border border-border p-8 text-center">
                    <CheckCircle2 className="w-6 h-6 text-[#525252] mx-auto mb-2" />
                    <p className="text-xs text-[#878787]">No recommendations available</p>
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
                        "border border-border transition-all",
                        isExpanded && "bg-[#0a0a0a] border-[#404040]"
                      )}
                    >
                      <button
                        onClick={() => setExpandedAdvice(isExpanded ? null : i)}
                        className="w-full p-3 flex items-start gap-2.5 text-left hover:bg-[#1a1a1a] transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#878787] shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#a3a3a3]">{advice}</p>
                          {isStructured && (
                            <span className={cn("text-[10px] mt-1 inline-block", priorityColor)}>
                              {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                            </span>
                          )}
                        </div>
                        <div className={cn(
                          "text-[#525252] transition-transform shrink-0",
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
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Rationale</p>
                              <p className="text-xs text-[#878787]">{rationale}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">How to Implement</p>
                              <p className="text-xs text-[#878787]">{howToImplement}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Priority</p>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-xs", priorityColor)}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                                <span className="text-[10px] text-[#525252]">{priorityLabel}</span>
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
                    <h4 className="text-xs font-medium text-white">Version History</h4>
                    <button
                      onClick={() => versionInputRef.current?.click()}
                      disabled={uploadingVersion}
                      className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                      <Loader2 className="w-4 h-4 animate-spin text-[#525252]" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-10 border border-border">
                      <History className="w-6 h-6 mx-auto text-[#525252] mb-2" />
                      <p className="text-xs text-[#878787] mb-1">No version history yet</p>
                      <p className="text-[10px] text-[#525252]">Upload a new version to start tracking changes</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-[#262626]" />

                      {versions.map((version, i) => (
                        <div key={version.id} className="relative pl-8 pb-4">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute left-1.5 w-4 h-4 flex items-center justify-center",
                            i === 0 ? "bg-white text-black" : "bg-[#1a1a1a] border border-border text-[#878787]"
                          )}>
                            <span className="text-[8px] font-bold">{version.version_number + 1}</span>
                          </div>

                          <div className={cn(
                            "border border-border p-3",
                            i === 0 && "border-[#404040]"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-[#878787] px-1.5 py-0.5 border border-border">
                                Version {version.version_number + 1}
                              </span>
                              <span className="text-[10px] text-[#525252]">
                                {new Date(version.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-xs text-[#a3a3a3] mb-2">{version.changes_summary}</p>

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
                    <h4 className="text-xs font-medium text-white">Key Dates & Deadlines</h4>
                    <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                      <DialogTrigger asChild>
                        <button className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-border hover:border-[#404040] flex items-center gap-1.5 transition-colors">
                          <Plus className="w-3 h-3" />
                          Add Date
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0a0a0a] border-border">
                        <DialogHeader>
                          <DialogTitle className="text-white text-sm">Add Key Date</DialogTitle>
                          <DialogDescription className="text-[#878787] text-xs">
                            Track important deadlines for this contract
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#878787]">Type</label>
                            <Select
                              value={newDate.date_type}
                              onValueChange={(v) => setNewDate({ ...newDate, date_type: v })}
                            >
                              <SelectTrigger className="bg-transparent border-border text-white text-xs h-8">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0a0a] border-border">
                                <SelectItem value="option_period">Option Period</SelectItem>
                                <SelectItem value="termination_window">Termination Window</SelectItem>
                                <SelectItem value="renewal">Renewal Date</SelectItem>
                                <SelectItem value="expiration">Expiration</SelectItem>
                                <SelectItem value="payment">Payment Due</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#878787]">Date</label>
                            <Input
                              type="date"
                              value={newDate.date}
                              onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                              className="bg-transparent border-border text-white text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#878787]">Description (optional)</label>
                            <Input
                              placeholder="e.g., Album option deadline"
                              value={newDate.description}
                              onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
                              className="bg-transparent border-border text-white placeholder:text-[#525252] text-xs h-8"
                            />
                          </div>
                        </div>
                        <button
                          onClick={addDate}
                          className="w-full h-8 bg-white text-black hover:bg-white/90 text-xs font-medium transition-colors"
                        >
                          Add Date
                        </button>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {loadingDates ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-[#525252]" />
                    </div>
                  ) : dates.length === 0 ? (
                    <div className="text-center py-10 border border-border">
                      <Calendar className="w-6 h-6 mx-auto text-[#525252] mb-2" />
                      <p className="text-xs text-[#878787] mb-1">No key dates tracked</p>
                      <p className="text-[10px] text-[#525252]">Add important deadlines to get reminders</p>
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
                              "p-2.5 border border-border flex items-center gap-2.5",
                              isPast && "border-red-400/30",
                              isUrgent && !isPast && "border-yellow-400/30"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#525252]">
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
                              <p className="text-xs text-white truncate">
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
                              className="shrink-0 w-6 h-6 flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5 text-[#525252] hover:text-red-400" />
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

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-black p-3 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 text-[10px] text-[#525252]">
            <Shield className="w-3 h-3" />
            <span>AI analysis · Always consult a lawyer</span>
          </div>
        </div>
      </div>

    </div>
  );
}
