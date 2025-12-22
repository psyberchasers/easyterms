"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  DollarSign,
  Clock,
  Scale,
  ExternalLink,
} from "lucide-react";
import { ContractAnalysis } from "@/types/contract";
import { cn } from "@/lib/utils";

type WidgetStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

export default function WidgetPage() {
  const [status, setStatus] = useState<WidgetStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus("uploading");
    setProgress(20);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", "music"); // Default to music

      setStatus("analyzing");
      setProgress(50);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      setProgress(90);
      const data = await response.json();
      setAnalysis(data.analysis);
      setStatus("complete");
      setProgress(100);

      // Post message to parent window (for iframe communication)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: "EASYTERMS_ANALYSIS_COMPLETE",
          analysis: data.analysis,
        }, "*");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-500 bg-red-500/20 border-red-500/40";
      case "medium": return "text-amber-500 bg-amber-500/20 border-amber-500/40";
      case "low": return "text-green-500 bg-green-500/20 border-green-500/40";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Scale className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">EasyTerms</span>
            </div>
            <a 
              href="https://easyterms.io" 
              target="_blank" 
              rel="noopener"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              Powered by EasyTerms
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Upload State */}
          {status === "idle" && (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium mb-1">Drop your contract here</p>
              <p className="text-sm text-muted-foreground">PDF, Word, or TXT • Max 10MB</p>
            </div>
          )}

          {/* Analyzing State */}
          {(status === "uploading" || status === "analyzing") && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="font-medium mb-2">
                {status === "uploading" ? "Uploading..." : "Analyzing contract..."}
              </p>
              <p className="text-sm text-muted-foreground mb-4">{fileName}</p>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center py-8">
              <div className="p-3 rounded-full bg-red-500/10 w-fit mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="font-medium mb-2 text-red-500">Analysis Failed</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => setStatus("idle")} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {/* Complete State */}
          {status === "complete" && analysis && (
            <div className="space-y-4">
              {/* Risk Badge */}
              <div className="flex items-center justify-between">
                <Badge className={cn("capitalize", getRiskColor(analysis.overallRiskAssessment))}>
                  {analysis.overallRiskAssessment} Risk
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(analysis.confidenceScore * 100)}% confidence
                </span>
              </div>

              {/* Contract Type */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contract Type</p>
                <p className="font-medium text-sm">{analysis.contractType}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <p className="text-lg font-bold">{analysis.potentialConcerns.length}</p>
                  <p className="text-[10px] text-muted-foreground">Concerns</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <Shield className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{analysis.keyTerms.length}</p>
                  <p className="text-[10px] text-muted-foreground">Key Terms</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50 text-center">
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{analysis.recommendations.length}</p>
                  <p className="text-[10px] text-muted-foreground">Tips</p>
                </div>
              </div>

              {/* Top Concerns */}
              {analysis.potentialConcerns.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    Top Concerns
                  </p>
                  <ul className="space-y-1.5">
                    {analysis.potentialConcerns.slice(0, 3).map((concern, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-red-500">•</span>
                        <span className="line-clamp-2">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial Summary */}
              {(analysis.financialTerms.royaltyRate || analysis.financialTerms.advanceAmount) && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-green-500" />
                    Financial Terms
                  </p>
                  {analysis.financialTerms.royaltyRate && (
                    <p className="text-xs text-muted-foreground">
                      Royalty: <span className="text-foreground">{analysis.financialTerms.royaltyRate}</span>
                    </p>
                  )}
                  {analysis.financialTerms.advanceAmount && (
                    <p className="text-xs text-muted-foreground">
                      Advance: <span className="text-foreground">{analysis.financialTerms.advanceAmount}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => setStatus("idle")} variant="outline" size="sm" className="flex-1">
                  Analyze Another
                </Button>
                <a href="https://easyterms.io/signup" target="_blank" rel="noopener" className="flex-1">
                  <Button size="sm" className="w-full">
                    Get Full Analysis
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





