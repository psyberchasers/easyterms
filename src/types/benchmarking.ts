// Benchmarking types for deal comparison

import { IndustryType } from "@/config/industries";

// Normalized contract data for benchmarking (anonymized)
export interface BenchmarkData {
  id: string;
  industry: IndustryType;
  contractType: string;
  createdAt: Date;
  
  // Common metrics (all industries)
  totalValue?: number;
  termMonths?: number;
  exclusivity: boolean;
  
  // Music-specific
  royaltyRate?: number;
  advanceAmount?: number;
  territoryScope?: "worldwide" | "regional" | "local";
  
  // NIL-specific
  hourlyRate?: number;
  timeCommitmentHours?: number;
  complianceState?: string;
  
  // Creator-specific
  usageRightsDays?: number;
  whitelistingDays?: number;
  deliverableCount?: number;
  
  // Esports-specific
  baseSalary?: number;
  prizePoolSplit?: number;
  streamingRevShare?: number;
  
  // Freelance-specific
  paymentNetDays?: number;
  ipRetained: boolean;
  
  // Real Estate-specific
  monthlyRent?: number;
  securityDepositMonths?: number;
  
  // Metadata for k-anonymity grouping
  followerRange?: string; // "0-10k" | "10k-50k" | "50k-100k" | etc.
  experienceLevel?: "entry" | "mid" | "senior" | "star";
}

// Aggregated benchmark statistics
export interface BenchmarkStats {
  industry: IndustryType;
  contractType: string;
  sampleSize: number;
  lastUpdated: Date;
  
  metrics: {
    [key: string]: {
      min: number;
      max: number;
      median: number;
      average: number;
      percentile25: number;
      percentile75: number;
      percentile90: number;
    };
  };
}

// User's deal comparison result
export interface DealComparison {
  metric: string;
  label: string;
  yourValue: number | string;
  marketAverage: number | string;
  percentile: number; // 0-100, where 50 is average
  verdict: "excellent" | "good" | "average" | "below-average" | "poor";
  insight: string;
}

// Full benchmark report for a contract
export interface BenchmarkReport {
  industry: IndustryType;
  contractType: string;
  overallScore: number; // 0-100
  comparisons: DealComparison[];
  sampleSize: number;
  generatedAt: Date;
  
  // Key insights
  strengths: string[];
  weaknesses: string[];
  negotiationPoints: string[];
  
  // Data source indicator
  usingRealData?: boolean; // true if using real aggregated data, false if fallback
}

// Extracted values from contract analysis for benchmarking
export interface ExtractedBenchmarkValues {
  industry: IndustryType;
  contractType: string;
  
  // Numeric values extracted
  values: {
    [key: string]: number | string | boolean | undefined;
  };
  
  // Confidence in extraction (0-1)
  confidence: number;
}

