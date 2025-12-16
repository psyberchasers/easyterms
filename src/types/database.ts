export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "pro" | "team";
  contracts_this_month: number;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  title: string;
  file_name: string | null;
  file_url: string | null;
  file_type: string | null;
  extracted_text: string | null;
  analysis: ContractAnalysisJSON | null;
  contract_type: string | null;
  status: "active" | "expired" | "terminated" | "negotiating";
  overall_risk: "high" | "medium" | "low" | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  file_url: string | null;
  extracted_text: string | null;
  analysis: ContractAnalysisJSON | null;
  changes_summary: string | null;
  created_at: string;
}

export interface ContractDate {
  id: string;
  contract_id: string;
  date_type: "option_period" | "termination_window" | "renewal" | "expiration" | "payment";
  date: string;
  description: string | null;
  alert_days_before: number;
  alert_sent: boolean;
  created_at: string;
}

export interface Comparison {
  id: string;
  user_id: string;
  name: string | null;
  contract_ids: string[];
  diff_summary: Record<string, unknown> | null;
  created_at: string;
}

// Re-export the analysis type with a JSON-friendly name
import { ContractAnalysis } from "./contract";
export type ContractAnalysisJSON = ContractAnalysis;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      contracts: {
        Row: Contract;
        Insert: Omit<Contract, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Contract, "id" | "user_id" | "created_at">>;
      };
      contract_versions: {
        Row: ContractVersion;
        Insert: Omit<ContractVersion, "id" | "created_at">;
        Update: Partial<Omit<ContractVersion, "id" | "contract_id" | "created_at">>;
      };
      contract_dates: {
        Row: ContractDate;
        Insert: Omit<ContractDate, "id" | "created_at">;
        Update: Partial<Omit<ContractDate, "id" | "contract_id" | "created_at">>;
      };
      comparisons: {
        Row: Comparison;
        Insert: Omit<Comparison, "id" | "created_at">;
        Update: Partial<Omit<Comparison, "id" | "user_id" | "created_at">>;
      };
    };
  };
}




