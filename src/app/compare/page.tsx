"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Minus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface SavedContract {
  id: string;
  title: string;
  contract_type: string;
  overall_risk: string;
  created_at: string;
  analysis: {
    financialTerms?: {
      royaltyRate?: string;
      advanceAmount?: string;
      paymentSchedule?: string;
    };
    termLength?: string;
    keyTerms?: Array<{
      title: string;
      content: string;
      riskLevel: string;
    }>;
    potentialConcerns?: string[];
    overallRiskAssessment?: string;
  };
}

interface ComparisonMetric {
  label: string;
  values: (string | number | null)[];
  winner: number | null; // index of winning contract, null if tie
  higherIsBetter: boolean;
}

export default function ComparePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [contracts, setContracts] = useState<SavedContract[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{
    metrics: ComparisonMetric[];
    aiSummary: string;
    recommendation: string;
  } | null>(null);

  // Fetch user's contracts
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/compare");
      return;
    }

    const fetchContracts = async () => {
      try {
        const response = await fetch("/api/contracts");
        if (!response.ok) throw new Error("Failed to fetch contracts");
        const data = await response.json();
        setContracts(data.contracts || []);
      } catch (err) {
        console.error("Error fetching contracts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [user, authLoading, router]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setComparisonResult(null);
  };

  const selectedContracts = contracts.filter((c) => selectedIds.includes(c.id));

  const compareContracts = async () => {
    if (selectedContracts.length < 2) return;

    setComparing(true);
    
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractIds: selectedIds,
          contracts: selectedContracts.map((c) => ({
            id: c.id,
            title: c.title,
            analysis: c.analysis,
          })),
        }),
      });

      if (!response.ok) throw new Error("Comparison failed");
      
      const result = await response.json();
      setComparisonResult(result);
    } catch (err) {
      console.error("Comparison error:", err);
      // Generate client-side comparison as fallback
      setComparisonResult(generateLocalComparison(selectedContracts));
    } finally {
      setComparing(false);
    }
  };

  // Generate comparison locally (fallback)
  const generateLocalComparison = (contracts: SavedContract[]) => {
    const metrics: ComparisonMetric[] = [];

    // Compare royalty rates
    const royalties = contracts.map((c) => {
      const rate = c.analysis?.financialTerms?.royaltyRate;
      const match = rate?.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    });
    if (royalties.some((r) => r !== null)) {
      const validRoyalties = royalties.filter((r): r is number => r !== null);
      const maxRoyalty = Math.max(...validRoyalties);
      metrics.push({
        label: "Royalty Rate",
        values: contracts.map((c) => c.analysis?.financialTerms?.royaltyRate || "Not specified"),
        winner: royalties.indexOf(maxRoyalty),
        higherIsBetter: true,
      });
    }

    // Compare advance amounts
    const advances = contracts.map((c) => {
      const amount = c.analysis?.financialTerms?.advanceAmount;
      const match = amount?.match(/\$?([\d,]+)/);
      return match ? parseFloat(match[1].replace(/,/g, "")) : null;
    });
    if (advances.some((a) => a !== null)) {
      const validAdvances = advances.filter((a): a is number => a !== null);
      const maxAdvance = Math.max(...validAdvances);
      metrics.push({
        label: "Advance",
        values: contracts.map((c) => c.analysis?.financialTerms?.advanceAmount || "Not specified"),
        winner: advances.indexOf(maxAdvance),
        higherIsBetter: true,
      });
    }

    // Compare term lengths
    const terms = contracts.map((c) => {
      const term = c.analysis?.termLength;
      const match = term?.match(/(\d+)\s*(year|month)/i);
      if (!match) return null;
      const num = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "year" ? num * 12 : num;
    });
    if (terms.some((t) => t !== null)) {
      const validTerms = terms.filter((t): t is number => t !== null);
      const minTerm = Math.min(...validTerms);
      metrics.push({
        label: "Contract Term",
        values: contracts.map((c) => c.analysis?.termLength || "Not specified"),
        winner: terms.indexOf(minTerm),
        higherIsBetter: false, // Shorter is usually better for artist
      });
    }

    // Compare risk levels
    const riskOrder = { low: 1, medium: 2, high: 3 };
    const risks = contracts.map((c) => {
      const risk = c.analysis?.overallRiskAssessment?.toLowerCase() || c.overall_risk?.toLowerCase();
      return riskOrder[risk as keyof typeof riskOrder] || 2;
    });
    const minRisk = Math.min(...risks);
    metrics.push({
      label: "Risk Level",
      values: contracts.map((c) => c.analysis?.overallRiskAssessment || c.overall_risk || "Unknown"),
      winner: risks.indexOf(minRisk),
      higherIsBetter: false,
    });

    // Compare number of concerns
    const concernCounts = contracts.map((c) => c.analysis?.potentialConcerns?.length || 0);
    const minConcerns = Math.min(...concernCounts);
    metrics.push({
      label: "Red Flags",
      values: concernCounts.map((c) => `${c} concerns`),
      winner: concernCounts.indexOf(minConcerns),
      higherIsBetter: false,
    });

    // Generate summary
    const winners = metrics.map((m) => m.winner).filter((w): w is number => w !== null);
    const winCounts = contracts.map((_, i) => winners.filter((w) => w === i).length);
    const overallWinner = winCounts.indexOf(Math.max(...winCounts));

    return {
      metrics,
      aiSummary: `Based on ${metrics.length} key metrics, **${contracts[overallWinner].title}** appears to be the stronger offer overall, winning in ${winCounts[overallWinner]} out of ${metrics.length} categories.`,
      recommendation: winCounts[overallWinner] > metrics.length / 2
        ? `The ${contracts[overallWinner].title} deal looks more favorable. However, consider negotiating the weaker points before signing.`
        : "These deals are fairly balanced. Focus your negotiation on the specific terms that matter most to you.",
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Sub Header */}
      <div className="border-b border-border bg-card/50 mt-[57px]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Compare Contracts</h1>
          </div>
          <Button
            onClick={compareContracts}
            disabled={selectedIds.length < 2 || comparing}
          >
            {comparing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Compare ({selectedIds.length} selected)
              </>
            )}
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Contract Selection */}
        {!comparisonResult && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Select contracts to compare</h2>
            <p className="text-muted-foreground mb-6">
              Choose 2 or more contracts to see a side-by-side comparison of key terms.
            </p>

            {contracts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No contracts saved yet</p>
                  <Link href="/analyze">
                    <Button>
                      Analyze Your First Contract
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contracts.map((contract) => (
                  <Card
                    key={contract.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedIds.includes(contract.id) && "border-primary ring-2 ring-primary/20"
                    )}
                    onClick={() => toggleSelect(contract.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.includes(contract.id)}
                          onCheckedChange={() => toggleSelect(contract.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{contract.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {contract.contract_type || "Contract"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                contract.overall_risk === "high" && "border-red-500/50 text-red-400",
                                contract.overall_risk === "medium" && "border-amber-500/50 text-amber-400",
                                contract.overall_risk === "low" && "border-green-500/50 text-green-400"
                              )}
                            >
                              {contract.overall_risk} risk
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(contract.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="space-y-8">
            {/* AI Summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">{comparisonResult.aiSummary}</p>
                <p className="text-sm text-muted-foreground">{comparisonResult.recommendation}</p>
              </CardContent>
            </Card>

            {/* Side-by-Side Comparison */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Side-by-Side Comparison</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                {/* Header Row */}
                <div className="grid bg-muted/50" style={{ gridTemplateColumns: `200px repeat(${selectedContracts.length}, 1fr)` }}>
                  <div className="p-4 font-medium border-r border-border">Metric</div>
                  {selectedContracts.map((contract) => (
                    <div key={contract.id} className="p-4 font-medium text-center border-r border-border last:border-r-0">
                      <div className="truncate">{contract.title}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {contract.contract_type}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Metric Rows */}
                {comparisonResult.metrics.map((metric, i) => (
                  <div
                    key={i}
                    className="grid border-t border-border"
                    style={{ gridTemplateColumns: `200px repeat(${selectedContracts.length}, 1fr)` }}
                  >
                    <div className="p-4 font-medium text-sm border-r border-border bg-muted/20">
                      {metric.label}
                    </div>
                    {metric.values.map((value, j) => {
                      const isWinner = metric.winner === j;
                      const isLoser = metric.winner !== null && metric.winner !== j;
                      
                      return (
                        <div
                          key={j}
                          className={cn(
                            "p-4 text-center border-r border-border last:border-r-0 transition-colors",
                            isWinner && "bg-green-500/10",
                            isLoser && "bg-red-500/5"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isWinner && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                            {isLoser && (
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            )}
                            <span className={cn(
                              "text-sm",
                              isWinner && "text-green-400 font-medium",
                              isLoser && "text-red-400"
                            )}>
                              {value}
                            </span>
                          </div>
                          {isWinner && (
                            <span className="text-xs text-green-500 mt-1 block">Better</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Terms Deep Dive */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Key Terms Breakdown</h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedContracts.length}, 1fr)` }}>
                {selectedContracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{contract.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {contract.analysis?.keyTerms?.slice(0, 5).map((term, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs shrink-0 mt-0.5",
                              term.riskLevel === "high" && "border-red-500/50 text-red-400",
                              term.riskLevel === "medium" && "border-amber-500/50 text-amber-400",
                              term.riskLevel === "low" && "border-green-500/50 text-green-400"
                            )}
                          >
                            {term.riskLevel}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{term.title}</p>
                            <p className="text-xs text-muted-foreground">{term.content}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setComparisonResult(null);
                  setSelectedIds([]);
                }}
              >
                Compare Different Contracts
              </Button>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

