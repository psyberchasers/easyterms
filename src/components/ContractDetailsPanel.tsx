"use client";

import { useState } from "react";
import { ContractAnalysis } from "@/types/contract";
import { cn } from "@/lib/utils";
import { ChevronDown, X, Eye } from "lucide-react";

interface ContractDetailsPanelProps {
  analysis: ContractAnalysis;
  contractTitle: string;
  createdAt: string;
  status?: string;
  onHighlightText?: (text: string) => void;
  onClose?: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children, action }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="text-xs text-muted-foreground">{title}</span>
        <ChevronDown className={cn(
          "w-3 h-3 text-muted-foreground/60 transition-transform",
          isOpen && "rotate-180"
        )} />
        {action && <div className="ml-auto">{action}</div>}
      </button>
      {isOpen && (
        <div className="pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

interface PropertyRowProps {
  label: string;
  value: React.ReactNode;
  onClick?: () => void;
}

function PropertyRow({ label, value, onClick }: PropertyRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-1.5 min-h-[32px]",
        onClick && "cursor-pointer hover:bg-muted/30 transition-colors group"
      )}
      onClick={onClick}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground text-right">{value}</span>
        {onClick && (
          <Eye className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
}

export function ContractDetailsPanel({
  analysis,
  contractTitle,
  createdAt,
  status = "active",
  onHighlightText,
  onClose,
}: ContractDetailsPanelProps) {
  const riskColors = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-green-500",
  };

  const riskBgColors = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-green-500",
  };

  const statusDisplay = {
    active: { label: "Active", color: "text-green-500" },
    negotiating: { label: "Negotiating", color: "text-amber-500" },
    draft: { label: "Draft", color: "text-muted-foreground" },
  };

  const currentStatus = statusDisplay[status as keyof typeof statusDisplay] || statusDisplay.draft;

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Panel Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">Details</span>
        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta Section */}
        <CollapsibleSection title="Meta" defaultOpen>
          <div>
            <PropertyRow
              label="Name"
              value={contractTitle || analysis.contractType || "Contract"}
            />
            <PropertyRow
              label="Type"
              value={analysis.contractType || "Contract"}
            />
            <PropertyRow
              label="Status"
              value={<span className={currentStatus.color}>{currentStatus.label}</span>}
            />
            <PropertyRow
              label="Risk"
              value={
                <span className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-2 h-2 rounded-sm",
                    riskBgColors[analysis.overallRiskAssessment as keyof typeof riskBgColors] || riskBgColors.medium
                  )} />
                  <span className={riskColors[analysis.overallRiskAssessment as keyof typeof riskColors] || riskColors.medium}>
                    {analysis.overallRiskAssessment === "high" ? "High risk" :
                     analysis.overallRiskAssessment === "medium" ? "Medium risk" :
                     analysis.overallRiskAssessment === "low" ? "Low risk" : "Unknown"}
                  </span>
                </span>
              }
            />
            <PropertyRow
              label="Created"
              value={new Date(createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
            {analysis.termLength && (
              <PropertyRow label="Term" value={analysis.termLength} />
            )}
          </div>
        </CollapsibleSection>

        {/* Parties Section */}
        {(analysis.parties?.artist || analysis.parties?.label) && (
          <CollapsibleSection title="Parties" defaultOpen>
            <div>
              {analysis.parties?.artist && (
                <PropertyRow label="Artist" value={analysis.parties.artist} />
              )}
              {analysis.parties?.label && (
                <PropertyRow label="Label" value={analysis.parties.label} />
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Financial Terms Section */}
        {analysis.financialTerms && (
          <CollapsibleSection title="Financials" defaultOpen>
            <div>
              {analysis.financialTerms.royaltyRate && (
                <PropertyRow label="Royalty" value={analysis.financialTerms.royaltyRate} />
              )}
              {analysis.financialTerms.advanceAmount && (
                <PropertyRow label="Advance" value={analysis.financialTerms.advanceAmount} />
              )}
              {analysis.financialTerms.paymentSchedule && (
                <PropertyRow label="Payment" value={analysis.financialTerms.paymentSchedule} />
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Key Terms Section */}
        {analysis.keyTerms && analysis.keyTerms.length > 0 && (
          <CollapsibleSection title="Key Terms">
            <div>
              {analysis.keyTerms.slice(0, 8).map((term, i) => (
                <PropertyRow
                  key={i}
                  label={term.title}
                  value={
                    <span className={cn(
                      "text-xs",
                      riskColors[term.riskLevel as keyof typeof riskColors] || riskColors.medium
                    )}>
                      {term.riskLevel}
                    </span>
                  }
                  onClick={() => onHighlightText?.(term.originalText || term.content)}
                />
              ))}
              {analysis.keyTerms.length > 8 && (
                <div className="px-4 py-2">
                  <span className="text-xs text-muted-foreground">
                    +{analysis.keyTerms.length - 8} more
                  </span>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Concerns Section */}
        {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
          <CollapsibleSection title="Concerns">
            <div className="px-4 space-y-2">
              {analysis.potentialConcerns.map((concern, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 cursor-pointer hover:bg-muted/30 -mx-4 px-4 py-1.5 transition-colors group"
                  onClick={() => {
                    const snippet = analysis.concernSnippets?.[i];
                    if (snippet) onHighlightText?.(snippet);
                  }}
                >
                  <span className="w-2 h-2 rounded-sm bg-red-500 shrink-0 mt-1.5" />
                  <p className="text-sm text-foreground leading-relaxed flex-1">{concern}</p>
                  <Eye className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Recommendations Section */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <CollapsibleSection title="Recommendations">
            <div className="px-4 space-y-2">
              {analysis.recommendations.slice(0, 5).map((rec, i) => {
                const advice = typeof rec === 'object' ? rec.advice : rec;
                const priority = typeof rec === 'object' ? rec.priority : 'medium';

                return (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <span className={cn(
                      "w-2 h-2 rounded-sm shrink-0 mt-1.5",
                      priority === "high" ? "bg-red-500" :
                      priority === "low" ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <p className="text-sm text-foreground leading-relaxed">{advice}</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Summary Section */}
        <CollapsibleSection title="Summary">
          <div className="px-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
