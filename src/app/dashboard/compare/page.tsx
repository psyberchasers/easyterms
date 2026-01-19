"use client";

import { useState, useCallback, useMemo } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, AlertTriangle, X } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileUploadIcon, GitCompareIcon, File02Icon, MagicWand01Icon, PercentIcon, Calendar03Icon, AlertDiamondIcon, Flag01Icon, DollarCircleIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContractAnalysis } from "@/types/contract";
import { MusicLoader } from "@/components/MusicLoader";

// Text shimmer component
type TextShimmerProps = {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
};

function TextShimmer({
  children,
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <motion.p
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className,
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </motion.p>
  );
}

interface UploadedContract {
  file: File;
  analysis: ContractAnalysis | null;
  status: "idle" | "uploading" | "analyzing" | "complete" | "error";
  error?: string;
}

interface ComparisonMetric {
  label: string;
  values: (string | number | null)[];
  winner: number | null;
  higherIsBetter: boolean;
}

interface ComparisonResult {
  metrics: ComparisonMetric[];
  aiSummary: string;
  recommendation: string;
}

export default function ComparePage() {
  const [contracts, setContracts] = useState<[UploadedContract | null, UploadedContract | null]>([null, null]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [dragOver, setDragOver] = useState<0 | 1 | null>(null);

  const analyzeContract = async (file: File, index: 0 | 1) => {
    setContracts(prev => {
      const updated = [...prev] as [UploadedContract | null, UploadedContract | null];
      updated[index] = { file, analysis: null, status: "uploading" };
      return updated;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", "music");

      setContracts(prev => {
        const updated = [...prev] as [UploadedContract | null, UploadedContract | null];
        if (updated[index]) updated[index]!.status = "analyzing";
        return updated;
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      setContracts(prev => {
        const updated = [...prev] as [UploadedContract | null, UploadedContract | null];
        if (updated[index]) {
          updated[index]!.analysis = data.analysis;
          updated[index]!.status = "complete";
        }
        return updated;
      });
    } catch (err) {
      setContracts(prev => {
        const updated = [...prev] as [UploadedContract | null, UploadedContract | null];
        if (updated[index]) {
          updated[index]!.status = "error";
          updated[index]!.error = err instanceof Error ? err.message : "Unknown error";
        }
        return updated;
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, index: 0 | 1) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".doc") || file.name.endsWith(".docx"))) {
      analyzeContract(file, index);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeContract(file, index);
    }
    e.target.value = "";
  };

  const removeContract = (index: 0 | 1) => {
    setContracts(prev => {
      const updated = [...prev] as [UploadedContract | null, UploadedContract | null];
      updated[index] = null;
      return updated;
    });
    setComparisonResult(null);
  };

  const bothReady = contracts[0]?.status === "complete" && contracts[1]?.status === "complete";

  const generateComparison = async () => {
    if (!contracts[0]?.analysis || !contracts[1]?.analysis) return;

    setComparing(true);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contracts: [
            { title: contracts[0].file.name, analysis: contracts[0].analysis },
            { title: contracts[1].file.name, analysis: contracts[1].analysis },
          ],
        }),
      });

      if (!response.ok) throw new Error("Comparison failed");

      const result = await response.json();
      setComparisonResult(result);
    } catch {
      // Generate local comparison as fallback
      setComparisonResult(generateLocalComparison());
    } finally {
      setComparing(false);
    }
  };

  const generateLocalComparison = (): ComparisonResult => {
    const analyses = [contracts[0]?.analysis, contracts[1]?.analysis];
    const metrics: ComparisonMetric[] = [];

    // Compare royalty rates
    const royalties = analyses.map(a => {
      const rate = a?.financialTerms?.royaltyRate;
      const match = rate?.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    });
    if (royalties.some(r => r !== null)) {
      const validRoyalties = royalties.filter((r): r is number => r !== null);
      const maxRoyalty = Math.max(...validRoyalties);
      metrics.push({
        label: "Royalty Rate",
        values: analyses.map(a => a?.financialTerms?.royaltyRate || "Not specified"),
        winner: royalties.indexOf(maxRoyalty),
        higherIsBetter: true,
      });
    }

    // Compare term lengths
    const terms = analyses.map(a => {
      const term = a?.termLength;
      const match = term?.match(/(\d+)\s*(year|month)/i);
      if (!match) return null;
      const num = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "year" ? num * 12 : num;
    });
    if (terms.some(t => t !== null)) {
      const validTerms = terms.filter((t): t is number => t !== null);
      const minTerm = Math.min(...validTerms);
      metrics.push({
        label: "Contract Term",
        values: analyses.map(a => a?.termLength || "Not specified"),
        winner: terms.indexOf(minTerm),
        higherIsBetter: false,
      });
    }

    // Compare risk levels
    const riskOrder = { low: 1, medium: 2, high: 3 };
    const risks = analyses.map(a => {
      const risk = a?.overallRiskAssessment?.toLowerCase();
      return riskOrder[risk as keyof typeof riskOrder] || 2;
    });
    const minRisk = Math.min(...risks);
    metrics.push({
      label: "Risk Level",
      values: analyses.map(a => a?.overallRiskAssessment || "Unknown"),
      winner: risks.indexOf(minRisk),
      higherIsBetter: false,
    });

    // Compare concerns
    const concernCounts = analyses.map(a => a?.potentialConcerns?.length || 0);
    const minConcerns = Math.min(...concernCounts);
    metrics.push({
      label: "Red Flags",
      values: concernCounts.map(c => `${c} concerns`),
      winner: concernCounts.indexOf(minConcerns),
      higherIsBetter: false,
    });

    const winners = metrics.map(m => m.winner).filter((w): w is number => w !== null);
    const winCounts = [0, 1].map(i => winners.filter(w => w === i).length);
    const overallWinner = winCounts.indexOf(Math.max(...winCounts));
    const titles = [contracts[0]?.file.name || "Contract 1", contracts[1]?.file.name || "Contract 2"];

    return {
      metrics,
      aiSummary: `Based on ${metrics.length} key metrics, **${titles[overallWinner]}** appears to be the stronger offer, winning in ${winCounts[overallWinner]} out of ${metrics.length} categories.`,
      recommendation: winCounts[overallWinner] > metrics.length / 2
        ? `The ${titles[overallWinner]} deal looks more favorable. However, consider negotiating the weaker points before signing.`
        : "These deals are fairly balanced. Focus your negotiation on the specific terms that matter most to you.",
    };
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Two-Panel Upload Area */}
      {!comparisonResult && (
        <motion.div
          className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {[0, 1].map((index) => {
            const contract = contracts[index as 0 | 1];
            const isFirst = index === 0;

            return (
              <motion.div
                key={index}
                className={cn(
                  "bg-background flex flex-col items-center justify-center p-8 relative",
                  dragOver === index && "bg-purple-500/5"
                )}
                initial={{ opacity: 0, x: isFirst ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(index as 0 | 1); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, index as 0 | 1)}
              >
                <AnimatePresence mode="wait">
                  {!contract ? (
                    // Empty state - upload prompt
                    <motion.div
                      key="empty"
                      className="flex flex-col items-center text-center max-w-sm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-6">
                        <HugeiconsIcon
                          icon={FileUploadIcon}
                          size={28}
                          className="text-muted-foreground"
                        />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">
                        {isFirst ? "Upload First Contract" : "Upload Second Contract"}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Drag and drop or click to select a PDF or Word document
                      </p>
                      <label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleFileInput(e, index as 0 | 1)}
                        />
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Select File
                          </span>
                        </Button>
                      </label>
                    </motion.div>
                  ) : contract.status === "uploading" || contract.status === "analyzing" ? (
                    // Loading state
                    <motion.div
                      key="loading"
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MusicLoader />
                      <TextShimmer className="text-sm mt-4">
                        {contract.status === "uploading" ? "Uploading" : "Analyzing contract"}
                      </TextShimmer>
                      <p className="text-xs text-muted-foreground/60 mt-1">{contract.file.name}</p>
                    </motion.div>
                  ) : contract.status === "error" ? (
                    // Error state
                    <motion.div
                      key="error"
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-sm text-red-400 mb-4">{contract.error || "Analysis failed"}</p>
                      <Button variant="outline" size="sm" onClick={() => removeContract(index as 0 | 1)}>
                        Try Again
                      </Button>
                    </motion.div>
                  ) : (
                    // Complete state - show summary
                    <motion.div
                      key="complete"
                      className="flex flex-col items-center text-center w-full max-w-md"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => removeContract(index as 0 | 1)}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>

                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                        contract.analysis?.overallRiskAssessment === "high" ? "bg-red-500/10" :
                        contract.analysis?.overallRiskAssessment === "medium" ? "bg-amber-500/10" :
                        "bg-green-500/10"
                      )}>
                        <HugeiconsIcon
                          icon={File02Icon}
                          size={32}
                          className={cn(
                            contract.analysis?.overallRiskAssessment === "high" ? "text-red-500" :
                            contract.analysis?.overallRiskAssessment === "medium" ? "text-amber-500" :
                            "text-green-500"
                          )}
                        />
                      </div>

                      <h3 className="font-semibold mb-1 truncate max-w-full">{contract.file.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {contract.analysis?.contractType || "Contract"}
                      </p>

                      <Badge className={cn(
                        "mb-4",
                        contract.analysis?.overallRiskAssessment === "high" && "bg-red-500/20 text-red-400 hover:bg-red-500/20",
                        contract.analysis?.overallRiskAssessment === "medium" && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/20",
                        contract.analysis?.overallRiskAssessment === "low" && "bg-green-500/20 text-green-400 hover:bg-green-500/20"
                      )}>
                        {contract.analysis?.overallRiskAssessment ?
                          `${contract.analysis.overallRiskAssessment.charAt(0).toUpperCase()}${contract.analysis.overallRiskAssessment.slice(1)} Risk` :
                          "Unknown Risk"}
                      </Badge>

                      {/* Quick Stats - List format */}
                      <div className="w-full space-y-2.5 mt-2">
                        {contract.analysis?.financialTerms?.royaltyRate && (
                          <div className="flex items-start gap-2 md:gap-2 justify-between md:justify-start">
                            <div className="flex items-start gap-2">
                              <HugeiconsIcon icon={PercentIcon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Royalty</span>
                              <span className="text-xs text-muted-foreground/50 hidden md:inline">—</span>
                            </div>
                            <span className="text-xs font-medium text-foreground text-right md:text-left">{contract.analysis.financialTerms.royaltyRate}</span>
                          </div>
                        )}
                        {contract.analysis?.termLength && (
                          <div className="flex items-start gap-2 md:gap-2 justify-between md:justify-start">
                            <div className="flex items-start gap-2">
                              <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Term</span>
                              <span className="text-xs text-muted-foreground/50 hidden md:inline">—</span>
                            </div>
                            <span className="text-xs font-medium text-foreground text-right md:text-left">{contract.analysis.termLength}</span>
                          </div>
                        )}
                        {contract.analysis?.financialTerms?.advanceAmount && (
                          <div className="flex items-start gap-2 md:gap-2 justify-between md:justify-start">
                            <div className="flex items-start gap-2">
                              <HugeiconsIcon icon={DollarCircleIcon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Advance</span>
                              <span className="text-xs text-muted-foreground/50 hidden md:inline">—</span>
                            </div>
                            <span className="text-xs font-medium text-foreground text-right md:text-left">{contract.analysis.financialTerms.advanceAmount}</span>
                          </div>
                        )}
                        {contract.analysis?.rightsAndOwnership?.exclusivity && (
                          <div className="flex items-start gap-2 md:gap-2 justify-between md:justify-start">
                            <div className="flex items-start gap-2">
                              <HugeiconsIcon icon={Flag01Icon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Exclusivity</span>
                              <span className="text-xs text-muted-foreground/50 hidden md:inline">—</span>
                            </div>
                            <span className="text-xs font-medium text-foreground text-right md:text-left">{contract.analysis.rightsAndOwnership.exclusivity}</span>
                          </div>
                        )}
                        {contract.analysis?.rightsAndOwnership?.territorialRights && (
                          <div className="flex items-start gap-2 md:gap-2 justify-between md:justify-start">
                            <div className="flex items-start gap-2">
                              <HugeiconsIcon icon={Flag01Icon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Territory</span>
                              <span className="text-xs text-muted-foreground/50 hidden md:inline">—</span>
                            </div>
                            <span className="text-xs font-medium text-foreground text-right md:text-left">{contract.analysis.rightsAndOwnership.territorialRights}</span>
                          </div>
                        )}
                        {contract.analysis?.rightsAndOwnership?.masterOwnership && (
                          <div className="flex items-start gap-2 md:gap-2 justify-between md:justify-start">
                            <div className="flex items-start gap-2">
                              <HugeiconsIcon icon={Flag01Icon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Ownership</span>
                              <span className="text-xs text-muted-foreground/50 hidden md:inline">—</span>
                            </div>
                            <span className="text-xs font-medium text-foreground text-right md:text-left">{contract.analysis.rightsAndOwnership.masterOwnership}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Compare Button */}
      {!comparisonResult && (
        <motion.div
          className="border-t border-border p-4 pb-[52px] md:pb-4 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button
            size="lg"
            disabled={!bothReady || comparing}
            onClick={generateComparison}
            className="px-8"
          >
            {comparing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={GitCompareIcon} size={18} className="mr-2" />
                Compare Contracts
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Comparison Results */}
      {comparisonResult && (
        <motion.div
          className="flex-1 overflow-auto p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-5xl mx-auto space-y-6">
            {/* AI Summary */}
            <motion.div
              className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <HugeiconsIcon icon={MagicWand01Icon} size={20} className="text-purple-400" />
                <h3 className="font-semibold">Our AI Analysis</h3>
              </div>
              <p className="text-foreground mb-3">{comparisonResult.aiSummary}</p>
              <p className="text-sm text-muted-foreground">{comparisonResult.recommendation}</p>
            </motion.div>

            {/* Side-by-Side Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contract 1 */}
              <motion.div
                className="rounded-2xl border border-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="p-4 bg-muted/30 border-b border-border">
                  <p className="font-medium text-sm truncate">{contracts[0]?.file.name}</p>
                </div>
                <div className="p-4 space-y-3">
                  {comparisonResult.metrics.map((metric, i) => {
                    const isWinner = metric.winner === 0;
                    const isLoser = metric.winner !== null && metric.winner !== 0;
                    return (
                      <motion.div
                        key={i}
                        className="flex items-center justify-between gap-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.15 + i * 0.05 }}
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <HugeiconsIcon
                            icon={
                              metric.label === "Royalty Rate" ? PercentIcon :
                              metric.label === "Contract Term" ? Calendar03Icon :
                              metric.label === "Risk Level" ? AlertDiamondIcon :
                              Flag01Icon
                            }
                            size={14}
                            className="shrink-0"
                          />
                          {metric.label}
                        </div>
                        <div className="flex-1 border-b border-dashed border-border mx-2" />
                        <span className={cn(
                          "text-sm font-medium",
                          isWinner && "text-green-400",
                          isLoser && "text-red-400",
                          !isWinner && !isLoser && "text-foreground"
                        )}>
                          {metric.values[0]}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Contract 2 */}
              <motion.div
                className="rounded-2xl border border-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <div className="p-4 bg-muted/30 border-b border-border">
                  <p className="font-medium text-sm truncate">{contracts[1]?.file.name}</p>
                </div>
                <div className="p-4 space-y-3">
                  {comparisonResult.metrics.map((metric, i) => {
                    const isWinner = metric.winner === 1;
                    const isLoser = metric.winner !== null && metric.winner !== 1;
                    return (
                      <motion.div
                        key={i}
                        className="flex items-center justify-between gap-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.2 + i * 0.05 }}
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <HugeiconsIcon
                            icon={
                              metric.label === "Royalty Rate" ? PercentIcon :
                              metric.label === "Contract Term" ? Calendar03Icon :
                              metric.label === "Risk Level" ? AlertDiamondIcon :
                              Flag01Icon
                            }
                            size={14}
                            className="shrink-0"
                          />
                          {metric.label}
                        </div>
                        <div className="flex-1 border-b border-dashed border-border mx-2" />
                        <span className={cn(
                          "text-sm font-medium",
                          isWinner && "text-green-400",
                          isLoser && "text-red-400",
                          !isWinner && !isLoser && "text-foreground"
                        )}>
                          {metric.values[1]}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              className="flex justify-center gap-4 pt-4 pb-14 md:pb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setComparisonResult(null);
                  setContracts([null, null]);
                }}
              >
                Compare Different Contracts
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
