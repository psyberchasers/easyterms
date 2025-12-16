"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Copy,
  Check,
  Loader2,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  FileText,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractAnalysis } from "@/types/contract";

interface NegotiationAssistantProps {
  analysis: ContractAnalysis;
  contractTitle?: string;
}

// Pre-built negotiation templates
const TEMPLATES = {
  royalty: {
    title: "Request Higher Royalty Rate",
    template: `Dear [COUNTERPARTY],

Thank you for sending over the proposed agreement. After careful review, I would like to discuss the royalty rate provision.

The current offer of [CURRENT_RATE] is below what I've seen in comparable deals in the current market. Based on my [experience/catalog/following], I believe a rate of [TARGET_RATE] would be more appropriate and in line with industry standards.

I'm confident we can find terms that work for both parties. I look forward to discussing this further.

Best regards,
[YOUR NAME]`,
  },
  term: {
    title: "Negotiate Shorter Term",
    template: `Dear [COUNTERPARTY],

I appreciate the opportunity to work together. However, I have concerns about the proposed contract term of [CURRENT_TERM].

Given the rapidly evolving nature of the music industry, I would prefer a shorter initial term of [TARGET_TERM] with an option to renew if we're both satisfied with the partnership. This allows us to build a relationship while maintaining flexibility.

Would you be open to discussing this modification?

Best regards,
[YOUR NAME]`,
  },
  rights: {
    title: "Limit Rights Grant",
    template: `Dear [COUNTERPARTY],

Thank you for the proposed agreement. I'd like to discuss the scope of rights being requested.

The current language grants [CURRENT_RIGHTS], which is broader than I'm comfortable with at this stage. I propose limiting the grant to [PROPOSED_RIGHTS] with clear reversion terms if the works are not actively exploited within [TIMEFRAME].

This modification protects both parties' interests while allowing for a successful partnership.

Best regards,
[YOUR NAME]`,
  },
  audit: {
    title: "Add Audit Rights",
    template: `Dear [COUNTERPARTY],

I've reviewed the proposed agreement and noticed there is no provision for audit rights. This is a standard protection that I would like to include.

I propose adding the following clause:

"Artist shall have the right, upon reasonable notice and during normal business hours, to audit Company's books and records relating to this Agreement once per calendar year, at Artist's expense unless discrepancies exceeding 5% are discovered, in which case Company shall bear the audit costs."

This is industry-standard language that ensures transparency for both parties.

Best regards,
[YOUR NAME]`,
  },
  reversion: {
    title: "Add Reversion Clause",
    template: `Dear [COUNTERPARTY],

I would like to propose adding a reversion clause to the agreement. Specifically:

"In the event that the Works are not commercially released within [TIMEFRAME] of delivery, or if the Works fail to generate royalty income exceeding [MINIMUM_AMOUNT] in any consecutive 12-month period, all rights shall automatically revert to Artist."

This ensures that my works are actively promoted and don't remain in limbo. I believe this aligns both our interests toward successful exploitation of the material.

Best regards,
[YOUR NAME]`,
  },
};

export function NegotiationAssistant({ analysis, contractTitle }: NegotiationAssistantProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiDraft, setAiDraft] = useState("");

  // Identify high-risk items that need negotiation
  const highRiskTerms = analysis.keyTerms?.filter((t) => t.riskLevel === "high") || [];
  const concerns = analysis.potentialConcerns || [];

  const generateAIDraft = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          contractTitle,
          concerns: concerns.slice(0, 5),
          highRiskTerms: highRiskTerms.slice(0, 3),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const data = await response.json();
      setAiDraft(data.email);
      setCustomEmail(data.email);
    } catch (err) {
      console.error("AI generation error:", err);
      // Fallback to template-based generation
      const fallbackEmail = generateFallbackEmail();
      setAiDraft(fallbackEmail);
      setCustomEmail(fallbackEmail);
    } finally {
      setGenerating(false);
    }
  };

  const generateFallbackEmail = () => {
    const counterparty = analysis.parties?.label || analysis.parties?.publisher || "[COUNTERPARTY]";
    
    let email = `Dear ${counterparty},

Thank you for sending over the ${contractTitle || analysis.contractType || "proposed agreement"}. After careful review with my team, I would like to discuss several points before we proceed.

`;

    if (highRiskTerms.length > 0) {
      email += `**Key Concerns:**\n\n`;
      highRiskTerms.forEach((term, i) => {
        email += `${i + 1}. **${term.title}**: ${term.content}\n   - ${term.explanation || "I would like to negotiate more favorable terms here."}\n\n`;
      });
    }

    if (concerns.length > 0) {
      email += `**Additional Points for Discussion:**\n\n`;
      concerns.slice(0, 3).forEach((concern, i) => {
        email += `- ${concern}\n`;
      });
      email += `\n`;
    }

    email += `I believe we can find mutually beneficial terms that work for both parties. I'm available to discuss these points at your earliest convenience.

Best regards,
[YOUR NAME]`;

    return email;
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useTemplate = (key: keyof typeof TEMPLATES) => {
    setSelectedTemplate(key);
    setCustomEmail(TEMPLATES[key].template);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Counter-Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Draft Counter-Offer Email
              </DialogTitle>
              <DialogDescription>
                AI-generated email based on your contract's concerns
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!aiDraft && (
                <Button onClick={generateAIDraft} disabled={generating} className="w-full">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Draft
                    </>
                  )}
                </Button>
              )}

              {(aiDraft || customEmail) && (
                <>
                  <Textarea
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Your email will appear here..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCustomEmail("")}>
                      Clear
                    </Button>
                    <Button onClick={() => handleCopy(customEmail)}>
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items to Negotiate */}
      {highRiskTerms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              High-Priority Negotiation Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highRiskTerms.map((term, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium">{term.title}</span>
                    <p className="text-sm text-muted-foreground mt-1">{term.content}</p>
                  </div>
                  <Badge variant="outline" className="text-red-400 border-red-500/30 shrink-0">
                    High Risk
                  </Badge>
                </div>
                {term.explanation && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 {term.explanation}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Template Library */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Negotiation Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <Dialog key={key}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start gap-1 text-left w-full"
                    onClick={() => useTemplate(key as keyof typeof TEMPLATES)}
                  >
                    <span className="font-medium text-sm">{template.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      Click to customize...
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{template.title}</DialogTitle>
                    <DialogDescription>
                      Customize this template for your situation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={customEmail || template.template}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCustomEmail(template.template)}>
                        Reset
                      </Button>
                      <Button onClick={() => handleCopy(customEmail || template.template)}>
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Clipboard
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Negotiation Tips
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Always negotiate via email to maintain a paper trail</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Focus on 2-3 key issues rather than everything at once</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Propose specific alternatives, not just objections</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Consider having an entertainment attorney review before signing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Don't be afraid to walk away from a bad deal</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

