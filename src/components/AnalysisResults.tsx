"use client";

import { ContractAnalysis, ContractClause } from "@/types/contract";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText,
  Scale,
  Shield,
  Lightbulb,
  Users,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisResultsProps {
  analysis: ContractAnalysis;
  isDemo?: boolean;
}

function getRiskColor(risk: string) {
  switch (risk) {
    case "high":
      return "bg-destructive/20 text-destructive border-destructive/30";
    case "medium":
      return "bg-warning/20 text-warning border-warning/30";
    case "low":
      return "bg-success/20 text-success border-success/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getImportanceColor(importance: string) {
  switch (importance) {
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "important":
      return "bg-primary text-primary-foreground";
    case "standard":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function RiskIndicator({ level }: { level: string }) {
  const colors = {
    high: "text-destructive",
    medium: "text-warning",
    low: "text-success",
  };

  const icons = {
    high: AlertTriangle,
    medium: AlertTriangle,
    low: CheckCircle2,
  };

  const Icon = icons[level as keyof typeof icons] || AlertTriangle;
  const color = colors[level as keyof typeof colors] || "text-muted-foreground";

  return (
    <div className={cn("flex items-center gap-1.5", color)}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium capitalize">{level} Risk</span>
    </div>
  );
}

function KeyTermCard({ term }: { term: ContractClause }) {
  return (
    <Card className="card-hover border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold">{term.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={getImportanceColor(term.importance)}>
              {term.importance}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">
          &ldquo;{term.content}&rdquo;
        </div>
        <p className="text-sm text-foreground leading-relaxed">{term.explanation}</p>
        <div className="pt-2">
          <RiskIndicator level={term.riskLevel} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalysisResults({ analysis, isDemo }: AnalysisResultsProps) {
  const confidencePercent = Math.round(analysis.confidenceScore * 100);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Demo Mode Warning */}
      {isDemo && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-warning">Demo Mode - Limited Analysis</p>
            <p className="text-sm text-muted-foreground mt-1">
              This analysis uses basic keyword detection only. For full AI-powered analysis with GPT-4, 
              add your OpenAI API key to <code className="px-1 py-0.5 rounded bg-muted">.env.local</code>
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">
              {analysis.contractType}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Contract Analysis Complete
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                analysis.overallRiskAssessment === "high" ? "text-destructive" :
                analysis.overallRiskAssessment === "medium" ? "text-warning" : "text-success"
              )}>
                {analysis.overallRiskAssessment.toUpperCase()}
              </div>
              <p className="text-xs text-muted-foreground">Overall Risk</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{confidencePercent}%</div>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>
        </div>

        {/* Parties */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Parties Involved</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.parties.artist && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Artist</p>
                  <p className="font-medium">{analysis.parties.artist}</p>
                </div>
              )}
              {analysis.parties.label && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Label</p>
                  <p className="font-medium">{analysis.parties.label}</p>
                </div>
              )}
              {analysis.parties.publisher && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Publisher</p>
                  <p className="font-medium">{analysis.parties.publisher}</p>
                </div>
              )}
            </div>
            {analysis.effectiveDate && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Effective: {analysis.effectiveDate}</span>
                {analysis.termLength && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Term: {analysis.termLength}</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card className="glow-amber border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>Executive Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="terms" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger value="terms" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
            <Scale className="w-4 h-4 mr-2" />
            Key Terms
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
            <DollarSign className="w-4 h-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="rights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
            <Shield className="w-4 h-4 mr-2" />
            Rights
          </TabsTrigger>
          <TabsTrigger value="obligations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
            <Target className="w-4 h-4 mr-2" />
            Obligations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6">
          <ScrollArea className="h-auto">
            <div className="grid gap-4">
              {analysis.keyTerms.map((term, index) => (
                <div
                  key={index}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <KeyTermCard term={term} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Financial Terms
              </CardTitle>
              <CardDescription>
                Breakdown of all monetary aspects of the agreement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysis.financialTerms.advanceAmount && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Advance Payment</h4>
                    <p className="text-foreground">{analysis.financialTerms.advanceAmount}</p>
                  </div>
                )}
                {analysis.financialTerms.royaltyRate && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Royalty Rates</h4>
                    <p className="text-foreground">{analysis.financialTerms.royaltyRate}</p>
                  </div>
                )}
                {analysis.financialTerms.recoupment && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Recoupment</h4>
                    <p className="text-foreground">{analysis.financialTerms.recoupment}</p>
                  </div>
                )}
                {analysis.financialTerms.paymentSchedule && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Payment Schedule</h4>
                    <p className="text-foreground">{analysis.financialTerms.paymentSchedule}</p>
                  </div>
                )}
                {analysis.financialTerms.additionalNotes && (
                  <div className="p-4 rounded-lg border border-primary/20 space-y-2">
                    <h4 className="font-semibold">Additional Notes</h4>
                    <p className="text-muted-foreground">{analysis.financialTerms.additionalNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rights" className="mt-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Rights & Ownership
              </CardTitle>
              <CardDescription>
                Who owns what and for how long
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {analysis.rightsAndOwnership.masterOwnership && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Master Ownership</h4>
                    <p className="text-foreground text-sm">{analysis.rightsAndOwnership.masterOwnership}</p>
                  </div>
                )}
                {analysis.rightsAndOwnership.publishingRights && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Publishing Rights</h4>
                    <p className="text-foreground text-sm">{analysis.rightsAndOwnership.publishingRights}</p>
                  </div>
                )}
                {analysis.rightsAndOwnership.territorialRights && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Territory</h4>
                    <p className="text-foreground text-sm">{analysis.rightsAndOwnership.territorialRights}</p>
                  </div>
                )}
                {analysis.rightsAndOwnership.exclusivity && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="font-semibold text-primary">Exclusivity</h4>
                    <p className="text-foreground text-sm">{analysis.rightsAndOwnership.exclusivity}</p>
                  </div>
                )}
              </div>
              {analysis.rightsAndOwnership.additionalNotes && (
                <div className="mt-4 p-4 rounded-lg border border-primary/20 space-y-2">
                  <h4 className="font-semibold">Additional Notes</h4>
                  <p className="text-muted-foreground text-sm">{analysis.rightsAndOwnership.additionalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obligations" className="mt-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Obligations & Deliverables
              </CardTitle>
              <CardDescription>
                What each party is required to do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {analysis.obligationsAndDeliverables.artistObligations && (
                  <AccordionItem value="artist">
                    <AccordionTrigger className="text-base">
                      Artist Obligations
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {analysis.obligationsAndDeliverables.artistObligations.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {analysis.obligationsAndDeliverables.labelObligations && (
                  <AccordionItem value="label">
                    <AccordionTrigger className="text-base">
                      Label/Publisher Obligations
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {analysis.obligationsAndDeliverables.labelObligations.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {analysis.obligationsAndDeliverables.deliverables && (
                  <AccordionItem value="deliverables">
                    <AccordionTrigger className="text-base">
                      Required Deliverables
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {analysis.obligationsAndDeliverables.deliverables.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
              {analysis.obligationsAndDeliverables.timeline && (
                <div className="mt-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold">Timeline</h4>
                  </div>
                  <p className="text-sm text-foreground">{analysis.obligationsAndDeliverables.timeline}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Concerns & Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Potential Concerns */}
        <Card className="border-destructive/20 bg-gradient-to-br from-card to-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Potential Concerns
            </CardTitle>
            <CardDescription>
              Issues that warrant attention or negotiation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.potentialConcerns.map((concern, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 text-sm animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-destructive font-bold shrink-0">{index + 1}</span>
                  <span className="text-foreground/90">{concern}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-success/20 bg-gradient-to-br from-card to-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </CardTitle>
            <CardDescription>
              Suggested actions and negotiation points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-success/5 text-sm animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Confidence */}
      <Card className="border-border/50 bg-card/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Analysis Confidence</span>
            <span className="text-sm text-muted-foreground">{confidencePercent}%</span>
          </div>
          <Progress value={confidencePercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-3">
            This analysis is based on the text extracted from your document. For complete legal advice, 
            please consult with a qualified entertainment attorney.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

