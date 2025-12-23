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
import { Navbar } from "@/components/Navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Star,
  StarOff,
  Trash2,
  ArrowLeft,
  Upload,
  History,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Shield,
  Eye,
  Download,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HelpSquareIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { MusicLoader } from "@/components/MusicLoader";

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
  const [showDocument, setShowDocument] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Version tracking
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);

  // Key dates
  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState({ date_type: "", date: "", description: "" });

  // Expandable items
  const [expandedAdvice, setExpandedAdvice] = useState<number | null>(null);
  const [expandedConcern, setExpandedConcern] = useState<number | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<number | null>(null);

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

  const fetchVersions = async () => {
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

  const uploadNewVersion = async (file: File) => {
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        fetchVersions();
      } else {
        alert(data.error || "Failed to upload version");
      }
    } catch (err) {
      console.error("Error uploading version:", err);
      alert("Failed to upload version");
    } finally {
      setUploadingVersion(false);
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
      fetchVersions();
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

  const deleteContract = async () => {
    if (!contract || !confirm("Are you sure you want to delete this contract?")) return;

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

  const handleHighlight = useCallback((text: string | undefined) => {
    if (!text) return;
    setHighlightedText(text);
    setTimeout(() => {
      const highlightEl = document.getElementById("highlighted-section");
      if (highlightEl) {
        highlightEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
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

  // Midday style - minimal color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-400 border-red-400/30";
      case "medium":
        return "text-yellow-400 border-yellow-400/30";
      case "low":
        return "text-green-400 border-green-400/30";
      default:
        return "text-[#878787] border-[#262626]";
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
    if (titleLower.includes("audit")) {
      return [
        "Verify how often you can request an audit",
        "Check who bears the cost of the audit",
        "Look for time limits on when you can dispute discrepancies"
      ];
    }
    if (titleLower.includes("terminat") || titleLower.includes("cancel")) {
      return [
        "Understand what triggers termination rights for each party",
        "Check the notice period required for termination",
        "Verify what happens to your rights and payments upon termination"
      ];
    }
    if (titleLower.includes("exclusiv")) {
      return [
        "Understand exactly what activities are restricted during exclusivity",
        "Check the geographic scope of the exclusivity",
        "Look for any carve-outs or exceptions to the exclusivity"
      ];
    }
    if (titleLower.includes("renewal") || titleLower.includes("option")) {
      return [
        "Check if renewal is automatic or requires mutual agreement",
        "Verify the terms (royalty rates, advances) for renewal periods",
        "Look for how to opt out of automatic renewals"
      ];
    }
    // Default checklist
    return [
      "Compare this term against industry standards for similar agreements",
      "Check how this term interacts with other clauses in the contract",
      "Consider if this term could limit your future opportunities"
    ];
  };

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

  // Default missing clauses
  const DEFAULT_MISSING_CLAUSES = [
    { clause: "Audit Rights", severity: "critical" as const, description: "No provision allowing you to audit financial records" },
    { clause: "Reversion Clause", severity: "high" as const, description: "No automatic rights reversion if works are unexploited" },
    { clause: "Creative Control", severity: "medium" as const, description: "No approval rights over how your work is used" },
    { clause: "Termination for Cause", severity: "medium" as const, description: "Limited grounds specified for early termination" },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <MusicLoader />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div className="w-12 h-12 border border-red-400/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <h1 className="text-lg font-medium text-white">{error || "Contract not found"}</h1>
        <Link href="/dashboard">
          <button className="h-8 px-4 text-sm text-[#878787] hover:text-white border border-[#262626] hover:border-[#404040] flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  // Check if version has full analysis data
  const versionHasFullAnalysis = selectedVersion?.analysis?.keyTerms && 
    selectedVersion.analysis.keyTerms.length > 0;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden pt-[57px]">
      <Navbar showBorder />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden overflow-x-hidden">
        {/* Document Side Panel - Midday style */}
        <div 
          className={cn(
            "h-full flex flex-col bg-black transition-all duration-300 ease-in-out overflow-hidden",
            showDocument ? "w-1/2 max-w-2xl border-r border-[#262626]" : "w-0"
          )}
        >
          {showDocument && (
            <>
              {/* Panel Header */}
              <div className="shrink-0 h-12 px-4 border-b border-[#262626] bg-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#878787]" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{contract.title}</span>
                    <span className="w-1 h-1 rounded-full bg-[#525252]" />
                    {/* Version Selector */}
                    {versions.length > 0 ? (
                      <Select
                        value={selectedVersionId || "original"}
                        onValueChange={(val) => handleVersionSelect(val === "original" ? null : val)}
                      >
                        <SelectTrigger className="h-6 min-w-[70px] gap-1 border-[#262626] bg-transparent text-xs text-[#878787] hover:text-white">
                          <SelectValue>
                            v{currentVersionNumber} of {totalVersions}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-[#262626]">
                          <SelectItem value="original" className="text-xs">
                            <div className="flex items-center gap-2">
                              <span>v1 (Original)</span>
                              <span className="text-[#525252]">
                                {new Date(contract.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </SelectItem>
                          {versions.map((v) => (
                            <SelectItem key={v.id} value={v.id} className="text-xs">
                              <div className="flex items-center gap-2">
                                <span>v{v.version_number + 1}</span>
                                <span className="text-[#525252]">
                                  {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                {v.analysis?.overallRiskAssessment && (
                                  <span className={cn(
                                    "text-[10px] px-1 border",
                                    v.analysis.overallRiskAssessment === "low" ? "text-green-400 border-green-400/30" :
                                    v.analysis.overallRiskAssessment === "medium" ? "text-yellow-400 border-yellow-400/30" :
                                    "text-red-400 border-red-400/30"
                                  )}>
                                    {v.analysis.overallRiskAssessment}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-[#525252]">
                        {new Date(contract.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {highlightedText && (
                    <span className="text-xs text-[#525252] px-2 py-0.5 border border-[#262626]">Highlighting</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {highlightedText && (
                    <button 
                      onClick={() => setHighlightedText("")}
                      className="text-xs text-[#878787] hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowDocument(false); setHighlightedText(""); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                  >
                    <X className="w-4 h-4 text-[#878787]" />
                  </button>
                </div>
              </div>
              {/* Version Info Banner */}
              {selectedVersion && (
                <div className="shrink-0 px-4 py-3 bg-[#0a0a0a] border-b border-[#262626]">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-[#262626] flex items-center justify-center shrink-0 mt-0.5">
                      <History className="w-3 h-3 text-[#878787]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white mb-1">Version {selectedVersion.version_number + 1} Changes</p>
                      <p className="text-[10px] text-[#878787] mb-2">{selectedVersion.changes_summary}</p>
                      {selectedVersion.analysis?.improvements && selectedVersion.analysis.improvements.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-green-400 mb-1">✓ Improvements</p>
                          <ul className="text-[10px] text-[#525252] space-y-0.5 ml-3">
                            {selectedVersion.analysis.improvements.slice(0, 3).map((imp, i) => (
                              <li key={i}>• {imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedVersion.analysis?.regressions && selectedVersion.analysis.regressions.length > 0 && (
                        <div>
                          <p className="text-[10px] text-red-400 mb-1">⚠ Regressions</p>
                          <ul className="text-[10px] text-[#525252] space-y-0.5 ml-3">
                            {selectedVersion.analysis.regressions.slice(0, 3).map((reg, i) => (
                              <li key={i}>• {reg}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* PDF Content */}
              <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
                {pdfUrl && contract.file_type === "application/pdf" ? (
                  loadingPdf ? (
                    <div className="flex items-center justify-center h-full">
                      <MusicLoader />
                    </div>
                  ) : (
                    <PDFViewerWithSearch 
                      fileUrl={pdfUrl} 
                      searchText={highlightedText}
                      className="h-full"
                    />
                  )
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed text-[#878787]">
                      {renderedContractText ? (
                        <>
                          {renderedContractText.before}
                          <span 
                            id="highlighted-section"
                            className="bg-white/10 text-white px-1 border-l-2 border-white"
                          >
                            {renderedContractText.match}
                          </span>
                          {renderedContractText.after}
                        </>
                      ) : (
                        contract.extracted_text || "No text available"
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {analysis ? (
            <main className={cn(
              "px-6 py-6 pb-24 transition-all duration-300",
              showDocument ? "w-full" : "max-w-4xl mx-auto"
            )}>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 mb-6">
                <Link href="/dashboard" className="flex items-center justify-center w-7 h-7 border border-[#262626] hover:border-[#404040] transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 text-[#878787]" />
                </Link>
                <nav className="flex items-center gap-2 text-sm">
                  <Link href="/dashboard" className="text-[#878787] hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <span className="text-[#525252]">/</span>
                  <span className="text-[#878787]">{analysis.contractType || "Contract"}</span>
                  <span className="text-[#525252]">/</span>
                  <span className="text-white font-medium">Analysis</span>
                </nav>
              </div>

              {/* Header - Midday style */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-medium text-white">{contract.title || analysis.contractType}</h1>
                    {selectedVersion && (
                      <span className="text-xs px-2 py-0.5 border border-blue-500/30 text-blue-400">
                        Version {selectedVersion.version_number + 1}
                      </span>
                    )}
                    <span className={cn(
                      "text-xs px-2 py-0.5 border uppercase",
                      analysis.overallRiskAssessment === "low" ? "border-green-500/30 text-green-400" :
                      analysis.overallRiskAssessment === "medium" ? "border-yellow-500/30 text-yellow-400" :
                      analysis.overallRiskAssessment === "high" ? "border-red-500/30 text-red-400" :
                      "border-[#262626] text-[#525252]"
                    )}>
                      {analysis.overallRiskAssessment === "low" ? "Low Risk" : 
                       analysis.overallRiskAssessment === "medium" ? "Medium Risk" :
                       analysis.overallRiskAssessment === "high" ? "High Risk" : "Analyzed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis.parties?.label && (
                      <span className="text-[#525252] text-sm">
                        {analysis.parties.label}
                        {analysis.parties?.artist && ` · ${analysis.parties.artist}`}
                      </span>
                    )}
                    {selectedVersion && (
                      <button
                        onClick={() => handleVersionSelect(null)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors ml-2"
                      >
                        ← Back to original
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDocument(!showDocument)}
                    className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-[#262626] hover:border-[#404040] flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {showDocument ? "Hide" : "Show"} PDF
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    disabled={downloading}
                    className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-[#262626] hover:border-[#404040] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {downloading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    Download Report
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
                    className="h-7 w-7 flex items-center justify-center border border-[#262626] hover:border-[#404040] transition-colors disabled:opacity-50"
                  >
                    {uploadingVersion ? (
                      <Loader2 className="w-3 h-3 text-[#525252] animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3 text-[#878787]" />
                    )}
                  </button>

                  <button 
                    onClick={toggleStar}
                    className="h-7 w-7 flex items-center justify-center border border-[#262626] hover:border-[#404040] transition-colors"
                  >
                    {contract.is_starred ? (
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <StarOff className="w-3 h-3 text-[#878787]" />
                    )}
                  </button>
                  <button 
                    onClick={deleteContract}
                    className="h-7 w-7 flex items-center justify-center border border-[#262626] hover:border-red-400/30 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-[#878787] hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Tabbed Content - Midday style */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex gap-6 border-b border-[#262626]">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "terms", label: "Key Terms" },
                    { id: "financial", label: "Finances" },
                    { id: "concerns", label: "Concerns" },
                    { id: "advice", label: "Advice" },
                    { id: "versions", label: "Versions" },
                    { id: "dates", label: "Dates" },
                  ].map((tab) => (
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
                          layoutId="tab-underline"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Legacy Version Warning */}
                {selectedVersion && !versionHasFullAnalysis && (
                  <div className="mb-4 p-3 border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-400 font-medium">Limited Analysis Available</p>
                        <p className="text-[10px] text-[#878787] mt-1">
                          This version was analyzed before full version analysis was available. 
                          Only change tracking is shown. Upload a new version to get full analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overview Tab - Midday style */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Summary */}
                  <div className="border border-[#262626] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] text-[#525252] uppercase tracking-wider">Summary</span>
                      <div className="h-px flex-1 bg-[#262626]" />
                    </div>
                    <p className="text-sm text-white leading-relaxed">{analysis.summary}</p>
                    
                    {/* Quick Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#262626]">
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
                  
                  {/* Financial Terms - Card style like midday */}
                  {analysis.financialTerms && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] text-[#525252] uppercase tracking-wider">Financial Terms</span>
                        <div className="h-px flex-1 bg-[#262626]" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {analysis.financialTerms.royaltyRate && (
                          <div className="border border-[#262626] p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-3 h-3 text-[#525252]" />
                              <span className="text-[10px] text-white">Royalty</span>
                            </div>
                            <p className="text-[10px] text-[#525252] mb-3">Your share of net sums</p>
                            <p className="text-sm text-white">{analysis.financialTerms.royaltyRate}</p>
                          </div>
                        )}
                        {analysis.termLength && (
                          <div className="border border-[#262626] p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3 h-3 text-[#525252]" />
                              <span className="text-[10px] text-white">Term</span>
                            </div>
                            <p className="text-[10px] text-[#525252] mb-3">Contract duration</p>
                            <p className="text-sm text-white">{analysis.termLength}</p>
                          </div>
                        )}
                        {analysis.financialTerms.advanceAmount && (
                          <div className="border border-[#262626] p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-3 h-3 text-[#525252]" />
                              <span className="text-[10px] text-white">Advance</span>
                            </div>
                            <p className="text-[10px] text-[#525252] mb-3">Upfront payment</p>
                            <p className="text-sm text-white">{analysis.financialTerms.advanceAmount}</p>
                          </div>
                        )}
                        {analysis.financialTerms.paymentSchedule && (
                          <div className="border border-[#262626] p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3 h-3 text-[#525252]" />
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
                      <div className="border border-[#262626] p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400">{analysis.potentialConcerns.length} Concerns Found</span>
                        </div>
                        <p className="text-xs text-[#a3a3a3]">{analysis.potentialConcerns[0]}</p>
                      </div>
                      {analysis.missingClauses && analysis.missingClauses.length > 0 && (
                        <div className="border border-[#262626] p-3">
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
                <TabsContent value="terms" className="space-y-2">
                  {(!analysis.keyTerms || analysis.keyTerms.length === 0) && (
                    <div className="border border-[#262626] p-8 text-center">
                      <FileText className="w-6 h-6 text-[#525252] mx-auto mb-2" />
                      <p className="text-xs text-[#878787]">
                        {selectedVersion && !versionHasFullAnalysis 
                          ? "Full key terms analysis not available for this version"
                          : "No key terms extracted"}
                      </p>
                    </div>
                  )}
                  {analysis.keyTerms?.map((term, i) => {
                    const isExpanded = expandedTerm === i;
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "border border-[#262626] transition-all",
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
                            <p className="text-xs text-[#878787] line-clamp-1">{term.content}</p>
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
                          <div className="border-t border-[#262626]">
                            <div className="p-3 space-y-4">
                              {/* Full Term Value */}
                              <div>
                                <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">What This Says</p>
                                <p className="text-xs text-[#a3a3a3]">{term.content}</p>
                              </div>
                              
                              {/* Plain English Explanation */}
                              <div>
                                <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">In Plain English</p>
                                <p className="text-xs text-[#878787]">{term.explanation}</p>
                              </div>
                              
                              {/* Risk Assessment */}
                              <div>
                                <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Risk Assessment</p>
                                <div className="flex items-start gap-2">
                                  <span className={cn("text-[10px] px-1.5 py-0.5 border capitalize shrink-0", getRiskColor(term.riskLevel))}>
                                    {term.riskLevel}
                                  </span>
                                  <p className="text-xs text-[#878787]">
                                    {term.riskLevel === "high" && "This term significantly favors the other party and could limit your rights or earnings."}
                                    {term.riskLevel === "medium" && "This term has some elements that could be improved but is within industry norms."}
                                    {term.riskLevel === "low" && "This term is favorable or standard for agreements of this type."}
                                  </p>
                                </div>
                              </div>
                              
                              {/* What to Look For */}
                              <div>
                                <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">What to Look For</p>
                                <ul className="text-xs text-[#878787] space-y-1">
                                  {(term.actionItems || getTermChecklist(term.title)).map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-[#525252] mt-1">•</span>
                                      <span>{item}</span>
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

                {/* Concerns Tab - Midday style */}
                <TabsContent value="concerns" className="space-y-2">
                  {(!analysis.potentialConcerns || analysis.potentialConcerns.length === 0) && (
                    <div className="border border-[#262626] p-8 text-center">
                      <AlertTriangle className="w-6 h-6 text-[#525252] mx-auto mb-2" />
                      <p className="text-xs text-[#878787]">
                        {selectedVersion && !versionHasFullAnalysis 
                          ? "Full concern analysis not available for this version"
                          : "No concerns identified"}
                      </p>
                    </div>
                  )}
                  {analysis.potentialConcerns?.map((concern, i) => {
                    const snippet = analysis.concernSnippets?.[i];
                    const isExpanded = expandedConcern === i;
                    return (
                      <div 
                        key={i}
                        className={cn(
                          "border border-[#262626] transition-all",
                          isExpanded && "bg-[#0a0a0a] border-[#404040]"
                        )}
                      >
                        <button
                          onClick={() => setExpandedConcern(isExpanded ? null : i)}
                          className="w-full p-3 flex items-start gap-3 text-left hover:bg-[#1a1a1a] transition-colors"
                        >
                          <div className="w-5 h-5 border border-[#262626] flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-[#878787]">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-[#a3a3a3]">{concern}</p>
                          </div>
                          <div className={cn(
                            "text-[#525252] transition-transform",
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
                          <div className="border-t border-[#262626]">
                            <div className="p-3 space-y-3">
                              <div>
                                <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Why This Matters</p>
                                <p className="text-xs text-[#878787]">
                                  This clause could limit your flexibility or create obligations that may not be in your best interest. Consider negotiating for more favorable terms or adding protective language.
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Suggested Action</p>
                                <p className="text-xs text-[#878787]">
                                  Review this section carefully with legal counsel before signing. Ask for clarification on any ambiguous terms.
                                </p>
                              </div>
                              {snippet && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClauseClick(snippet);
                                  }}
                                  className="text-[10px] text-[#525252] hover:text-white flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-2.5 h-2.5" /> View in contract
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* Advice Tab - Midday style */}
                <TabsContent value="advice" className="space-y-2">
                  {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                    <div className="border border-[#262626] p-8 text-center">
                      <CheckCircle2 className="w-6 h-6 text-[#525252] mx-auto mb-2" />
                      <p className="text-xs text-[#878787]">
                        {selectedVersion && !versionHasFullAnalysis 
                          ? "Full recommendations not available for this version"
                          : "No recommendations available"}
                      </p>
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
                          "border border-[#262626] transition-all",
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
                          <div className="border-t border-[#262626]">
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

                {/* Version History Tab - Midday style */}
                <TabsContent value="versions" className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-white">Version History</h4>
                    <button
                      onClick={() => versionInputRef.current?.click()}
                      disabled={uploadingVersion}
                      className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-[#262626] hover:border-[#404040] flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
                    <div className="text-center py-10 border border-[#262626]">
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
                            i === 0 ? "bg-white text-black" : "bg-[#1a1a1a] border border-[#262626] text-[#878787]"
                          )}>
                            <span className="text-[8px] font-bold">{version.version_number}</span>
                          </div>
                          
                          <div className={cn(
                            "border border-[#262626] p-3",
                            i === 0 && "border-[#404040]"
                          )}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-[#878787] px-1.5 py-0.5 border border-[#262626]">
                                Version {version.version_number}
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

                {/* Key Dates Tab - Midday style */}
                <TabsContent value="dates" className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-white">Key Dates & Deadlines</h4>
                    <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                      <DialogTrigger asChild>
                        <button className="h-7 px-2.5 text-xs text-[#878787] hover:text-white border border-[#262626] hover:border-[#404040] flex items-center gap-1.5 transition-colors">
                          <Plus className="w-3 h-3" />
                          Add Date
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0a0a0a] border-[#262626]">
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
                              <SelectTrigger className="bg-transparent border-[#262626] text-white text-xs h-8">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a0a0a] border-[#262626]">
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
                              className="bg-transparent border-[#262626] text-white text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#878787]">Description (optional)</label>
                            <Input
                              placeholder="e.g., Album option deadline"
                              value={newDate.description}
                              onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
                              className="bg-transparent border-[#262626] text-white placeholder:text-[#525252] text-xs h-8"
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
                    <div className="text-center py-10 border border-[#262626]">
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
                              "p-2.5 border border-[#262626] flex items-center gap-2.5",
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
              </Tabs>
            </main>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-20">
                <div className="w-10 h-10 border border-[#262626] flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#525252]" />
                </div>
                <h2 className="text-sm font-medium text-white mb-1">No Analysis Available</h2>
                <p className="text-xs text-[#525252]">This contract doesn&apos;t have analysis data yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action Footer - Midday style */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#262626] bg-black p-3 z-30">
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
