"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Shield,
  Eye,
  ChevronRight,
  Loader2,
  AlertOctagon,
  HelpCircle,
  Download,
  Mail,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LegalDocument01Icon,
  Coins01Icon,
  Alert02Icon,
  HelpSquareIcon,
  AiIdeaIcon,
  Comment01Icon,
  DollarCircleIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
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

// PDF file path
const DEMO_PDF_URL = "/sample-contract.pdf";

// Pre-loaded demo data - Songwriter Session Agreement
const DEMO_ANALYSIS = {
  contractType: "Songwriter Session Agreement",
  overallRiskAssessment: "medium" as "low" | "medium" | "high",
  confidenceScore: 0.85,
  summary: "This contract is a songwriter session agreement between Lyric House LLC (the Publisher) and an unnamed songwriter (the Writer). The agreement outlines the terms under which the Writer will participate in songwriting sessions organized by the Publisher. The Publisher will own and administer 100% of the publishing rights for a period of five years, with automatic renewals unless terminated. The Writer retains their writer's share and authorship rights. The Publisher will exploit the works for commercial purposes, and the Writer will receive a pro-rata share of 50% of net sums from exploitation.",
  
  parties: {
    artist: "Songwriter (Writer)",
    label: "Lyric House LLC (Publisher)",
  },
  
  termLength: "5 years with automatic 1-year renewals",
  
  financialTerms: {
    royaltyRate: "50% of net sums",
    paymentSchedule: "Payments due if income exceeds $100 on or before September 30th and March 31st",
    recoupment: "Standard recoupment terms",
    advanceAmount: "Not specified",
  },
  
  keyTerms: [
    {
      title: "Publishing Rights",
      content: "Publisher owns 100% of publishing rights for 5 years",
      explanation: "The Publisher owns and administers all publishing rights for five years, but the Writer retains their writer's share.",
      riskLevel: "medium" as const,
      originalText: "The Publisher shall own and administer one hundred percent (100%) of the publishing rights",
    },
    {
      title: "Revenue Share",
      content: "50% of net revenues to Writer",
      explanation: "The Writer receives 50% of net revenue, which is standard, but deductions for expenses are allowed.",
      riskLevel: "low" as const,
      originalText: "Writer shall receive fifty percent (50%) of net sums received by Publisher",
    },
    {
      title: "Post-Term Rights",
      content: "Publisher retains exploitation rights after term",
      explanation: "The Publisher retains rights to exploit works pitched during the term even after termination, which could limit future earnings.",
      riskLevel: "high" as const,
      originalText: "Publisher shall retain the right to continue exploiting any works pitched or placed during the term",
    },
    {
      title: "Automatic Renewal",
      content: "Contract auto-renews for 1-year periods",
      explanation: "The contract automatically renews unless either party provides written notice, which could extend commitment unexpectedly.",
      riskLevel: "medium" as const,
      originalText: "This Agreement shall automatically renew for successive one (1) year periods",
    },
  ],
  
  potentialConcerns: [
    "Publisher's post-term rights to exploit works could limit your future earnings on successful placements",
    "Automatic renewal of the term without mutual consent requirement",
    "Publisher's right to assign the agreement to third parties without Writer's approval",
    "Deductions from 'net sums' for expenses are not clearly defined or capped",
  ],
  
  concernSnippets: [
    "Publisher shall retain the right to continue exploiting any works pitched or placed during the term",
    "This Agreement shall automatically renew for successive one (1) year periods",
    "Publisher may assign this Agreement to any third party",
    "Net sums shall mean gross receipts less reasonable expenses",
  ],
  
  recommendations: [
    "Negotiate to limit the automatic renewal or require mutual consent for renewal",
    "Clarify or limit the scope of post-term rights to avoid potential conflicts",
    "Request detailed accounting of expenses deducted from 'net sums'",
    "Consider seeking legal advice to fully understand the implications of the Publisher's assignment rights",
  ],
  
  // Missing clauses detection
  missingClauses: [
    { clause: "Audit Rights", severity: "critical", description: "No provision allowing you to audit the Publisher's financial records" },
    { clause: "Reversion Clause", severity: "high", description: "No automatic rights reversion if works are unexploited for extended periods" },
    { clause: "Creative Control", severity: "medium", description: "No approval rights over how your compositions are used or modified" },
    { clause: "Termination for Cause", severity: "medium", description: "Limited grounds specified for early termination" },
  ],
};

// Benchmark comparisons
const BENCHMARKS = {
  royaltyRate: { value: 50, market: 50, verdict: "standard" as const },
  termLength: { value: 60, market: 36, verdict: "warning" as const }, // 5 years vs 3 years avg
  postTermRights: { value: "unlimited", market: "2 years", verdict: "poor" as const },
  autoRenewal: { value: true, market: "30%", verdict: "warning" as const },
};

export default function AnalyzeDemoPage() {
  const [showDocument, setShowDocument] = useState(false);
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [showELI5Modal, setShowELI5Modal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: DEMO_ANALYSIS.contractType,
          analysis: DEMO_ANALYSIS,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const html = await response.text();
      
      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Give it a moment to render, then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const analysis = DEMO_ANALYSIS;

  const handleClauseClick = (originalText: string) => {
    setHighlightedClause(originalText);
    setShowDocument(true);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 border-red-500/50 bg-red-500/10";
      case "medium": return "text-amber-400 border-amber-500/50 bg-amber-500/10";
      case "low": return "text-green-400 border-green-500/50 bg-green-500/10";
      default: return "text-muted-foreground";
    }
  };

  const getBenchmarkBadge = (verdict: string) => {
    switch (verdict) {
      case "standard": return <Badge className="bg-green-500/20 text-green-400 text-xs">✓ Standard</Badge>;
      case "good": return <Badge className="bg-green-500/20 text-green-400 text-xs">✓ Above Market</Badge>;
      case "warning": return <Badge className="bg-amber-500/20 text-amber-400 text-xs">⚠ Below Market</Badge>;
      case "poor": return <Badge className="bg-red-500/20 text-red-400 text-xs">⚠ Predatory</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar showNewAnalysis={false} />

      {/* Sub Header - Demo Controls */}
      <div className="mt-[57px] border-b border-border/50 bg-card/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Badge variant="outline" className="text-amber-400 border-amber-400/50">
            🧪 Demo Mode
          </Badge>
          <Button 
            variant={showDocument ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowDocument(!showDocument)}
          >
            <FileText className="w-4 h-4 mr-2" />
            {showDocument ? "Hide Original" : "View Original"}
          </Button>
        </div>
      </div>

      {/* Split Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Panel - Left Side */}
        <div 
          className={cn(
            "bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out shrink-0",
            showDocument ? "w-1/2" : "w-0"
          )}
        >
          {showDocument && (
            <>
              {/* Panel Header */}
              <div className="shrink-0 p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Original Contract</span>
                  {highlightedClause && (
                    <Badge variant="secondary" className="text-xs">Highlighted</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setHighlightedClause(null)}
                >
                  Clear
                </Button>
              </div>
              {/* PDF Content */}
              <div className="flex-1 overflow-hidden">
                <PDFViewerWithSearch 
                  fileUrl={DEMO_PDF_URL} 
                  searchText={highlightedClause || ""}
                  className="h-full"
                />
              </div>
            </>
          )}
        </div>

        {/* Main Content - Right Side */}
        <div className="flex-1 overflow-auto">
          <main className={cn(
            "mx-auto px-4 py-6 pb-24 transition-all duration-300",
            showDocument ? "max-w-3xl" : "max-w-6xl"
          )}>
        {/* Health Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-card via-card to-transparent border border-border/50 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-lg font-bold">{analysis.contractType}</h1>
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
              <span className="text-muted-foreground text-xs">
                {analysis.parties.label} → {analysis.parties.artist}
              </span>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
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
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-foreground/70">{analysis.contractType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial Terms */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <HugeiconsIcon icon={DollarCircleIcon} size={16} />
                FINANCIAL TERMS
              </h3>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-blue-400/70">Royalty</p>
                    {getBenchmarkBadge(BENCHMARKS.royaltyRate.verdict)}
                  </div>
                  <p className="text-xs font-semibold text-blue-400 whitespace-nowrap">{analysis.financialTerms.royaltyRate}</p>
                </div>
                
                <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-amber-400/70">Term</p>
                    {getBenchmarkBadge(BENCHMARKS.termLength.verdict)}
                  </div>
                  <p className="text-xs font-semibold text-amber-400 whitespace-nowrap">5 years</p>
                </div>

                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-red-400/70">Post-Term</p>
                    {getBenchmarkBadge(BENCHMARKS.postTermRights.verdict)}
                  </div>
                  <p className="text-xs font-semibold text-red-400 whitespace-nowrap">Unlimited</p>
                </div>

                <div className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                  <p className="text-[10px] text-purple-400/70">Payment</p>
                  <p className="text-xs font-semibold text-purple-400 whitespace-nowrap">Semi-annual</p>
                </div>
              </div>
            </div>

            {/* Quick Concerns Preview */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {analysis.potentialConcerns.length} Concerns Found
                </h4>
                <p className="text-sm text-foreground/70">{analysis.potentialConcerns[0]}</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <h4 className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={HelpSquareIcon} size={14} />
                  {analysis.missingClauses.length} Missing Protections
                </h4>
                <p className="text-sm text-foreground/70">{analysis.missingClauses[0].clause}: {analysis.missingClauses[0].description}</p>
              </div>
            </div>
          </TabsContent>

          {/* Key Terms Tab */}
          <TabsContent value="terms">
            <TooltipProvider>
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
                    {analysis.keyTerms.map((term, i) => (
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
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-foreground/80">{term.content}</span>
                        </td>
                        <td className="p-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className={cn("cursor-help", getRiskColor(term.riskLevel))}>
                                {term.riskLevel}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs p-3">
                              <p className="text-sm font-medium mb-1">Why {term.riskLevel} risk?</p>
                              <p className="text-xs text-muted-foreground">{term.explanation}</p>
                            </TooltipContent>
                          </Tooltip>
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
            </TooltipProvider>
          </TabsContent>

          {/* Financial Calculator Tab */}
          <TabsContent value="financial">
            <FinancialCalculator 
              contractData={{
                royaltyRate: analysis.financialTerms.royaltyRate,
                advanceAmount: analysis.financialTerms.advanceAmount,
                termLength: analysis.termLength,
              }}
            />
          </TabsContent>

          {/* Concerns Tab */}
          <TabsContent value="concerns" className="space-y-3">
            {analysis.potentialConcerns.map((concern, i) => (
              <div 
                key={i}
                onClick={() => analysis.concernSnippets?.[i] && handleClauseClick(analysis.concernSnippets[i])}
                className={cn(
                  "p-4 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-all flex items-start gap-3",
                  highlightedClause === analysis.concernSnippets?.[i] && "ring-2 ring-primary"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-red-400">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{concern}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Click to view in contract
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Missing Clauses Tab */}
          <TabsContent value="missing" className="space-y-3">
            {analysis.missingClauses.map((missing, i) => (
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
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm">{rec}</p>
              </div>
            ))}
          </TabsContent>

          {/* Negotiation Assistant Tab */}
          <TabsContent value="negotiate">
            <NegotiationAssistant 
              analysis={analysis as any}
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
            <span>Analysis powered by AI • Always consult a lawyer for legal advice</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowELI5Modal(true)}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Explain Like I'm 5
            </Button>
            <Button variant="outline" onClick={handleDownloadReport} disabled={downloading}>
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download Report
            </Button>
            <Button onClick={() => setShowCounterOfferModal(true)} className="bg-primary">
              <Mail className="w-4 h-4 mr-2" />
              Draft Counter-Offer
            </Button>
          </div>
        </div>
      </div>

      {/* Counter-Offer Modal */}
      {showCounterOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle>Draft Counter-Offer Email</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCounterOfferModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Subject</label>
                  <p className="p-2 bg-muted/30 rounded text-sm">Re: Songwriter Session Agreement - Proposed Modifications</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email Body</label>
                  <div className="p-4 bg-muted/30 rounded text-sm space-y-3 font-mono">
                    <p>Dear Lyric House LLC,</p>
                    <p>Thank you for sending over the Songwriter Session Agreement. After careful review, I would like to propose the following modifications before signing:</p>
                    <p><strong>1. Post-Term Rights (Section 3):</strong> I request that the Publisher's post-term exploitation rights be limited to 2 years following termination, which aligns with industry standards.</p>
                    <p><strong>2. Automatic Renewal (Section 4):</strong> I propose changing the automatic renewal to require mutual written consent, rather than automatic extension.</p>
                    <p><strong>3. Audit Rights:</strong> I request the addition of a standard audit clause allowing me to review financial records related to my compositions once per calendar year.</p>
                    <p><strong>4. Assignment (Section 5):</strong> I request that any assignment of this Agreement require my prior written consent.</p>
                    <p>I believe these modifications are reasonable and reflect standard industry practices. I look forward to discussing these points with you.</p>
                    <p>Best regards,<br/>[Your Name]</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCounterOfferModal(false)}>Cancel</Button>
                  <Button>
                    <Mail className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ELI5 Modal */}
      {showELI5Modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Explain Like I'm 5
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowELI5Modal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-semibold mb-2">🎵 What is this contract?</h4>
                  <p className="text-sm text-foreground/80">
                    Imagine you write songs, and a company (Lyric House) wants to help sell your songs to movies, TV shows, and other artists. This paper says they'll do that work, and you'll split the money with them.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <h4 className="font-semibold mb-2">✅ The Good Stuff</h4>
                  <ul className="text-sm text-foreground/80 space-y-1">
                    <li>• You get to keep half (50%) of any money your songs make</li>
                    <li>• Your name stays on the songs as the writer</li>
                    <li>• They'll do the hard work of finding people to use your music</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <h4 className="font-semibold mb-2">⚠️ The Tricky Parts</h4>
                  <ul className="text-sm text-foreground/80 space-y-1">
                    <li>• <strong>They keep rights forever:</strong> Even after you stop working together, they can still make money from songs you wrote during that time. Forever.</li>
                    <li>• <strong>Auto-renew trap:</strong> The contract keeps going year after year unless you remember to cancel it.</li>
                    <li>• <strong>No checking their math:</strong> You can't look at their receipts to make sure they're paying you the right amount.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <h4 className="font-semibold mb-2">💡 What to Ask For</h4>
                  <p className="text-sm text-foreground/80">
                    Before signing, ask them to: (1) Limit how long they can use your songs after you leave, (2) Let you check their money records once a year, and (3) Make the contract not auto-renew without you agreeing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

