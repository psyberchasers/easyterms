"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Contract } from "@/types/database";
import { ContractAnalysis } from "@/types/contract";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DollarSign,
  Lightbulb,
  Users,
  Clock,
  Globe,
  BookOpen,
  Star,
  StarOff,
  Trash2,
  MousePointerClick,
  ArrowLeft,
  Scale,
  Upload,
  History,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface ContractVersion {
  id: string;
  version_number: number;
  file_url: string;
  changes_summary: string;
  analysis: {
    improvements?: string[];
    regressions?: string[];
    overallRiskAssessment?: string;
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
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  // Version tracking
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const versionInputRef = useRef<HTMLInputElement>(null);

  // Key dates
  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [newDate, setNewDate] = useState({ date_type: "", date: "", description: "" });

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

  const fetchPdfUrl = async () => {
    setLoadingPdf(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/file`);
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

  const analysis = contract?.analysis as ContractAnalysis | null;

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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-400 bg-red-500/20 border-red-500/40";
      case "medium":
        return "text-amber-400 bg-amber-500/20 border-amber-500/40";
      case "low":
        return "text-green-400 bg-green-500/20 border-green-500/40";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h1 className="text-xl font-semibold">{error || "Contract not found"}</h1>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Sub Header - Contract Info */}
      <div className="border-b border-border/50 bg-card/50 mt-[57px]">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold truncate max-w-[400px]">{contract.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Upload New Version Button */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => versionInputRef.current?.click()}
              disabled={uploadingVersion}
            >
              {uploadingVersion ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload New Version
            </Button>

            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </Link>

            <Button variant="ghost" size="icon" onClick={toggleStar}>
              {contract.is_starred ? (
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              ) : (
                <StarOff className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={deleteContract} className="text-destructive hover:text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-6">
        {analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            {/* Left Column - Original Contract */}
            <Card className="flex flex-col overflow-hidden border-border/50">
              <CardHeader className="shrink-0 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    Original Contract
                  </CardTitle>
                  {highlightedText && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setHighlightedText("")}
                      className="text-xs h-7"
                    >
                      Clear highlight
                    </Button>
                  )}
                </div>
                {highlightedText && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                    <MousePointerClick className="w-3 h-3" />
                    <span>Highlighted section from analysis</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {/* Show PDF viewer if we have a PDF URL and no highlight */}
                {pdfUrl && contract.file_type === "application/pdf" && !highlightedText ? (
                  loadingPdf ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                    <div className="p-6 text-sm whitespace-pre-wrap font-mono leading-relaxed text-foreground/80">
                      {renderedContractText ? (
                        <>
                          {renderedContractText.before}
                          <span 
                            id="highlighted-section"
                            className="bg-amber-500/30 text-amber-100 px-1 rounded border-l-2 border-amber-500"
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
              </CardContent>
            </Card>

            {/* Right Column - Analysis */}
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Top Summary Bar */}
              <Card className="shrink-0 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-primary border-primary/50">
                        {analysis.contractType}
                      </Badge>
                      <Badge className={cn("capitalize font-semibold", getRiskColor(analysis.overallRiskAssessment))}>
                        {analysis.overallRiskAssessment} Risk
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(analysis.confidenceScore * 100)}% confidence
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                    {analysis.summary.split('\n')[0]}
                  </p>
                </CardContent>
              </Card>

              {/* Tabbed Content */}
              <Card className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="terms" className="flex flex-col h-full">
                  <CardHeader className="shrink-0 pb-0 border-b border-border/50">
                    <TabsList className="grid grid-cols-6 w-full bg-muted/50">
                      <TabsTrigger value="terms" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                        <Scale className="w-3 h-3 mr-1" />
                        Terms
                      </TabsTrigger>
                      <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Money
                      </TabsTrigger>
                      <TabsTrigger value="concerns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Risks
                      </TabsTrigger>
                      <TabsTrigger value="advice" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Advice
                      </TabsTrigger>
                      <TabsTrigger value="versions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                        <History className="w-3 h-3 mr-1" />
                        History
                      </TabsTrigger>
                      <TabsTrigger value="dates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Dates
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full">
                      {/* Key Terms Tab */}
                      <TabsContent value="terms" className="m-0 p-4 space-y-3">
                        {analysis.keyTerms.map((term, i) => (
                          <div 
                            key={i} 
                            onClick={() => handleHighlight(term.originalText || term.content)}
                            className={cn(
                              "p-4 rounded-xl border-l-4 bg-card cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg",
                              term.riskLevel === "high" && "border-l-red-500 bg-red-500/5 hover:bg-red-500/10",
                              term.riskLevel === "medium" && "border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10",
                              term.riskLevel === "low" && "border-l-green-500 bg-green-500/5 hover:bg-green-500/10",
                              highlightedText === (term.originalText || term.content) && "ring-2 ring-amber-500"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{term.title}</h4>
                                <MousePointerClick className="w-3 h-3 text-muted-foreground opacity-50" />
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs capitalize shrink-0", getRiskColor(term.riskLevel))}
                              >
                                {term.riskLevel}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded mb-2">
                              &ldquo;{term.content}&rdquo;
                            </p>
                            <p className="text-sm text-foreground/80">{term.explanation}</p>
                          </div>
                        ))}
                      </TabsContent>

                      {/* Financial Tab */}
                      <TabsContent value="financial" className="m-0 p-4 space-y-3">
                        <div className="grid gap-3">
                          {analysis.financialTerms.advanceAmount && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-medium text-green-400">ADVANCE</span>
                              </div>
                              <p className="font-semibold">{analysis.financialTerms.advanceAmount}</p>
                            </div>
                          )}
                          {analysis.financialTerms.royaltyRate && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-medium text-blue-400">ROYALTY RATES</span>
                              </div>
                              <p className="font-semibold">{analysis.financialTerms.royaltyRate}</p>
                            </div>
                          )}
                          {analysis.financialTerms.recoupment && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-medium text-amber-400">RECOUPMENT</span>
                              </div>
                              <p className="font-semibold">{analysis.financialTerms.recoupment}</p>
                            </div>
                          )}
                          {analysis.financialTerms.paymentSchedule && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-medium text-purple-400">PAYMENT SCHEDULE</span>
                              </div>
                              <p className="font-semibold">{analysis.financialTerms.paymentSchedule}</p>
                            </div>
                          )}
                          {analysis.financialTerms.additionalNotes && (
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Additional Notes</p>
                              <p className="text-sm">{analysis.financialTerms.additionalNotes}</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Concerns Tab */}
                      <TabsContent value="concerns" className="m-0 p-4 space-y-3">
                        {analysis.potentialConcerns.map((concern, i) => {
                          const snippet = analysis.concernSnippets?.[i];
                          return (
                            <div 
                              key={i} 
                              onClick={() => snippet && handleHighlight(snippet)}
                              className={cn(
                                "flex gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 transition-all",
                                snippet && "cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:bg-red-500/10",
                                snippet && highlightedText === snippet && "ring-2 ring-amber-500"
                              )}
                            >
                              <div className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-red-400">{i + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm leading-relaxed">{concern}</p>
                                {snippet && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <MousePointerClick className="w-3 h-3" />
                                    <span>Click to view in contract</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </TabsContent>

                      {/* Advice Tab */}
                      <TabsContent value="advice" className="m-0 p-4 space-y-3">
                        {analysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-sm leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </TabsContent>

                      {/* Version History Tab */}
                      <TabsContent value="versions" className="m-0 p-4 space-y-3">
                        {loadingVersions ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : versions.length === 0 ? (
                          <div className="text-center py-8">
                            <History className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground mb-2">No version history yet</p>
                            <p className="text-xs text-muted-foreground">Upload a new version to start tracking changes</p>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                            
                            {versions.map((version, i) => (
                              <div key={version.id} className="relative pl-10 pb-6">
                                {/* Timeline dot */}
                                <div className={cn(
                                  "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background",
                                  i === 0 ? "bg-primary" : "bg-muted"
                                )}>
                                  <span className="text-[10px] font-bold">{version.version_number}</span>
                                </div>
                                
                                <Card className={cn(
                                  "border-border/50",
                                  i === 0 && "border-primary/50 bg-primary/5"
                                )}>
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="outline" className="text-xs">
                                        Version {version.version_number}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(version.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    
                                    <p className="text-sm mb-3">{version.changes_summary}</p>
                                    
                                    {version.analysis?.improvements && version.analysis.improvements.length > 0 && (
                                      <div className="space-y-1 mb-2">
                                        {version.analysis.improvements.slice(0, 2).map((imp, j) => (
                                          <div key={j} className="flex items-center gap-2 text-xs text-green-400">
                                            <ArrowUpRight className="w-3 h-3" />
                                            <span>{imp}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {version.analysis?.regressions && version.analysis.regressions.length > 0 && (
                                      <div className="space-y-1">
                                        {version.analysis.regressions.slice(0, 2).map((reg, j) => (
                                          <div key={j} className="flex items-center gap-2 text-xs text-red-400">
                                            <ArrowDownRight className="w-3 h-3" />
                                            <span>{reg}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* Key Dates Tab */}
                      <TabsContent value="dates" className="m-0 p-4 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium">Key Dates & Deadlines</h4>
                          <Dialog open={showAddDate} onOpenChange={setShowAddDate}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="w-3 h-3 mr-1" />
                                Add Date
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Key Date</DialogTitle>
                                <DialogDescription>
                                  Track important deadlines for this contract
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Type</label>
                                  <Select
                                    value={newDate.date_type}
                                    onValueChange={(v) => setNewDate({ ...newDate, date_type: v })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="option_period">Option Period</SelectItem>
                                      <SelectItem value="termination_window">Termination Window</SelectItem>
                                      <SelectItem value="renewal">Renewal Date</SelectItem>
                                      <SelectItem value="expiration">Expiration</SelectItem>
                                      <SelectItem value="payment">Payment Due</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Date</label>
                                  <Input
                                    type="date"
                                    value={newDate.date}
                                    onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Description (optional)</label>
                                  <Input
                                    placeholder="e.g., Album option deadline"
                                    value={newDate.description}
                                    onChange={(e) => setNewDate({ ...newDate, description: e.target.value })}
                                  />
                                </div>
                              </div>
                              <Button onClick={addDate} className="w-full">
                                Add Date
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {loadingDates ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : dates.length === 0 ? (
                          <div className="text-center py-8">
                            <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground mb-2">No key dates tracked</p>
                            <p className="text-xs text-muted-foreground">Add important deadlines to get reminders</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dates.map((date) => {
                              const dateObj = new Date(date.date);
                              const today = new Date();
                              const daysUntil = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              const isPast = daysUntil < 0;
                              const isUrgent = daysUntil >= 0 && daysUntil <= 7;

                              const typeColors: Record<string, string> = {
                                option_period: "bg-purple-500",
                                termination_window: "bg-red-500",
                                renewal: "bg-blue-500",
                                expiration: "bg-amber-500",
                                payment: "bg-green-500",
                              };

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
                                    "p-3 rounded-lg border flex items-center gap-3",
                                    isPast && "border-red-500/50 bg-red-500/5",
                                    isUrgent && !isPast && "border-amber-500/50 bg-amber-500/5",
                                    !isPast && !isUrgent && "border-border/50 bg-muted/30"
                                  )}
                                >
                                  <div className={cn(
                                    "w-2 h-full min-h-[40px] rounded",
                                    typeColors[date.date_type] || "bg-gray-500"
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {typeLabels[date.date_type] || date.date_type}
                                      </span>
                                      {isPast && (
                                        <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                                      )}
                                      {isUrgent && !isPast && (
                                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">
                                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium truncate">
                                      {date.description || dateObj.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteDate(date.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <Link href="/calendar" className="block">
                          <Button variant="outline" className="w-full mt-4">
                            <Calendar className="w-4 h-4 mr-2" />
                            View Full Calendar
                          </Button>
                        </Link>
                      </TabsContent>
                    </ScrollArea>
                  </CardContent>
                </Tabs>
              </Card>

              {/* Bottom Info Bar */}
              <Card className="shrink-0 bg-muted/30">
                <CardContent className="py-3">
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs text-muted-foreground">Parties</p>
                        <p className="font-medium truncate" title={analysis.parties.publisher || analysis.parties.label || analysis.parties.artist || "See contract"}>
                          {analysis.parties.publisher || analysis.parties.label || analysis.parties.artist || "See contract"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs text-muted-foreground">Term</p>
                        <p className="font-medium truncate" title={analysis.termLength || "Not specified"}>
                          {analysis.termLength || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs text-muted-foreground">Territory</p>
                        <p className="font-medium truncate" title={analysis.rightsAndOwnership?.territorialRights || "Not specified"}>
                          {analysis.rightsAndOwnership?.territorialRights || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analysis Available</h2>
            <p className="text-muted-foreground">This contract doesn&apos;t have analysis data yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

