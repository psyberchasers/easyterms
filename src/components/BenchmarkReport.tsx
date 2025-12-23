"use client";

import { BenchmarkReport as BenchmarkReportType, DealComparison } from "@/types/benchmarking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Target,
  Lightbulb,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BenchmarkReportProps {
  report: BenchmarkReportType;
}

function getVerdictStyle(verdict: DealComparison["verdict"]) {
  switch (verdict) {
    case "excellent":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: CheckCircle2,
        label: "Excellent",
      };
    case "good":
      return {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-400",
        icon: TrendingUp,
        label: "Good",
      };
    case "average":
      return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        icon: Minus,
        label: "Average",
      };
    case "below-average":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
        icon: TrendingDown,
        label: "Below Avg",
      };
    case "poor":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        icon: XCircle,
        label: "Poor",
      };
  }
}

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = () => {
    if (score >= 70) return "from-emerald-500 to-green-400";
    if (score >= 50) return "from-yellow-500 to-amber-400";
    if (score >= 30) return "from-orange-500 to-amber-500";
    return "from-red-500 to-orange-500";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent Deal";
    if (score >= 65) return "Good Deal";
    if (score >= 50) return "Fair Deal";
    if (score >= 35) return "Below Market";
    return "Poor Deal";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Score arc */}
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 352} 352`}
            className={cn("transition-all duration-1000", `stroke-current`)}
            style={{
              stroke: `url(#scoreGradient)`,
            }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={cn("stop-color-current", score >= 50 ? "text-emerald-500" : "text-orange-500")} stopColor={score >= 50 ? "#10b981" : "#f97316"} />
              <stop offset="100%" className={cn("stop-color-current", score >= 50 ? "text-green-400" : "#f59e0b")} stopColor={score >= 50 ? "#4ade80" : "#f59e0b"} />
            </linearGradient>
          </defs>
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className={cn(
        "mt-2 text-sm font-medium",
        score >= 65 ? "text-emerald-400" : score >= 45 ? "text-yellow-400" : "text-orange-400"
      )}>
        {getScoreLabel()}
      </p>
    </div>
  );
}

function ComparisonBar({ comparison }: { comparison: DealComparison }) {
  const style = getVerdictStyle(comparison.verdict);
  const Icon = style.icon;
  
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      style.bg,
      style.border
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("w-4 h-4", style.text)} />
            <span className="font-medium text-foreground">{comparison.label}</span>
            <Badge variant="outline" className={cn("text-xs", style.text, style.border)}>
              {style.label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <p className="text-muted-foreground">Your Deal</p>
              <p className="font-semibold text-foreground">{comparison.yourValue}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Market Avg</p>
              <p className="font-semibold text-foreground/70">{comparison.marketAverage}</p>
            </div>
          </div>
          
          {/* Percentile bar */}
          <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                comparison.percentile >= 70 ? "bg-emerald-500" :
                comparison.percentile >= 50 ? "bg-yellow-500" :
                comparison.percentile >= 30 ? "bg-orange-500" : "bg-red-500"
              )}
              style={{ width: `${comparison.percentile}%` }}
            />
            {/* Market average marker */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground/50"
              style={{ left: "50%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {comparison.percentile}th percentile
          </p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mt-3 border-t border-border pt-3">
        {comparison.insight}
      </p>
    </div>
  );
}

export function BenchmarkReportComponent({ report }: BenchmarkReportProps) {
  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle>Deal Benchmark Report</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            How your deal compares to {report.sampleSize.toLocaleString()}+ similar contracts
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Score Gauge */}
            <div className="flex justify-center">
              <ScoreGauge score={report.overallScore} />
            </div>
            
            {/* Strengths & Weaknesses */}
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-emerald-400">Strengths</span>
                </div>
                {report.strengths.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {report.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No standout strengths identified</p>
                )}
              </div>
              
              {/* Weaknesses */}
              <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="font-medium text-orange-400">Areas to Improve</span>
                </div>
                {report.weaknesses.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {report.weaknesses.slice(0, 3).map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No major concerns found</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparisons */}
      {report.comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Metric Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {report.comparisons.map((comparison) => (
                <ComparisonBar key={comparison.metric} comparison={comparison} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negotiation Suggestions */}
      {report.negotiationPoints.length > 0 && (
        <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-lg">Negotiation Tips</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on market data, here&apos;s what to ask for
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.negotiationPoints.map((point, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border"
                >
                  <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Source Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
        <Users className="w-3 h-3" />
        <span>
          Based on {report.sampleSize.toLocaleString()} anonymized contracts • 
          Last updated {new Date(report.generatedAt).toLocaleDateString()}
        </span>
        <Sparkles className="w-3 h-3 text-primary" />
      </div>
    </div>
  );
}





