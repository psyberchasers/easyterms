"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Cpu, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
  status: "uploading" | "parsing" | "analyzing";
  progress: number;
  fileName?: string;
}

const steps = [
  { key: "uploading", label: "Uploading", icon: FileText },
  { key: "parsing", label: "Parsing Document", icon: FileText },
  { key: "analyzing", label: "AI Analysis", icon: Cpu },
];

export function AnalysisProgress({ status, progress, fileName }: AnalysisProgressProps) {
  const currentStepIndex = steps.findIndex((s) => s.key === status);

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur animate-pulse-glow">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* File Info */}
          {fileName && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium truncate">{fileName}</span>
            </div>
          )}

          {/* Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isComplete && "bg-success text-success-foreground",
                        isCurrent && "bg-primary text-primary-foreground animate-pulse",
                        isPending && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isCurrent && "text-primary",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 w-16 mx-2 transition-colors duration-300",
                        index < currentStepIndex ? "bg-success" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {status === "uploading" && "Uploading document..."}
                {status === "parsing" && "Extracting text from document..."}
                {status === "analyzing" && "AI is analyzing your contract..."}
              </span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Status Message */}
          <p className="text-center text-sm text-muted-foreground">
            {status === "analyzing"
              ? "Our AI is reviewing your contract for key terms, financial details, and potential concerns..."
              : "Please wait while we process your document..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}





