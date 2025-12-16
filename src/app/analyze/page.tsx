"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractAnalysis } from "@/types/contract";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
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
  ChevronRight,
  Save,
  AlertOctagon,
  HelpCircle,
  Download,
  Mail,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  MusicNote02Icon, 
  ChampionIcon, 
  YoutubeIcon, 
  GameboyIcon, 
  WorkIcon, 
  Home01Icon 
} from "@hugeicons-pro/core-stroke-rounded";
import {
  LegalDocument01Icon,
  Coins01Icon,
  Alert02Icon,
  HelpSquareIcon,
  AiIdeaIcon,
  Comment01Icon,
  DollarCircleIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import Lottie from "lottie-react";
import searchAnimation from "@/../public/search.json";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { IndustryType } from "@/config/industries";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { NegotiationAssistant } from "@/components/NegotiationAssistant";

// Dynamically import PDFViewerWithSearch to avoid SSR issues
const PDFViewerWithSearch = dynamic(() => import("@/components/PDFViewerWithSearch").then((mod) => mod.PDFViewerWithSearch), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
  const [showDocument, setShowDocument] = useState(false);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("music");
  const [showELI5Modal, setShowELI5Modal] = useState(false);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  
  // Save state
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry options
  const industries = [
    { id: "music" as IndustryType, name: "Music", icon: MusicNote02Icon },
    { id: "nil" as IndustryType, name: "NIL", icon: ChampionIcon },
    { id: "creator" as IndustryType, name: "Creator", icon: YoutubeIcon },
    { id: "esports" as IndustryType, name: "Esports", icon: GameboyIcon },
    { id: "freelance" as IndustryType, name: "Freelance", icon: WorkIcon },
    { id: "real-estate" as IndustryType, name: "Leases", icon: Home01Icon },
  ];


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
      formData.append("industry", selectedIndustry);

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
  }, [selectedIndustry, user]);

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
        industry: selectedIndustry,
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
  }, [user, selectedIndustry]);

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
      case "high": return "text-red-400 border-red-500/50 bg-red-500/10";
      case "medium": return "text-amber-400 border-amber-500/50 bg-amber-500/10";
      case "low": return "text-green-400 border-green-500/50 bg-green-500/10";
      default: return "text-muted-foreground";
    }
  };

  // ============================================
  // IDLE STATE - Upload Screen
  // ============================================
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar showNewAnalysis={false} />

        {/* Upload Area */}
        <main className="flex-1 flex items-center justify-center p-8 pt-24">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Analyze Your Contract</h1>
              <p className="text-muted-foreground">
                Upload a contract to get instant AI-powered analysis
              </p>
            </div>

            {/* Industry Selector */}
            <div className="flex justify-center gap-2 flex-wrap">
              {industries.map((industry) => (
                <Button
                  key={industry.id}
                  variant={selectedIndustry === industry.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedIndustry(industry.id)}
                  className="gap-2"
                >
                  <HugeiconsIcon icon={industry.icon} className="w-4 h-4" />
                  {industry.name}
                </Button>
              ))}
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="p-4 rounded-2xl bg-muted/50 w-fit mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-lg font-medium mb-2">Drop your contract here</p>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <div className="flex justify-center gap-2">
                {["PDF", "Word", "TXT"].map((format) => (
                  <Badge key={format} variant="secondary">{format}</Badge>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (status === "uploading" || status === "analyzing") {
    const steps = [
      { label: "Uploading document", done: status === "analyzing" },
      { label: "Extracting text", done: status === "analyzing" },
      { label: "AI analysis in progress", done: false },
      { label: "Generating insights", done: false },
    ];
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl opacity-50 rounded-full" />
        </div>
        
        {/* Lottie Animation - Above card */}
        <div className="w-40 h-40 mb-6 relative z-10">
          <Lottie animationData={searchAnimation} loop={true} />
        </div>
        
        {/* Title - Above card */}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {status === "uploading" ? "Uploading Document" : "Analyzing Your Contract"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Our AI is reviewing every clause for risks and opportunities
          </p>
        </div>
          
        <Card className="relative border-border/50 bg-card/80 backdrop-blur-sm w-full max-w-md z-10">
          <CardContent className="p-6">
              
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Processing...</p>
                </div>
              </div>
              
              {/* Progress Steps */}
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                      step.done 
                        ? "bg-primary text-primary-foreground" 
                        : i === (status === "uploading" ? 0 : 2)
                          ? "bg-primary/20 text-primary animate-pulse ring-2 ring-primary/30"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={cn(
                      "text-sm transition-colors",
                      step.done ? "text-foreground" : i === (status === "uploading" ? 0 : 2) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Bottom tip */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: The more detailed your contract, the better our analysis
                </p>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="text-lg font-medium">Analysis Failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={handleReset}>Try Again</Button>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPLETE STATE - Side by Side View
  // ============================================
  if (!analysis) return null;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden overflow-x-hidden pt-[57px]">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Side Panel */}
      <div 
        className={cn(
          "h-full flex flex-col bg-card transition-all duration-300 ease-in-out overflow-hidden",
          showDocument ? "w-1/2 max-w-2xl border-r border-border" : "w-0"
        )}
      >
        {showDocument && (
          <>
            {/* Panel Header */}
            <div className="shrink-0 p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium">Original Contract</span>
                {highlightedClause && (
                  <Badge variant="secondary" className="text-xs">Highlighting</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {highlightedClause && (
                  <Button variant="ghost" size="sm" onClick={() => setHighlightedClause(null)}>
                    Clear
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowDocument(false); setHighlightedClause(null); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* PDF Content */}
            <div className="flex-1 overflow-hidden">
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
          "mx-auto px-4 py-6 pb-24 transition-all duration-300",
          showDocument ? "max-w-3xl" : "max-w-6xl"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-lg font-bold">{analysis.contractType || fileName}</h1>
                <Badge 
                  variant="outline"
                  className={cn(
                    "capitalize text-xs px-2 py-0",
                    analysis.overallRiskAssessment === "high" && "border-red-500/40 text-red-400",
                    analysis.overallRiskAssessment === "medium" && "border-amber-500/40 text-amber-400",
                    analysis.overallRiskAssessment === "low" && "border-green-500/40 text-green-400"
                  )}
                >
                  {analysis.overallRiskAssessment} risk
                </Badge>
              </div>
              {analysis.parties?.label && (
                <span className="text-muted-foreground text-xs">
                  {analysis.parties.label}
                  {analysis.parties?.artist && ` → ${analysis.parties.artist}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocument(!showDocument)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {showDocument ? "Hide" : "View"} Original
              </Button>
              {saving ? (
                <Button variant="outline" size="sm" disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : savedContractId ? (
                <Button variant="outline" size="sm" disabled>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </Button>
              ) : user && (
                <Button variant="outline" size="sm" onClick={() => originalFile && saveContract(analysis, originalFile)}>
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center gap-1.5">
                <HugeiconsIcon icon={LegalDocument01Icon} size={16} />
                Key Terms
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Coins01Icon} size={16} />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="concerns" className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Alert02Icon} size={16} />
                Concerns
              </TabsTrigger>
              <TabsTrigger value="missing" className="flex items-center gap-1.5">
                <HugeiconsIcon icon={HelpSquareIcon} size={16} />
                Missing
              </TabsTrigger>
              <TabsTrigger value="advice" className="flex items-center gap-1.5">
                <HugeiconsIcon icon={AiIdeaIcon} size={16} />
                Advice
              </TabsTrigger>
              <TabsTrigger value="negotiate" className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Comment01Icon} size={16} />
                Negotiate
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Card */}
              <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contract Summary</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
                      
                      {/* Quick Stats Row */}
                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/30">
                        {analysis.parties?.artist && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-foreground/70">{analysis.parties.artist}</span>
                          </div>
                        )}
                        {analysis.parties?.label && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span className="text-foreground/70">{analysis.parties.label}</span>
                          </div>
                        )}
                        {analysis.contractType && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-foreground/70">{analysis.contractType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Financial Terms */}
              {analysis.financialTerms && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <HugeiconsIcon icon={DollarCircleIcon} size={16} />
                    FINANCIAL TERMS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.financialTerms.royaltyRate && (
                      <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                        <p className="text-[10px] text-blue-400/70">Royalty</p>
                        <p className="text-xs font-semibold text-blue-400 whitespace-nowrap">{analysis.financialTerms.royaltyRate}</p>
                      </div>
                    )}
                    {analysis.termLength && (
                      <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                        <p className="text-[10px] text-amber-400/70">Term</p>
                        <p className="text-xs font-semibold text-amber-400 whitespace-nowrap">{analysis.termLength}</p>
                      </div>
                    )}
                    {analysis.financialTerms.advanceAmount && (
                      <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 shrink-0">
                        <p className="text-[10px] text-green-400/70">Advance</p>
                        <p className="text-xs font-semibold text-green-400 whitespace-nowrap">{analysis.financialTerms.advanceAmount}</p>
                      </div>
                    )}
                    {analysis.financialTerms.paymentSchedule && (
                      <div className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                        <p className="text-[10px] text-purple-400/70">Payment</p>
                        <p className="text-xs font-semibold text-purple-400 whitespace-nowrap">{analysis.financialTerms.paymentSchedule}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Concerns Preview */}
              {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {analysis.potentialConcerns.length} Concerns Found
                    </h4>
                    <p className="text-sm text-foreground">{analysis.potentialConcerns[0]}</p>
                  </div>
                  {analysis.missingClauses && analysis.missingClauses.length > 0 && (
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                      <h4 className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
                        <HugeiconsIcon icon={HelpSquareIcon} size={14} />
                        {analysis.missingClauses.length} Missing Protections
                      </h4>
                      <p className="text-sm text-foreground">{analysis.missingClauses[0].clause}: {analysis.missingClauses[0].description}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Key Terms Tab */}
            <TabsContent value="terms">
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 text-xs text-muted-foreground">
                      <th className="text-left p-3 font-medium">Term</th>
                      <th className="text-left p-3 font-medium">Value</th>
                      <th className="text-left p-3 font-medium">Risk</th>
                      <th className="text-left p-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.keyTerms?.map((term, i) => (
                      <tr 
                        key={i}
                        onClick={() => handleClauseClick(term.originalText)}
                        className={cn(
                          "border-t border-border/30 cursor-pointer transition-all hover:bg-muted/20",
                          term.riskLevel === "high" && "bg-red-500/5 hover:bg-red-500/10",
                          highlightedClause === term.originalText && "ring-2 ring-primary bg-primary/5"
                        )}
                      >
                        <td className="p-3">
                          <div className="font-medium">{term.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{term.explanation}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-foreground/80">{term.content}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={getRiskColor(term.riskLevel)}>
                            {term.riskLevel}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

            {/* Concerns Tab */}
            <TabsContent value="concerns" className="space-y-3">
              {analysis.potentialConcerns?.map((concern, i) => {
                const snippet = analysis.concernSnippets?.[i];
                return (
                  <div 
                    key={i}
                    onClick={() => snippet && handleClauseClick(snippet)}
                    className={cn(
                      "p-4 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-all flex items-start gap-3",
                      highlightedClause === snippet && "ring-2 ring-primary"
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-red-400">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{concern}</p>
                      {snippet && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Click to view in contract
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* Missing Clauses Tab */}
            <TabsContent value="missing" className="space-y-3">
              {(analysis.missingClauses || DEFAULT_MISSING_CLAUSES).map((missing, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border flex items-start gap-3",
                    missing.severity === "critical" && "bg-red-500/10 border-red-500/30",
                    missing.severity === "high" && "bg-orange-500/10 border-orange-500/30",
                    missing.severity === "medium" && "bg-amber-500/10 border-amber-500/30"
                  )}
                >
                  <AlertOctagon className={cn(
                    "w-5 h-5 shrink-0",
                    missing.severity === "critical" && "text-red-400",
                    missing.severity === "high" && "text-orange-400",
                    missing.severity === "medium" && "text-amber-400"
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{missing.clause}</span>
                      <Badge variant="outline" className={cn(
                        "text-xs capitalize",
                        missing.severity === "critical" && "text-red-400 border-red-400/50",
                        missing.severity === "high" && "text-orange-400 border-orange-400/50",
                        missing.severity === "medium" && "text-amber-400 border-amber-400/50"
                      )}>
                        {missing.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{missing.description}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Advice Tab */}
            <TabsContent value="advice" className="space-y-3">
              {analysis.recommendations?.map((rec, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </TabsContent>

            {/* Negotiation Tab */}
            <TabsContent value="negotiate">
              <NegotiationAssistant 
                analysis={analysis}
                contractTitle={analysis.contractType}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur p-4 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">AI analysis • Always consult a lawyer</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowELI5Modal(true)}>
              <HelpCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Explain Like I'm 5</span>
            </Button>
            <Button variant="outline" onClick={handleDownloadReport} disabled={downloading}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              <span className="hidden sm:inline">Download Report</span>
            </Button>
            <Button onClick={() => setShowCounterOfferModal(true)} className="bg-primary">
              <Mail className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Draft Counter-Offer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ELI5 Modal */}
      {showELI5Modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowELI5Modal(false)}>
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Plain English Summary
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowELI5Modal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-semibold mb-2">🎵 What is this contract?</h4>
                  <p className="text-sm text-foreground/80">{analysis.summary}</p>
                </div>
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-semibold mb-2">💡 What should you do?</h4>
                    <ul className="text-sm text-foreground/80 space-y-1">
                      {analysis.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Counter-Offer Modal */}
      {showCounterOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCounterOfferModal(false)}>
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Draft Counter-Offer
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCounterOfferModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <NegotiationAssistant 
                analysis={analysis}
                contractTitle={analysis.contractType}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
