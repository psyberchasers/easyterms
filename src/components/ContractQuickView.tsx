"use client";

import Link from "next/link";
import { Contract } from "@/types/database";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  FileText,
  ExternalLink,
  MoreVertical,
  X,
  Star,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  FileCheck,
  Scale,
  RefreshCw,
  Shield,
  Percent,
  Handshake,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Helper to parse summary into structured highlights
function SummaryHighlights({ summary }: { summary: string }) {
  // Split by sentences and try to categorize them
  const sentences = summary.split(/(?<=[.!?])\s+/).filter(s => s.trim());

  // Keywords to categorize sentences
  const categories = [
    {
      keywords: ['agreement', 'contract', 'between', 'parties', 'grant'],
      icon: Handshake,
      title: 'Agreement Type'
    },
    {
      keywords: ['rights', 'ownership', 'retain', 'exclusive', 'license', 'claim'],
      icon: Shield,
      title: 'Rights & Ownership'
    },
    {
      keywords: ['split', 'fee', 'payment', 'royalt', 'advance', 'percent', '%', '50/50'],
      icon: Percent,
      title: 'Financial Terms'
    },
    {
      keywords: ['term', 'renew', 'terminat', 'annual', 'year', 'notice', 'days'],
      icon: RefreshCw,
      title: 'Term & Renewal'
    },
    {
      keywords: ['approv', 'consent', 'response', 'hour', 'automatic'],
      icon: Clock,
      title: 'Approval Process'
    },
    {
      keywords: ['law', 'govern', 'jurisdiction', 'dispute', 'mediat', 'arbitrat', 'california', 'state'],
      icon: Scale,
      title: 'Legal & Jurisdiction'
    },
  ];

  // Categorize sentences
  const categorized: { icon: typeof Handshake; title: string; content: string }[] = [];
  const uncategorized: string[] = [];

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let matched = false;

    for (const cat of categories) {
      if (cat.keywords.some(kw => lowerSentence.includes(kw))) {
        // Check if this category already exists
        const existing = categorized.find(c => c.title === cat.title);
        if (existing) {
          existing.content += ' ' + sentence;
        } else {
          categorized.push({ icon: cat.icon, title: cat.title, content: sentence });
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      uncategorized.push(sentence);
    }
  });

  // If we couldn't categorize much, just show as paragraphs
  if (categorized.length < 2) {
    return (
      <p className="text-[15px] text-muted-foreground leading-relaxed">
        {summary}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {categorized.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground uppercase tracking-wide mb-0.5">
                {item.title}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ContractQuickViewProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleStar?: (contractId: string, isStarred: boolean) => void;
  versionCount?: number;
}

export function ContractQuickView({
  contract,
  open,
  onOpenChange,
  onToggleStar,
  versionCount = 0,
}: ContractQuickViewProps) {
  if (!contract) return null;

  const analysis = contract.analysis as {
    summary?: string;
    key_terms?: Array<{ term: string; explanation: string }>;
    overall_assessment?: string;
    contract_type?: string;
    parties?: { artist?: string; label?: string };
    financial_terms?: { royalty_rate?: string; advance?: string };
  } | null;

  const statusConfig = {
    active: { label: "Active", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    negotiating: { label: "Negotiating", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    draft: { label: "Draft", color: "bg-muted text-muted-foreground border-border" },
  };

  const riskConfig = {
    high: { label: "High Risk", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    medium: { label: "Medium Risk", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    low: { label: "Low Risk", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  };

  const status = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.draft;
  const risk = contract.overall_risk ? riskConfig[contract.overall_risk as keyof typeof riskConfig] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] p-0 flex flex-col overflow-hidden [&>button]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Dashboard</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-medium truncate max-w-[240px]">
              {contract.title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <Link href={`/contract/${contract.id}`}>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            </Link>
            <button
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Title Section */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border",
                contract.overall_risk === "high" ? "bg-red-500/10 border-red-500/20" :
                contract.overall_risk === "medium" ? "bg-amber-500/10 border-amber-500/20" :
                "bg-primary/10 border-primary/20"
              )}>
                <FileText className={cn(
                  "w-8 h-8",
                  contract.overall_risk === "high" ? "text-red-500" :
                  contract.overall_risk === "medium" ? "text-amber-500" :
                  "text-primary"
                )} />
              </div>

              {/* Title & Type */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-semibold text-foreground mb-1 leading-tight">
                  {contract.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {contract.contract_type || "Contract"}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg border",
                status.color
              )}>
                {status.label}
              </span>
              {risk && (
                <span className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-lg border",
                  risk.color
                )}>
                  {risk.label}
                </span>
              )}
              {versionCount > 0 && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-muted text-muted-foreground">
                  {versionCount + 1} versions
                </span>
              )}
            </div>
          </div>

          {/* Divider under tags */}
          <div className="border-t border-border" />

          {/* Summary Highlights */}
          <div className="px-6 py-6">
            {analysis?.summary ? (
              <SummaryHighlights summary={analysis.summary} />
            ) : (
              <p className="text-[15px] text-muted-foreground leading-relaxed">
                This contract has been uploaded for analysis. View the full contract for detailed insights and recommendations.
              </p>
            )}
          </div>

          <div className="mx-6 border-t border-border" />

          {/* Quick Stats List */}
          <div className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Overview</h3>
            <div className="space-y-3">
              {/* Created Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium text-foreground ml-auto">
                  {new Date(contract.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn(
                  "text-sm font-medium ml-auto",
                  contract.status === "active" ? "text-green-600" :
                  contract.status === "negotiating" ? "text-amber-600" :
                  "text-foreground"
                )}>
                  {status.label}
                </span>
              </div>

              {/* Risk Level */}
              {contract.overall_risk && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className={cn(
                    "w-4 h-4",
                    contract.overall_risk === "high" ? "text-red-500" :
                    contract.overall_risk === "medium" ? "text-amber-500" :
                    "text-green-500"
                  )} />
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <span className={cn(
                    "text-sm font-medium ml-auto",
                    contract.overall_risk === "high" ? "text-red-600" :
                    contract.overall_risk === "medium" ? "text-amber-600" :
                    "text-green-600"
                  )}>
                    {contract.overall_risk.charAt(0).toUpperCase() + contract.overall_risk.slice(1)}
                  </span>
                </div>
              )}

              {/* Starred */}
              <div className="flex items-center gap-3">
                <Star className={cn(
                  "w-4 h-4",
                  contract.is_starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                )} />
                <span className="text-sm text-muted-foreground">Starred</span>
                <button
                  onClick={() => onToggleStar?.(contract.id, contract.is_starred)}
                  className={cn(
                    "text-sm font-medium ml-auto transition-colors",
                    contract.is_starred ? "text-amber-600 hover:text-amber-500" : "text-foreground hover:text-primary"
                  )}
                >
                  {contract.is_starred ? "Yes" : "No"}
                </button>
              </div>
            </div>
          </div>

          {/* Key Terms Section */}
          {analysis?.key_terms && analysis.key_terms.length > 0 && (
            <>
              <div className="mx-6 border-t border-border" />
              <div className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-4">Key Terms</h3>
                <div className="space-y-3">
                  {analysis.key_terms.slice(0, 4).map((term, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <p className="text-sm font-medium text-foreground mb-1">{term.term}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{term.explanation}</p>
                    </div>
                  ))}
                </div>
                {analysis.key_terms.length > 4 && (
                  <Link
                    href={`/contract/${contract.id}`}
                    className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    View all {analysis.key_terms.length} terms
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Assessment */}
          {analysis?.overall_assessment && (
            <>
              <div className="mx-6 border-t border-border" />
              <div className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Assessment</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {analysis.overall_assessment}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted/30">
          <Link href={`/contract/${contract.id}`} className="block">
            <Button className="w-full rounded-xl h-11" variant="outline">
              <FileCheck className="w-4 h-4 mr-2" />
              Open Full Analysis
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
