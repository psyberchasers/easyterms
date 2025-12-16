// Industry configurations for multi-vertical contract analysis

export type IndustryType = 
  | "music" 
  | "nil" 
  | "creator" 
  | "esports" 
  | "freelance" 
  | "real-estate";

export interface IndustryConfig {
  id: IndustryType;
  name: string;
  tagline: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color
  contractTypes: string[];
  keyMetrics: string[];
  redFlags: string[];
  description: string;
}

export const industries: Record<IndustryType, IndustryConfig> = {
  music: {
    id: "music",
    name: "Music",
    tagline: "Recording, Publishing & Sync Deals",
    icon: "Music2",
    color: "amber",
    contractTypes: [
      "Recording Agreement",
      "Publishing Deal",
      "Management Contract",
      "Sync License",
      "Distribution Deal",
      "Producer Agreement",
      "360 Deal",
    ],
    keyMetrics: [
      "Royalty Rate",
      "Advance Amount",
      "Term Length",
      "Territory",
      "Rights Ownership",
      "Recoupment Terms",
    ],
    redFlags: [
      "Perpetual rights",
      "Cross-collateralization",
      "360 deal terms",
      "Unfair royalty splits",
      "Excessive option periods",
      "Hidden deductions",
    ],
    description: "Analyze recording contracts, publishing deals, sync licenses, and management agreements.",
  },
  nil: {
    id: "nil",
    name: "NIL",
    tagline: "Name, Image & Likeness Deals",
    icon: "Trophy",
    color: "blue",
    contractTypes: [
      "NIL Endorsement",
      "Sponsorship Deal",
      "Appearance Agreement",
      "Social Media Partnership",
      "Autograph/Signing Deal",
      "Camp/Clinic Agreement",
    ],
    keyMetrics: [
      "Total Compensation",
      "Hourly Rate",
      "Time Commitment",
      "Exclusivity Scope",
      "Term Length",
      "Usage Rights",
    ],
    redFlags: [
      "NCAA compliance issues",
      "State law violations",
      "Excessive time demands",
      "Perpetual usage rights",
      "Broad exclusivity",
      "Hidden obligations",
    ],
    description: "Protect your eligibility. Check NIL deals against NCAA rules and state laws.",
  },
  creator: {
    id: "creator",
    name: "Creator",
    tagline: "Brand Deals & Sponsorships",
    icon: "Video",
    color: "pink",
    contractTypes: [
      "Brand Sponsorship",
      "Affiliate Agreement",
      "UGC Contract",
      "Whitelisting Deal",
      "MCN Agreement",
      "Licensing Deal",
    ],
    keyMetrics: [
      "Rate per Deliverable",
      "Usage Rights Duration",
      "Whitelisting Terms",
      "Exclusivity Period",
      "Content Ownership",
      "Revision Limits",
    ],
    redFlags: [
      "Perpetual whitelisting",
      "Unlimited usage rights",
      "Content ownership grab",
      "Excessive exclusivity",
      "Unclear revision scope",
      "Hidden ad spend requirements",
    ],
    description: "Analyze brand deals, sponsorships, and MCN contracts for YouTubers, streamers, and influencers.",
  },
  esports: {
    id: "esports",
    name: "Esports",
    tagline: "Team & Tournament Contracts",
    icon: "Gamepad2",
    color: "purple",
    contractTypes: [
      "Player Contract",
      "Streaming Agreement",
      "Tournament Contract",
      "Content Creator Deal",
      "Coaching Agreement",
      "Team Partnership",
    ],
    keyMetrics: [
      "Base Salary",
      "Prize Pool Split",
      "Streaming Revenue Share",
      "Housing/Benefits",
      "Buyout Clause",
      "Term Length",
    ],
    redFlags: [
      "Streaming jail clauses",
      "Unfair prize splits",
      "Bench pay reduction",
      "Excessive buyouts",
      "Content restrictions",
      "Non-compete breadth",
    ],
    description: "Understand player contracts, prize splits, and streaming rights before signing with a team.",
  },
  freelance: {
    id: "freelance",
    name: "Freelance",
    tagline: "Consulting & Contractor Agreements",
    icon: "Briefcase",
    color: "green",
    contractTypes: [
      "Consulting Agreement",
      "Independent Contractor",
      "Work for Hire",
      "Retainer Agreement",
      "NDA",
      "MSA",
    ],
    keyMetrics: [
      "Hourly/Project Rate",
      "Payment Terms",
      "IP Ownership",
      "Scope of Work",
      "Termination Notice",
      "Non-Compete Scope",
    ],
    redFlags: [
      "IP assignment overreach",
      "Side project claims",
      "Delayed payment terms",
      "Scope creep language",
      "Broad non-competes",
      "Unlimited revisions",
    ],
    description: "Protect your IP and ensure fair terms in consulting and contractor agreements.",
  },
  "real-estate": {
    id: "real-estate",
    name: "Real Estate",
    tagline: "Lease & Rental Agreements",
    icon: "Home",
    color: "orange",
    contractTypes: [
      "Residential Lease",
      "Commercial Lease",
      "Sublease Agreement",
      "Month-to-Month Rental",
      "Roommate Agreement",
    ],
    keyMetrics: [
      "Monthly Rent",
      "Security Deposit",
      "Lease Term",
      "Pet Deposit/Rent",
      "Late Fee Amount",
      "Notice Period",
    ],
    redFlags: [
      "Illegal clauses",
      "Excessive fees",
      "Security deposit violations",
      "Unreasonable entry rights",
      "Hidden charges",
      "Unfair termination terms",
    ],
    description: "Spot illegal clauses and hidden fees in your lease before you sign.",
  },
};

export const getIndustryConfig = (industry: IndustryType): IndustryConfig => {
  return industries[industry];
};

export const getAllIndustries = (): IndustryConfig[] => {
  return Object.values(industries);
};

