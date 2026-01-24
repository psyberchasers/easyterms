"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Contract } from "@/types/database";
import { ContractAnalysis } from "@/types/contract";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader2,
  AlertTriangle,
  Star,
  Trash2,
  ArrowLeft,
  Upload,
  History,
  X,
  Download,
  Calendar,
  Plus,
  Eye,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  Share2,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { HelpSquareIcon, Alert02Icon } from "@hugeicons-pro/core-duotone-rounded";
import { Calendar03Icon, Delete03Icon } from "@hugeicons-pro/core-solid-rounded";
import { MusicLoader } from "@/components/MusicLoader";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { NotificationModal } from "@/components/NotificationModal";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { ContractComments } from "@/components/ContractComments";
import NewsCard from "@/components/NewsCard";

interface ContractVersion {
  id: string;
  version_number: number;
  file_url: string;
  changes_summary: string;
  extracted_text?: string;
  analysis: ContractAnalysis & {
    changesSummary?: string;
    improvements?: string[];
    regressions?: string[];
    unchanged?: string[];
  };
  created_at: string;
}

interface ContractDate {
  id: string;
  date_type: string;
  date: string;
  description: string;
  alert_days_before: number;
}

// Dynamically import PDFViewerWithSearch to avoid SSR issues
const PDFViewerWithSearch = dynamic(() => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <MusicLoader />
    </div>
  ),
});

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightedText, setHighlightedText] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Expandable items
  const [expandedAdvice, setExpandedAdvice] = useState<number | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);

  // Key dates
  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState({ date_type: "", date: "", description: "" });

  // Version tracking
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showVersionDeleteModal, setShowVersionDeleteModal] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<ContractVersion | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const contractId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/contract/${contractId}`);
      return;
    }

    if (user && contractId) {
      fetchContract();
    }
  }, [user, authLoading, contractId]);

  // Show PDF panel on desktop by default, hide on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setShowDocument(true);
    }
  }, []);

  const fetchContract = async () => {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (error) {
      setError("Contract not found");
    } else {
      setContract(data as Contract);
      
      // Fetch PDF URL if contract has a file
      if (data?.file_url && data?.file_type === "application/pdf") {
        fetchPdfUrl();
      }
    }
    setLoading(false);
  };

  const fetchPdfUrl = async (versionFileUrl?: string) => {
    setLoadingPdf(true);
    try {
      // If a version file URL is provided, fetch that instead
      const endpoint = versionFileUrl 
        ? `/api/contracts/${contractId}/file?versionPath=${encodeURIComponent(versionFileUrl)}`
        : `/api/contracts/${contractId}/file`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok && data.url) {
        setPdfUrl(data.url);
      }
    } catch (err) {
      console.error("Error fetching PDF URL:", err);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Get the selected version object
  const selectedVersion = useMemo(() => {
    if (!selectedVersionId) return null;
    return versions.find(v => v.id === selectedVersionId) || null;
  }, [selectedVersionId, versions]);

  // Get current version number for display
  const currentVersionNumber = selectedVersion ? selectedVersion.version_number + 1 : 1;
  const totalVersions = versions.length + 1; // +1 for original

  // Get the current analysis based on selected version
  const currentAnalysis = useMemo(() => {
    if (selectedVersion?.analysis) {
      return selectedVersion.analysis as ContractAnalysis;
    }
    return contract?.analysis as ContractAnalysis | undefined;
  }, [selectedVersion, contract?.analysis]);

  // Handle version selection
  const handleVersionSelect = async (versionId: string | null) => {
    setSelectedVersionId(versionId);
    
    if (versionId === null) {
      // Switch back to original
      if (contract?.file_url) {
        fetchPdfUrl();
      }
    } else {
      const version = versions.find(v => v.id === versionId);
      if (version?.file_url) {
        fetchPdfUrl(version.file_url);
      }
    }
  };

  const fetchVersions = async (selectLatest = false) => {
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      const data = await response.json();
      if (response.ok && data.versions) {
        setVersions(data.versions);
        // If selectLatest is true and there are versions, select the most recent one
        // versions are ordered by version_number descending, so first is latest
        if (selectLatest && data.versions.length > 0) {
          setSelectedVersionId(data.versions[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const uploadNewVersion = async (file: File) => {
    console.log("uploadNewVersion called with file:", file.name, file.size);
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.version) {
        // Refresh versions list
        await fetchVersions();
        // Auto-select the new version
        handleVersionSelect(data.version.id);
      } else if (data.isDuplicate) {
        setNotification({
          open: true,
          title: "Duplicate Document",
          message: data.error || "This document is identical to an existing version.",
        });
      } else {
        setNotification({
          open: true,
          title: "Upload Failed",
          message: data.error || "Failed to upload version",
        });
      }
    } catch (err) {
      console.error("Error uploading version:", err);
      alert("Failed to upload version");
    } finally {
      setUploadingVersion(false);
      // Reset the file input so the same file can be selected again
      if (versionInputRef.current) {
        versionInputRef.current.value = "";
      }
    }
  };

  const handleVersionDeleteClick = (version: ContractVersion) => {
    setVersionToDelete(version);
    setShowVersionDeleteModal(true);
  };

  const deleteVersion = async () => {
    if (!versionToDelete) return;

    // Close modal and clear state first
    const versionIdToDelete = versionToDelete.id;
    const wasSelected = selectedVersionId === versionIdToDelete;

    setShowVersionDeleteModal(false);
    setVersionToDelete(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}/versions?versionId=${versionIdToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // If we deleted the currently selected version, go back to original
        if (wasSelected) {
          handleVersionSelect(null);
        }
        // Update versions state directly by filtering out the deleted version
        setVersions(prev => prev.filter(v => v.id !== versionIdToDelete));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete version");
        // Refresh to restore state if delete failed
        await fetchVersions();
      }
    } catch (err) {
      console.error("Error deleting version:", err);
      alert("Failed to delete version");
      // Refresh to restore state if delete failed
      await fetchVersions();
    }
  };

  const fetchDates = async () => {
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
  };

  const addDate = async () => {
    if (!newDate.date_type || !newDate.date) return;

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
  };

  const deleteDate = async (dateId: string) => {
    try {
      await fetch(`/api/contracts/${contractId}/dates?dateId=${dateId}`, {
        method: "DELETE",
      });
      setDates(dates.filter((d) => d.id !== dateId));
    } catch (err) {
      console.error("Error deleting date:", err);
    }
  };

  // Fetch versions and dates when contract loads
  useEffect(() => {
    if (contract) {
      fetchVersions(true);
      fetchDates();
    }
  }, [contract?.id]);

  const toggleStar = async () => {
    if (!contract) return;
    
    await supabase
      .from("contracts")
      .update({ is_starred: !contract.is_starred })
      .eq("id", contract.id);

    setContract((prev) => prev ? { ...prev, is_starred: !prev.is_starred } : null);
  };

  const handleDeleteConfirm = async () => {
    if (!contract) return;
    await supabase.from("contracts").delete().eq("id", contract.id);
    router.push("/dashboard");
  };

  const analysis = currentAnalysis || (contract?.analysis as ContractAnalysis | null);

  // Normalize text for comparison
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Find match position
  const findMatchPosition = useCallback((searchText: string, contractContent: string): { start: number; length: number } | null => {
    const normalizedSearch = normalizeText(searchText);
    const normalizedContract = normalizeText(contractContent);
    
    let idx = normalizedContract.indexOf(normalizedSearch);
    if (idx !== -1) {
      const ratio = contractContent.length / normalizedContract.length;
      return { start: Math.floor(idx * ratio), length: Math.min(searchText.length + 50, 300) };
    }
    
    const words = normalizedSearch.split(' ').filter(w => w.length > 3);
    for (let wordCount = Math.min(words.length, 8); wordCount >= 3; wordCount--) {
      const phrase = words.slice(0, wordCount).join(' ');
      idx = normalizedContract.indexOf(phrase);
      if (idx !== -1) {
        const ratio = contractContent.length / normalizedContract.length;
        return { start: Math.floor(idx * ratio), length: Math.min(200, contractContent.length - Math.floor(idx * ratio)) };
      }
    }
    
    return null;
  }, []);

  const renderedContractText = useMemo(() => {
    if (!highlightedText || !contract?.extracted_text) return null;
    
    const match = findMatchPosition(highlightedText, contract.extracted_text);
    if (!match) return null;
    
    const before = contract.extracted_text.substring(0, match.start);
    const highlighted = contract.extracted_text.substring(match.start, match.start + match.length);
    const after = contract.extracted_text.substring(match.start + match.length);
    
    return { before, match: highlighted, after };
  }, [contract?.extracted_text, highlightedText, findMatchPosition]);

  // Download report handler
  const handleDownloadReport = async () => {
    if (!analysis) return;

    setDownloading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contract?.title || analysis.contractType || "Contract Analysis",
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
  };

  // Handle clause click for highlighting
  const handleClauseClick = (originalText: string | undefined) => {
    if (originalText) {
      setHighlightedText(originalText);
      setShowDocument(true);
    }
  };

  // Risk color helper
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-400 border-red-400/30";
      case "medium":
        return "text-amber-400 border-amber-400/30";
      case "low":
        return "text-green-400 border-green-400/30";
      default:
        return "text-muted-foreground border-border";
    }
  };

  // Get contextual questions based on term type
  const getTermChecklist = (title: string): string[] => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("royalt") || titleLower.includes("share") || titleLower.includes("percent")) {
      return ["Is this on gross or net?", "What deductions apply?", "Different rates for streaming vs sync?"];
    }
    if (titleLower.includes("term") || titleLower.includes("duration") || titleLower.includes("period")) {
      return ["When does this start/end?", "Does it auto-renew?", "Can I terminate early?"];
    }
    if (titleLower.includes("rights") || titleLower.includes("ownership") || titleLower.includes("copyright")) {
      return ["Exclusive or non-exclusive?", "Do rights revert?", "What territories?"];
    }
    if (titleLower.includes("advance") || titleLower.includes("payment") || titleLower.includes("recoup")) {
      return ["When do I receive this?", "Is this recoupable?", "From which sources?"];
    }
    return ["How does this compare to standard?", "Could this limit opportunities?", "Worst case scenario?"];
  };

  // Check if version has full analysis
  const versionHasFullAnalysis = selectedVersion?.analysis?.keyTerms && selectedVersion.analysis.keyTerms.length > 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border border-red-400/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <h1 className="text-lg font-medium text-foreground">{error || "Contract not found"}</h1>
        <Link href="/dashboard">
          <button className="h-8 px-4 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Clean Header - Fixed */}
      <header className="shrink-0 h-12 md:h-14 px-3 md:px-4 border-b border-border bg-background flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:bg-muted transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          {/* Desktop: full breadcrumb, Mobile: just title */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium truncate max-w-[300px]">
              {contract.title || analysis?.contractType || "Contract"}
            </span>
          </div>
          {/* Mobile: simple title */}
          <span className="md:hidden text-sm font-medium text-foreground truncate">
            {contract.title || analysis?.contractType || "Contract"}
          </span>
          {/* Risk badge - desktop only */}
          {analysis?.overallRiskAssessment && (
            <span className={cn(
              "hidden md:inline-flex text-xs px-2 py-1 rounded-md font-medium",
              analysis.overallRiskAssessment === "low" ? "bg-green-500/10 text-green-500" :
              analysis.overallRiskAssessment === "medium" ? "bg-amber-500/10 text-amber-500" :
              "bg-red-500/10 text-red-500"
            )}>
              {analysis.overallRiskAssessment.charAt(0).toUpperCase() + analysis.overallRiskAssessment.slice(1)} Risk
            </span>
          )}
        </div>
        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-2">
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
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-border hover:bg-muted flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {uploadingVersion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload Version
          </button>
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-border hover:bg-muted flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export
          </button>
          <button
            onClick={toggleStar}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {contract.is_starred ? (
              <Star className="w-4 h-4 text-primary fill-primary" />
            ) : (
              <Star className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted hover:border-red-500/30 transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
          </button>
        </div>
      </header>

      {/* Main Content Area - 2 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Document Panel - Desktop: side panel, Mobile: full-screen overlay */}
        <div
          className={cn(
            "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out min-h-0",
            // Mobile: fixed full-screen overlay
            "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto",
            // Desktop: side panel behavior
            "md:h-full",
            showDocument
              ? "opacity-100 visible md:w-2/5 md:min-w-[400px]"
              : "opacity-0 invisible md:w-0 md:opacity-100 md:visible"
          )}
        >
          {showDocument && (
            <>
              <div className="shrink-0 h-12 md:h-10 px-4 md:px-3 border-b border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{contract.title}</span>
                  {versions.length > 0 && (
                    <Select value={selectedVersionId || "original"} onValueChange={(val) => handleVersionSelect(val === "original" ? null : val)}>
                      <SelectTrigger className="h-5 min-w-[60px] gap-1 border-0 bg-muted/50 text-[10px] text-muted-foreground hover:text-foreground focus:ring-0 px-1.5">
                        <SelectValue>v{currentVersionNumber}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border" position="popper" side="bottom" align="start">
                        <SelectItem value="original" className="text-xs">v1 (Original)</SelectItem>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id} className="text-xs">v{v.version_number + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {/* Close button - visible on mobile */}
                <button
                  onClick={() => { setShowDocument(false); setHighlightedText(""); }}
                  className="md:hidden w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors rounded-md border border-border"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {pdfUrl && contract.file_type === "application/pdf" ? (
                  loadingPdf ? <div className="flex items-center justify-center h-full"><MusicLoader /></div> : <PDFViewerWithSearch fileUrl={pdfUrl} searchText={highlightedText} className="h-full" />
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 text-xs whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground">
                      {renderedContractText ? (<>{renderedContractText.before}<span id="highlighted-section" className="bg-primary/20 text-foreground px-1 border-l-2 border-primary">{renderedContractText.match}</span>{renderedContractText.after}</>) : (contract.extracted_text || "No text available")}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Main Analysis Content with Tabs */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ backgroundColor: '#fcfcfc' }}>
          {analysis ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              {/* Title and Tabs */}
              <div className="shrink-0" style={{ backgroundColor: '#fcfcfc' }}>
                {/* Desktop: Title with toggle */}
                <div className="hidden md:flex px-8 pt-8 pb-6 items-start justify-between">
                  <h1 className="text-2xl font-semibold" style={{ color: '#1d1b1a' }}>{contract.title || analysis.contractType || "Contract"}</h1>
                  <button
                    onClick={() => { setShowDocument(!showDocument); if (showDocument) setHighlightedText(""); }}
                    className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shrink-0"
                    style={{ backgroundColor: '#f3f1f0', color: '#797875' }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {showDocument ? 'Hide PDF' : 'Show PDF'}
                  </button>
                </div>

                {/* Mobile: Action buttons row */}
                <div className="md:hidden px-4 pt-4 pb-3">
                  {/* Risk badge */}
                  {analysis?.overallRiskAssessment && (
                    <div className="mb-3">
                      <span className={cn(
                        "text-xs px-2.5 py-1 rounded-md font-medium",
                        analysis.overallRiskAssessment === "low" ? "bg-green-500/10 text-green-500" :
                        analysis.overallRiskAssessment === "medium" ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {analysis.overallRiskAssessment.charAt(0).toUpperCase() + analysis.overallRiskAssessment.slice(1)} Risk
                      </span>
                    </div>
                  )}
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => { setShowDocument(!showDocument); if (showDocument) setHighlightedText(""); }}
                      className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
                      style={{ backgroundColor: '#f3f1f0', color: '#797875' }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {showDocument ? 'Hide PDF' : 'Show PDF'}
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      disabled={downloading}
                      className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#f3f1f0', color: '#797875' }}
                    >
                      {downloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Export
                    </button>
                    <button
                      onClick={async () => {
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: contract.title || 'Contract',
                              url: window.location.href,
                            });
                          } catch (err) {
                            // User cancelled or share failed
                          }
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all"
                      style={{ backgroundColor: '#f3f1f0', color: '#797875' }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                  </div>
                </div>

                {/* Tabs Header */}
                <div className="px-4 md:px-8 pb-0 border-b overflow-x-auto" style={{ borderColor: '#e5e5e5' }}>
                  <div className="flex gap-4 md:gap-6 min-w-max">
                    {[
                      { id: "overview", label: "Overview" },
                      { id: "terms", label: "Key Terms" },
                      { id: "financial", label: "Finances" },
                      { id: "advice", label: "Advice" },
                      { id: "versions", label: "Versions" },
                      { id: "dates", label: "Dates" },
                      { id: "discussion", label: "Discussion" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn("relative pb-3 text-sm font-medium transition-colors")}
                        style={{ color: activeTab === tab.id ? '#1d1b1a' : '#999694' }}
                      >
                        {tab.label}
                        {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: '#1d1b1a' }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  {/* Summary Section */}
                  <div className="rounded-2xl p-4" style={{ backgroundColor: '#f3f1f0' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#797875' }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#797875' }}>Summary</span>
                    </div>
                    <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                      <p className="text-sm font-medium leading-[1.8]" style={{ color: '#9a9895' }}>
                        This is a {analysis.contractType || "music contract"}
                        {analysis.parties?.artist && (
                          <>
                            {" "}between{" "}
                            <span className="font-semibold underline decoration-dotted underline-offset-4" style={{ color: '#1d1b1a' }}>{analysis.parties.artist}</span>
                          </>
                        )}
                        {analysis.parties?.label && (
                          <>
                            {" "}and{" "}
                            <span className="font-semibold underline decoration-dotted underline-offset-4" style={{ color: '#1d1b1a' }}>{analysis.parties.label}</span>
                          </>
                        )}
                        . {analysis.summary}
                        {analysis.financialTerms?.royaltyRate && (
                          <>
                            {" "}The royalty rate is{" "}
                            <span className="font-semibold underline decoration-dotted underline-offset-4" style={{ color: '#1d1b1a' }}>{analysis.financialTerms.royaltyRate}</span>
                          </>
                        )}
                        {analysis.termLength && (
                          <>
                            {" "}with a term of{" "}
                            <span className="font-semibold underline decoration-dotted underline-offset-4" style={{ color: '#1d1b1a' }}>{analysis.termLength}</span>
                          </>
                        )}
                        .
                      </p>
                    </div>
                  </div>

                  {/* Financials Section */}
                  {analysis.financialTerms && (
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#f3f1f0' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#797875' }} />
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#797875' }}>Key Financials</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {analysis.financialTerms?.royaltyRate && (
                          <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                            <div className="px-4 py-2" style={{ backgroundColor: '#f7f6f5', borderBottom: '1px solid #f3f1f0' }}>
                              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#9a9895' }}>Royalty</p>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm font-semibold" style={{ color: '#9a9895' }}>{analysis.financialTerms.royaltyRate}</p>
                            </div>
                          </div>
                        )}
                        {analysis.termLength && (
                          <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                            <div className="px-4 py-2" style={{ backgroundColor: '#f7f6f5', borderBottom: '1px solid #f3f1f0' }}>
                              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#9a9895' }}>Term</p>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm font-semibold" style={{ color: '#9a9895' }}>{analysis.termLength}</p>
                            </div>
                          </div>
                        )}
                        {analysis.financialTerms?.advanceAmount && (
                          <div className="rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                            <div className="px-4 py-2" style={{ backgroundColor: '#f7f6f5', borderBottom: '1px solid #f3f1f0' }}>
                              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#9a9895' }}>Advance</p>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm font-semibold" style={{ color: '#9a9895' }}>{analysis.financialTerms.advanceAmount}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Concerns List */}
                  {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#f3f1f0' }}>
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid #ffffff' }}>
                        <p className="text-sm" style={{ color: '#797875' }}>Review these potential concerns in your contract.</p>
                      </div>
                      {analysis.potentialConcerns.slice(0, 4).map((concern, i) => {
                        const explanation = analysis.concernExplanations?.[i];
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#eae8e7] transition-colors"
                            style={{ borderBottom: i < Math.min(analysis.potentialConcerns!.length, 4) - 1 ? '1px solid #ffffff' : 'none' }}
                            onClick={() => { const snippet = analysis.concernSnippets?.[i]; if (snippet) handleClauseClick(snippet); }}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e5e3e1' }}>
                              <AlertTriangle className="w-4 h-4" style={{ color: '#797875' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs mb-0.5" style={{ color: '#9a9895' }}>Concern {i + 1}</p>
                              <p className="text-sm font-medium" style={{ color: '#1d1b1a' }}>{concern}</p>
                              {explanation && (
                                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9a9895' }}>{explanation}</p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#9a9895' }} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Key Terms Tab */}
                <TabsContent value="terms" className="mt-0 space-y-6">
                  {/* Terms List */}
                  {(!analysis.keyTerms || analysis.keyTerms.length === 0) && (
                    <div className="py-12 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: '#999694' }} />
                      <p className="text-sm font-medium" style={{ color: '#9a9895' }}>{selectedVersion && !versionHasFullAnalysis ? "Full analysis not available for this version" : "No key terms extracted"}</p>
                    </div>
                  )}

                  {analysis.keyTerms && analysis.keyTerms.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#f3f1f0' }}>
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid #ffffff' }}>
                        <p className="text-sm" style={{ color: '#797875' }}>Review the key terms identified in your contract.</p>
                      </div>
                      {analysis.keyTerms?.map((term, i) => {
                        const isExpanded = expandedTerm === i;
                        return (
                          <div key={i}>
                            <div
                              className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[#eae8e7] transition-colors"
                              style={{
                                borderBottom: i < analysis.keyTerms!.length - 1 || isExpanded ? '1px solid #ffffff' : 'none',
                                backgroundColor: isExpanded ? '#eae8e7' : undefined
                              }}
                              onClick={() => setExpandedTerm(isExpanded ? null : i)}
                            >
                              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e5e3e1' }}>
                                <FileText className="w-4 h-4" style={{ color: '#797875' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs mb-0.5 capitalize" style={{ color: '#9a9895' }}>{term.riskLevel} Risk</p>
                                <p className="text-sm font-medium" style={{ color: '#1d1b1a' }}>{term.title}</p>
                                {!isExpanded && (
                                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9a9895' }}>{term.explanation}</p>
                                )}
                              </div>
                              <ChevronRight className={cn("w-4 h-4 shrink-0 transition-transform", isExpanded && "rotate-90")} style={{ color: '#9a9895' }} />
                            </div>
                            <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="px-4 pt-3 pb-4 space-y-3" style={{ backgroundColor: '#f3f1f0' }}>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#9a9895' }}>Summary</p>
                                  <p className="text-sm leading-relaxed" style={{ color: '#1d1b1a' }}>{term.content}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#9a9895' }}>In Plain English</p>
                                  <p className="text-sm leading-relaxed" style={{ color: '#1d1b1a' }}>{term.explanation}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: '#9a9895' }}>Questions to Ask</p>
                                  <div className="space-y-1.5">
                                    {(term.actionItems || getTermChecklist(term.title)).map((item, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm" style={{ color: '#1d1b1a' }}>
                                        <span style={{ color: '#9a9895' }} className="shrink-0">•</span>
                                        <span className="leading-relaxed">{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleClauseClick(term.originalText); }}
                                  className="text-xs font-medium flex items-center gap-1.5 transition-colors hover:opacity-70"
                                  style={{ color: '#797875' }}
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
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="mt-0">
                  <FinancialCalculator contractData={{ royaltyRate: analysis.financialTerms?.royaltyRate, advanceAmount: analysis.financialTerms?.advanceAmount, termLength: analysis.termLength }} />
                </TabsContent>

                {/* Advice Tab */}
                <TabsContent value="advice" className="mt-0 space-y-6">
                  {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                    <div className="py-12 text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: '#999694' }} />
                      <p className="text-sm font-medium" style={{ color: '#9a9895' }}>{selectedVersion && !versionHasFullAnalysis ? "Full recommendations not available" : "No recommendations available"}</p>
                    </div>
                  )}

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="space-y-3">
                      {analysis.recommendations?.map((rec, i) => {
                        const isExpanded = expandedAdvice === i;
                        const isStructured = typeof rec === 'object' && rec !== null;
                        const advice = isStructured ? rec.advice : rec;
                        const rationale = isStructured ? rec.rationale : "Following this protects your rights and ensures leverage in negotiations.";
                        const howToImplement = isStructured ? rec.howToImplement : "Bring this up during negotiation. Frame it as standard industry practice.";
                        const priority = isStructured ? rec.priority : "medium";
                        const priorityColor = priority === "high" ? "bg-red-500" : priority === "low" ? "bg-green-500" : "bg-amber-500";
                        const priorityTextColor = priority === "high" ? "text-red-500" : priority === "low" ? "text-green-500" : "text-amber-500";
                        return (
                          <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#f3f1f0' }}>
                            <div
                              onClick={() => setExpandedAdvice(isExpanded ? null : i)}
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#eae8e7] transition-colors"
                              style={{ backgroundColor: isExpanded ? '#eae8e7' : undefined }}
                            >
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", priorityColor)}>
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: '#1d1b1a' }}>{advice}</p>
                                <p className={cn("text-xs font-medium capitalize", priorityTextColor)}>{priority} priority</p>
                              </div>
                              <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isExpanded && "rotate-180")} style={{ color: '#999694' }} />
                            </div>
                            <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                              <div className="px-4 pt-4 pb-4 space-y-4">
                                <div className="rounded-xl p-4" style={{ backgroundColor: '#ffffff' }}>
                                  <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#9a9895' }}>Rationale</p>
                                  <p className="text-sm leading-relaxed" style={{ color: '#1d1b1a' }}>{rationale}</p>
                                </div>
                                <div className="rounded-xl p-4" style={{ backgroundColor: '#ffffff' }}>
                                  <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: '#9a9895' }}>How to Implement</p>
                                  <p className="text-sm leading-relaxed" style={{ color: '#1d1b1a' }}>{howToImplement}</p>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Versions Tab */}
                <TabsContent value="versions" className="mt-0 space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: '#999694' }}>Version History</p>
                    <button onClick={() => versionInputRef.current?.click()} disabled={uploadingVersion} className="text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 hover:opacity-70" style={{ color: '#999694' }}>
                      {uploadingVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload New
                    </button>
                  </div>
                  {loadingVersions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#999694' }} />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="py-12 text-center">
                      <History className="w-8 h-8 mx-auto mb-3" style={{ color: '#999694' }} />
                      <p className="text-base font-medium" style={{ color: '#9a9895' }}>No version history yet</p>
                      <p className="text-sm font-medium mt-1" style={{ color: '#999694' }}>Upload a new version to track changes</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {versions.map((version, i) => (
                        <div
                          key={version.id}
                          className={cn(
                            "flex items-center justify-between py-3 border-l-2 pl-4 -ml-4 transition-all cursor-pointer group",
                            selectedVersionId === version.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-black/5"
                          )}
                          style={{ borderColor: selectedVersionId === version.id ? undefined : 'transparent' }}
                          onClick={() => handleVersionSelect(version.id)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="w-6 h-6 flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: i === 0 ? '#1d1b1a' : '#e5e5e5', color: i === 0 ? '#fcfcfc' : '#999694' }}>
                              {version.version_number + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium truncate" style={{ color: '#1d1b1a' }}>{version.changes_summary || `Version ${version.version_number + 1}`}</p>
                              {version.analysis?.improvements?.[0] && (
                                <p className="text-sm font-medium text-green-500 truncate mt-0.5">{version.analysis.improvements[0]}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-sm font-medium" style={{ color: '#999694' }}>{new Date(version.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVersionDeleteClick(version); }}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                              style={{ color: '#999694' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Dates Tab */}
                <TabsContent value="dates" className="mt-0 space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: '#999694' }}>Key Dates</p>
                    <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                      <DialogTrigger asChild>
                        <button className="text-sm font-medium flex items-center gap-1.5 transition-colors hover:opacity-70" style={{ color: '#999694' }}>
                          <Plus className="w-3.5 h-3.5" /> Add Date
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground text-base">Add Key Date</DialogTitle>
                          <DialogDescription className="text-muted-foreground text-sm">Track important deadlines for this contract</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                            <Select value={newDate.date_type} onValueChange={(v) => setNewDate({ ...newDate, date_type: v })}>
                              <SelectTrigger className="bg-transparent border-border text-foreground text-sm h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                <SelectItem value="option_period">Option Period</SelectItem>
                                <SelectItem value="termination_window">Termination Window</SelectItem>
                                <SelectItem value="renewal">Renewal Date</SelectItem>
                                <SelectItem value="expiration">Expiration</SelectItem>
                                <SelectItem value="payment">Payment Due</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <Input type="date" value={newDate.date} onChange={(e) => setNewDate({ ...newDate, date: e.target.value })} className="bg-transparent border-border text-foreground text-sm h-10" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
                            <Input placeholder="e.g., Album option deadline" value={newDate.description} onChange={(e) => setNewDate({ ...newDate, description: e.target.value })} className="bg-transparent border-border text-foreground placeholder:text-muted-foreground/60 text-sm h-10" />
                          </div>
                        </div>
                        <button onClick={addDate} className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors">Add Date</button>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {loadingDates ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#999694' }} />
                    </div>
                  ) : dates.length === 0 ? (
                    <div className="py-12 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: '#999694' }} />
                      <p className="text-base font-medium" style={{ color: '#9a9895' }}>No key dates tracked</p>
                      <p className="text-sm font-medium mt-1" style={{ color: '#999694' }}>Add important deadlines to get reminders</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {dates.map((date) => {
                        const dateObj = new Date(date.date);
                        const today = new Date();
                        const daysUntil = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isPast = daysUntil < 0;
                        const isUrgent = daysUntil >= 0 && daysUntil <= 7;
                        const typeLabels: Record<string, string> = { option_period: "Option Period", termination_window: "Termination", renewal: "Renewal", expiration: "Expiration", payment: "Payment" };
                        return (
                          <div
                            key={date.id}
                            className={cn(
                              "flex items-center justify-between py-3 border-l-2 pl-4 -ml-4 transition-all group",
                              isPast ? "border-red-400 bg-red-500/5" :
                              isUrgent ? "border-amber-400 bg-amber-500/5" :
                              "border-transparent hover:bg-black/5"
                            )}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                isPast ? "bg-red-400" : isUrgent ? "bg-amber-400" : ""
                              )} style={{ backgroundColor: !isPast && !isUrgent ? '#999694' : undefined }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-medium" style={{ color: '#1d1b1a' }}>{date.description || typeLabels[date.date_type] || date.date_type}</p>
                                <p className="text-sm font-medium" style={{ color: '#999694' }}>{typeLabels[date.date_type]}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              {isPast && <span className="text-sm font-medium text-red-400">Overdue</span>}
                              {isUrgent && !isPast && <span className="text-sm font-medium text-amber-400">{daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}</span>}
                              <span className="text-sm font-medium" style={{ color: '#999694' }}>{dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              <button
                                onClick={() => deleteDate(date.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                style={{ color: '#999694' }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Discussion Tab */}
                <TabsContent value="discussion" className="mt-0 h-[calc(100vh-280px)]">
                  <div className="rounded-2xl overflow-hidden h-full" style={{ backgroundColor: '#f3f1f0' }}>
                    <ContractComments
                      contractId={contractId}
                      isOwner={true}
                      canComment={true}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-20">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No analysis available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        title={contract?.title || ""}
        versionCount={versions.length}
      />

      {/* Version Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showVersionDeleteModal}
        onOpenChange={setShowVersionDeleteModal}
        onConfirm={deleteVersion}
        title={`Version ${(versionToDelete?.version_number || 0) + 1}`}
        dialogTitle="Delete Version"
        description={<>Are you sure you want to delete <span className="text-foreground">Version {(versionToDelete?.version_number || 0) + 1}</span>?</>}
      />

      {/* Notification Modal */}
      <NotificationModal
        open={notification.open}
        onOpenChange={(open) => setNotification(prev => ({ ...prev, open }))}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
