export interface ContractClause {
  title: string;
  content: string;
  importance: "critical" | "important" | "standard";
  riskLevel: "high" | "medium" | "low";
  explanation: string;
  /** Text snippet to search for in original document */
  originalText?: string;
  /** AI-generated action items specific to this term */
  actionItems?: string[];
}

export interface ParagraphBreakdown {
  /** Original paragraph text */
  original: string;
  /** Plain English explanation */
  plainEnglish: string;
  /** Key points extracted */
  keyPoints?: string[];
  /** Risk level if any concerns */
  riskLevel?: "high" | "medium" | "low" | "none";
}

export interface FinancialTerms {
  advanceAmount?: string;
  royaltyRate?: string;
  recoupment?: string;
  paymentSchedule?: string;
  additionalNotes?: string;
}

export interface RightsAndOwnership {
  masterOwnership?: string;
  publishingRights?: string;
  territorialRights?: string;
  termLength?: string;
  exclusivity?: string;
  additionalNotes?: string;
}

export interface ObligationsAndDeliverables {
  artistObligations?: string[];
  labelObligations?: string[];
  deliverables?: string[];
  timeline?: string;
}

export interface Recommendation {
  advice: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  howToImplement: string;
}

export interface ContractAnalysis {
  summary: string;
  contractType: string;
  parties: {
    artist?: string;
    label?: string;
    publisher?: string;
    manager?: string;
    distributor?: string;
    brand?: string;
    team?: string;
    client?: string;
    landlord?: string;
    tenant?: string;
    individual?: string;
    company?: string;
    other?: string[];
  };
  effectiveDate?: string;
  termLength?: string;
  keyTerms: ContractClause[];
  financialTerms: FinancialTerms;
  rightsAndOwnership: RightsAndOwnership;
  obligationsAndDeliverables: ObligationsAndDeliverables;
  potentialConcerns: string[];
  /** Original text snippets for each concern (for highlighting) */
  concernSnippets?: string[];
  /** Recommendations - can be strings (legacy) or structured objects (new) */
  recommendations: (string | Recommendation)[];
  overallRiskAssessment: "high" | "medium" | "low";
  confidenceScore: number;
  /** Paragraph-by-paragraph breakdown */
  paragraphBreakdown?: ParagraphBreakdown[];
  /** Missing clauses detection */
  missingClauses?: {
    clause: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
  }[];
  /** Extracted key dates from contract */
  extractedDates?: {
    date: string; // YYYY-MM-DD format
    type: "option_period" | "termination_window" | "renewal" | "expiration" | "payment";
    description: string;
  }[];
}

export interface AnalysisState {
  status: "idle" | "uploading" | "parsing" | "analyzing" | "complete" | "error";
  progress: number;
  fileName?: string;
  error?: string;
  analysis?: ContractAnalysis;
  isDemo?: boolean;
}

