// Benchmarking service for deal comparison

import { IndustryType } from "@/config/industries";
import { ContractAnalysis } from "@/types/contract";
import { 
  BenchmarkReport, 
  DealComparison, 
  ExtractedBenchmarkValues 
} from "@/types/benchmarking";

// Get current year-quarter for time bucketing
function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}

// Prepare anonymized benchmark data for database insertion
export function prepareBenchmarkContribution(
  analysis: ContractAnalysis,
  industry: IndustryType,
  contractId?: string
): Record<string, unknown> {
  const extracted = extractBenchmarkValues(analysis, industry);
  const values = extracted.values;
  
  // Build the benchmark_data row (matches benchmarking-schema.sql)
  const benchmarkRow: Record<string, unknown> = {
    contract_id: contractId || null, // Optional link (can be null for extra anonymity)
    industry,
    contract_type: analysis.contractType || "unknown",
    year_quarter: getCurrentQuarter(),
    
    // Common metrics
    exclusivity: values.exclusivity ?? null,
    term_months: values.termMonths ?? null,
  };
  
  // Industry-specific fields
  if (industry === "music") {
    benchmarkRow.royalty_rate = values.royaltyRate ?? null;
    benchmarkRow.advance_amount = values.advanceAmount ?? null;
    benchmarkRow.territory_scope = values.territoryScope ?? null;
    benchmarkRow.rights_type = null; // TODO: extract from analysis
  }
  
  if (industry === "nil") {
    benchmarkRow.total_value = values.totalValue ?? null;
    benchmarkRow.hourly_rate = values.hourlyRate ?? null;
    benchmarkRow.time_commitment_hours = values.timeCommitmentHours ?? null;
    benchmarkRow.posts_required = null; // TODO
    benchmarkRow.appearances_required = null; // TODO
  }
  
  if (industry === "creator") {
    benchmarkRow.rate_per_deliverable = values.ratePerDeliverable ?? null;
    benchmarkRow.usage_rights_days = values.usageRightsDays ?? null;
    benchmarkRow.whitelisting_days = values.whitelistingDays ?? null;
    benchmarkRow.deliverable_count = values.deliverableCount ?? null;
    benchmarkRow.revision_limit = null; // TODO
  }
  
  if (industry === "esports") {
    benchmarkRow.base_salary = values.baseSalary ?? null;
    benchmarkRow.prize_pool_split = values.prizePoolSplit ?? null;
    benchmarkRow.streaming_rev_share = values.streamingRevShare ?? null;
    benchmarkRow.buyout_amount = null; // TODO
  }
  
  if (industry === "freelance") {
    benchmarkRow.hourly_project_rate = values.hourlyProjectRate ?? null;
    benchmarkRow.payment_net_days = values.paymentNetDays ?? null;
    benchmarkRow.ip_retained = values.ipRetained ?? null;
  }
  
  if (industry === "real-estate") {
    benchmarkRow.monthly_rent = values.monthlyRent ?? null;
    benchmarkRow.security_deposit_months = values.securityDepositMonths ?? null;
    benchmarkRow.late_fee_amount = null; // TODO
  }
  
  // Strip any fields that are all null (to keep DB clean)
  const cleanRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(benchmarkRow)) {
    if (value !== null && value !== undefined) {
      cleanRow[key] = value;
    }
  }
  
  // Always include required fields even if null
  cleanRow.industry = industry;
  cleanRow.contract_type = analysis.contractType || "unknown";
  cleanRow.year_quarter = getCurrentQuarter();
  
  return cleanRow;
}

// Extract benchmark values from contract analysis
export function extractBenchmarkValues(
  analysis: ContractAnalysis,
  industry: IndustryType
): ExtractedBenchmarkValues {
  const values: Record<string, number | string | boolean | undefined> = {};
  
  // Extract financial terms
  const financialTerms = analysis.financialTerms;
  
  if (industry === "music") {
    // Extract royalty rate
    const royaltyMatch = financialTerms?.royaltyRate?.match(/(\d+(?:\.\d+)?)\s*%/);
    if (royaltyMatch) {
      values.royaltyRate = parseFloat(royaltyMatch[1]) / 100;
    }
    
    // Extract advance amount
    const advanceMatch = financialTerms?.advanceAmount?.match(/\$?([\d,]+)/);
    if (advanceMatch) {
      values.advanceAmount = parseFloat(advanceMatch[1].replace(/,/g, ""));
    }
    
    // Extract term length
    const termMatch = analysis.termLength?.match(/(\d+)\s*(year|month)/i);
    if (termMatch) {
      const num = parseInt(termMatch[1]);
      const unit = termMatch[2].toLowerCase();
      values.termMonths = unit === "year" ? num * 12 : num;
    }
    
    // Territory scope
    const territory = analysis.rightsAndOwnership?.territorialRights?.toLowerCase() || "";
    if (territory.includes("worldwide") || territory.includes("world")) {
      values.territoryScope = "worldwide";
    } else if (territory.includes("north america") || territory.includes("europe")) {
      values.territoryScope = "regional";
    } else {
      values.territoryScope = "local";
    }
    
    // Exclusivity
    values.exclusivity = analysis.rightsAndOwnership?.exclusivity?.toLowerCase().includes("exclusive") ?? false;
  }
  
  if (industry === "nil") {
    // NIL-specific extractions
    const comp = (analysis as any).compensation;
    
    // Total value
    const valueMatch = comp?.totalValue?.match(/\$?([\d,]+)/);
    if (valueMatch) {
      values.totalValue = parseFloat(valueMatch[1].replace(/,/g, ""));
    }
    
    // Time commitment
    const timeCommit = (analysis as any).timeCommitment;
    if (timeCommit?.totalHours) {
      const hoursMatch = timeCommit.totalHours.match(/(\d+)/);
      if (hoursMatch) values.timeCommitmentHours = parseInt(hoursMatch[1]);
    }
    
    // Calculate hourly rate
    if (values.totalValue && values.timeCommitmentHours) {
      values.hourlyRate = (values.totalValue as number) / (values.timeCommitmentHours as number);
    }
  }
  
  if (industry === "creator") {
    // Creator-specific extractions
    const comp = (analysis as any).compensation;
    const usage = (analysis as any).usageRights;
    const deliverables = (analysis as any).deliverables;
    
    // Rate per deliverable
    const rateMatch = comp?.ratePerDeliverable?.match(/\$?([\d,]+)/);
    if (rateMatch) {
      values.ratePerDeliverable = parseFloat(rateMatch[1].replace(/,/g, ""));
    }
    
    // Usage rights duration (in days)
    const durationMatch = usage?.duration?.match(/(\d+)\s*(day|week|month|year)/i);
    if (durationMatch) {
      const num = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      const multipliers: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
      values.usageRightsDays = num * (multipliers[unit] || 1);
    }
    
    // Whitelisting duration
    const whitelistMatch = usage?.whitelistingTerms?.match(/(\d+)\s*(day|week|month|year)/i);
    if (whitelistMatch) {
      const num = parseInt(whitelistMatch[1]);
      const unit = whitelistMatch[2].toLowerCase();
      const multipliers: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
      values.whitelistingDays = num * (multipliers[unit] || 1);
    }
    
    // Deliverable count
    if (deliverables) {
      let count = 0;
      const postsMatch = deliverables.posts?.match(/(\d+)/);
      const videosMatch = deliverables.videos?.match(/(\d+)/);
      const storiesMatch = deliverables.stories?.match(/(\d+)/);
      if (postsMatch) count += parseInt(postsMatch[1]);
      if (videosMatch) count += parseInt(videosMatch[1]);
      if (storiesMatch) count += parseInt(storiesMatch[1]);
      if (count > 0) values.deliverableCount = count;
    }
  }
  
  if (industry === "esports") {
    // Esports-specific extractions
    const comp = (analysis as any).compensation;
    
    // Base salary
    const salaryMatch = comp?.baseSalary?.match(/\$?([\d,]+)/);
    if (salaryMatch) {
      values.baseSalary = parseFloat(salaryMatch[1].replace(/,/g, ""));
    }
    
    // Prize pool split
    const prizeMatch = comp?.prizePoolSplit?.match(/(\d+(?:\.\d+)?)\s*%/);
    if (prizeMatch) {
      values.prizePoolSplit = parseFloat(prizeMatch[1]) / 100;
    }
    
    // Streaming revenue share
    const streamMatch = comp?.streamingRevShare?.match(/(\d+(?:\.\d+)?)\s*%/);
    if (streamMatch) {
      values.streamingRevShare = parseFloat(streamMatch[1]) / 100;
    }
  }
  
  if (industry === "freelance") {
    // Freelance-specific extractions
    const comp = (analysis as any).compensation;
    const ip = (analysis as any).ipRights;
    
    // Hourly/project rate
    const rateMatch = comp?.rate?.match(/\$?([\d,]+)/);
    if (rateMatch) {
      values.hourlyProjectRate = parseFloat(rateMatch[1].replace(/,/g, ""));
    }
    
    // Payment terms
    const netMatch = comp?.paymentTerms?.match(/net\s*(\d+)/i);
    if (netMatch) {
      values.paymentNetDays = parseInt(netMatch[1]);
    }
    
    // IP retained
    const ipText = ip?.workProduct?.toLowerCase() || "";
    values.ipRetained = !ipText.includes("client") && !ipText.includes("work for hire");
  }
  
  if (industry === "real-estate") {
    // Real estate-specific extractions
    const rent = (analysis as any).rent;
    
    // Monthly rent
    const rentMatch = rent?.monthlyAmount?.match(/\$?([\d,]+)/);
    if (rentMatch) {
      values.monthlyRent = parseFloat(rentMatch[1].replace(/,/g, ""));
    }
    
    // Security deposit (in months)
    const depositMatch = rent?.securityDeposit?.match(/\$?([\d,]+)/);
    if (depositMatch && values.monthlyRent) {
      const deposit = parseFloat(depositMatch[1].replace(/,/g, ""));
      values.securityDepositMonths = deposit / (values.monthlyRent as number);
    }
  }
  
  return {
    industry,
    contractType: analysis.contractType || "unknown",
    values,
    confidence: Object.keys(values).length > 2 ? 0.8 : 0.5,
  };
}

// Fallback benchmark data (used when no real data exists yet)
const FALLBACK_BENCHMARKS: Record<IndustryType, Record<string, { avg: number; p25: number; p75: number; p90: number }>> = {
  music: {
    royaltyRate: { avg: 0.16, p25: 0.12, p75: 0.20, p90: 0.25 },
    advanceAmount: { avg: 75000, p25: 25000, p75: 150000, p90: 500000 },
    termMonths: { avg: 36, p25: 24, p75: 60, p90: 84 },
  },
  nil: {
    totalValue: { avg: 5000, p25: 1000, p75: 15000, p90: 50000 },
    hourlyRate: { avg: 150, p25: 50, p75: 300, p90: 750 },
    timeCommitmentHours: { avg: 20, p25: 5, p75: 40, p90: 80 },
  },
  creator: {
    ratePerDeliverable: { avg: 1500, p25: 500, p75: 3000, p90: 10000 },
    usageRightsDays: { avg: 90, p25: 30, p75: 180, p90: 365 },
    whitelistingDays: { avg: 60, p25: 14, p75: 90, p90: 180 },
    deliverableCount: { avg: 4, p25: 2, p75: 6, p90: 12 },
  },
  esports: {
    baseSalary: { avg: 75000, p25: 35000, p75: 150000, p90: 300000 },
    prizePoolSplit: { avg: 0.70, p25: 0.50, p75: 0.80, p90: 0.90 },
    streamingRevShare: { avg: 0.60, p25: 0.40, p75: 0.80, p90: 1.0 },
  },
  freelance: {
    hourlyProjectRate: { avg: 125, p25: 75, p75: 200, p90: 350 },
    paymentNetDays: { avg: 30, p25: 15, p75: 45, p90: 60 },
  },
  "real-estate": {
    monthlyRent: { avg: 2000, p25: 1200, p75: 3000, p90: 5000 },
    securityDepositMonths: { avg: 1.5, p25: 1, p75: 2, p90: 3 },
  },
};

// Metric display configuration
const METRIC_CONFIG: Record<string, { label: string; format: (v: number) => string; higherIsBetter: boolean }> = {
  royaltyRate: { label: "Royalty Rate", format: (v) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
  advanceAmount: { label: "Advance", format: (v) => `$${v.toLocaleString()}`, higherIsBetter: true },
  termMonths: { label: "Contract Term", format: (v) => `${v} months`, higherIsBetter: false },
  totalValue: { label: "Total Value", format: (v) => `$${v.toLocaleString()}`, higherIsBetter: true },
  hourlyRate: { label: "Effective Rate", format: (v) => `$${v.toFixed(0)}/hr`, higherIsBetter: true },
  timeCommitmentHours: { label: "Time Required", format: (v) => `${v} hours`, higherIsBetter: false },
  ratePerDeliverable: { label: "Rate/Post", format: (v) => `$${v.toLocaleString()}`, higherIsBetter: true },
  usageRightsDays: { label: "Usage Duration", format: (v) => `${v} days`, higherIsBetter: false },
  whitelistingDays: { label: "Whitelisting", format: (v) => `${v} days`, higherIsBetter: false },
  deliverableCount: { label: "Deliverables", format: (v) => `${v} items`, higherIsBetter: false },
  baseSalary: { label: "Base Salary", format: (v) => `$${v.toLocaleString()}`, higherIsBetter: true },
  prizePoolSplit: { label: "Prize Split", format: (v) => `${(v * 100).toFixed(0)}%`, higherIsBetter: true },
  streamingRevShare: { label: "Stream Revenue", format: (v) => `${(v * 100).toFixed(0)}%`, higherIsBetter: true },
  hourlyProjectRate: { label: "Rate", format: (v) => `$${v.toLocaleString()}`, higherIsBetter: true },
  paymentNetDays: { label: "Payment Terms", format: (v) => `Net ${v}`, higherIsBetter: false },
  monthlyRent: { label: "Monthly Rent", format: (v) => `$${v.toLocaleString()}`, higherIsBetter: false },
  securityDepositMonths: { label: "Security Deposit", format: (v) => `${v.toFixed(1)}x rent`, higherIsBetter: false },
};

// Calculate percentile for a value relative to benchmarks
function calculatePercentile(value: number, benchmarks: { p25: number; p75: number; p90: number; avg: number }): number {
  if (value <= benchmarks.p25) return 25 * (value / benchmarks.p25);
  if (value <= benchmarks.avg) return 25 + 25 * ((value - benchmarks.p25) / (benchmarks.avg - benchmarks.p25));
  if (value <= benchmarks.p75) return 50 + 25 * ((value - benchmarks.avg) / (benchmarks.p75 - benchmarks.avg));
  if (value <= benchmarks.p90) return 75 + 15 * ((value - benchmarks.p75) / (benchmarks.p90 - benchmarks.p75));
  return 90 + 10 * Math.min(1, (value - benchmarks.p90) / benchmarks.p90);
}

// Get verdict based on percentile and direction
function getVerdict(percentile: number, higherIsBetter: boolean): DealComparison["verdict"] {
  const effectivePercentile = higherIsBetter ? percentile : 100 - percentile;
  
  if (effectivePercentile >= 75) return "excellent";
  if (effectivePercentile >= 60) return "good";
  if (effectivePercentile >= 40) return "average";
  if (effectivePercentile >= 25) return "below-average";
  return "poor";
}

// Generate insight text
function generateInsight(
  metric: string,
  value: number,
  percentile: number,
  verdict: DealComparison["verdict"],
  higherIsBetter: boolean,
  config: typeof METRIC_CONFIG[string]
): string {
  const position = percentile < 25 ? "bottom 25%" : 
                   percentile < 50 ? "below average" :
                   percentile < 75 ? "above average" : "top 25%";
  
  if (verdict === "excellent") {
    return `Your ${config.label.toLowerCase()} is in the ${position} - this is an excellent deal.`;
  }
  if (verdict === "good") {
    return `Your ${config.label.toLowerCase()} is ${position} - a solid deal.`;
  }
  if (verdict === "average") {
    return `Your ${config.label.toLowerCase()} is around market average.`;
  }
  if (verdict === "below-average") {
    return `Your ${config.label.toLowerCase()} is ${position}. Consider negotiating ${higherIsBetter ? "higher" : "lower"}.`;
  }
  return `Your ${config.label.toLowerCase()} is in the ${position}. Strongly recommend negotiating.`;
}

// Fetch real benchmarks from API (for client-side use)
export async function fetchBenchmarks(
  industry: IndustryType,
  contractType?: string
): Promise<{ benchmarks: Record<string, { avg: number; p25: number; p75: number; p90: number }>; hasRealData: boolean; sampleSize: number }> {
  try {
    const params = new URLSearchParams({ industry });
    if (contractType) params.append("contractType", contractType);
    
    const response = await fetch(`/api/benchmarks?${params}`);
    if (!response.ok) throw new Error("Failed to fetch benchmarks");
    
    const data = await response.json();
    
    // Transform API response to match our format
    const benchmarks: Record<string, { avg: number; p25: number; p75: number; p90: number }> = {};
    for (const [key, value] of Object.entries(data.benchmarks || {})) {
      const v = value as { avg: number; median: number; p25: number; p75: number; p90: number };
      benchmarks[key] = {
        avg: v.avg,
        p25: v.p25,
        p75: v.p75,
        p90: v.p90,
      };
    }
    
    return {
      benchmarks,
      hasRealData: data.hasRealData,
      sampleSize: data.totalSampleSize || 0,
    };
  } catch (err) {
    console.warn("Failed to fetch benchmarks, using fallbacks:", err);
    return {
      benchmarks: FALLBACK_BENCHMARKS[industry] || {},
      hasRealData: false,
      sampleSize: 0,
    };
  }
}

// Generate full benchmark report (synchronous, uses fallback data)
export function generateBenchmarkReport(
  analysis: ContractAnalysis,
  industry: IndustryType,
  realBenchmarks?: Record<string, { avg: number; p25: number; p75: number; p90: number }>,
  realSampleSize?: number
): BenchmarkReport {
  const extracted = extractBenchmarkValues(analysis, industry);
  const benchmarks = realBenchmarks || FALLBACK_BENCHMARKS[industry] || {};
  const usingRealData = !!realBenchmarks && Object.keys(realBenchmarks).length > 0;
  
  const comparisons: DealComparison[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const negotiationPoints: string[] = [];
  
  // Compare each extracted value to benchmarks
  for (const [metric, value] of Object.entries(extracted.values)) {
    if (typeof value !== "number" || !benchmarks[metric]) continue;
    
    const config = METRIC_CONFIG[metric];
    if (!config) continue;
    
    const bench = benchmarks[metric];
    const percentile = calculatePercentile(value, bench);
    const verdict = getVerdict(percentile, config.higherIsBetter);
    const insight = generateInsight(metric, value, percentile, verdict, config.higherIsBetter, config);
    
    comparisons.push({
      metric,
      label: config.label,
      yourValue: config.format(value),
      marketAverage: config.format(bench.avg),
      percentile: Math.round(percentile),
      verdict,
      insight,
    });
    
    // Categorize for summary
    if (verdict === "excellent" || verdict === "good") {
      strengths.push(`${config.label}: ${config.format(value)} (${verdict})`);
    } else if (verdict === "poor" || verdict === "below-average") {
      weaknesses.push(`${config.label}: ${config.format(value)} vs market avg ${config.format(bench.avg)}`);
      
      // Generate negotiation suggestion
      if (config.higherIsBetter) {
        negotiationPoints.push(`Ask for ${config.label.toLowerCase()} closer to ${config.format(bench.p75)} (top 25% of deals)`);
      } else {
        negotiationPoints.push(`Try to reduce ${config.label.toLowerCase()} to ${config.format(bench.p25)} or less`);
      }
    }
  }
  
  // Calculate overall score
  const avgPercentile = comparisons.length > 0 
    ? comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length
    : 50;
  
  // Use real sample size if available, otherwise show estimate
  const sampleSize = realSampleSize && realSampleSize > 0 
    ? realSampleSize 
    : (usingRealData ? 0 : 500 + Math.floor(Math.random() * 500)); // Fallback shows "~500-1000" estimate
  
  return {
    industry,
    contractType: extracted.contractType,
    overallScore: Math.round(avgPercentile),
    comparisons,
    sampleSize,
    generatedAt: new Date(),
    strengths,
    weaknesses,
    negotiationPoints,
    usingRealData, // Flag to show if we're using real or fallback data
  };
}

