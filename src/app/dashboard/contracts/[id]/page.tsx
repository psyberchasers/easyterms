"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ContractAnalysis } from "@/types/contract";
import { Contract } from "@/types/database";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { MusicLoader } from "@/components/MusicLoader";
import { ContractAnalysisView } from "@/components/ContractAnalysisView";

interface ContractVersion {
  id: string;
  version_number: number;
  file_url: string;
  changes_summary: string;
  analysis: ContractAnalysis & {
    improvements?: string[];
    regressions?: string[];
  };
  created_at: string;
}

interface ContractDate {
  id: string;
  date_type: string;
  date: string;
  description: string;
}

interface ContractShare {
  id: string;
  shared_with_email: string;
  shared_with_user_id: string | null;
  permission: "view" | "comment" | "sign";
  status: "pending" | "viewed" | "signed" | "declined";
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const contractId = params.id as string;
  const initialTab = searchParams.get("tab") || "overview";

  // Contract data
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedFileUrl, setSignedFileUrl] = useState<string>("");

  // Version and date management
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [shares, setShares] = useState<ContractShare[]>([]);
  const [hasShares, setHasShares] = useState(false);

  // Fetch signed file URL
  const fetchSignedUrl = useCallback(async () => {
    if (!contractId) return;
    try {
      const response = await fetch(`/api/contracts/${contractId}/file`);
      if (response.ok) {
        const data = await response.json();
        setSignedFileUrl(data.url);
      }
    } catch (err) {
      console.error("Error fetching signed URL:", err);
    }
  }, [contractId]);

  // Fetch contract
  useEffect(() => {
    async function fetchContract() {
      if (!contractId) return;

      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", contractId)
          .single();

        if (error) {
          setError("Contract not found");
          return;
        }

        setContract(data as Contract);
        // Fetch signed URL after contract is loaded
        fetchSignedUrl();
      } catch (err) {
        setError("Failed to load contract");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchContract();
    }
  }, [contractId, authLoading, supabase, fetchSignedUrl]);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!contractId) return;
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  }, [contractId]);

  // Fetch dates
  const fetchDates = useCallback(async () => {
    if (!contractId) return;
    setLoadingDates(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/dates`);
      if (response.ok) {
        const data = await response.json();
        setDates(data.dates || []);
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
    } finally {
      setLoadingDates(false);
    }
  }, [contractId]);

  // Load versions and dates
  useEffect(() => {
    if (contractId) {
      fetchVersions();
      fetchDates();
    }
  }, [contractId, fetchVersions, fetchDates]);

  // Fetch shares with user info
  const fetchShares = useCallback(async () => {
    if (!contractId) return;
    try {
      const { data, error } = await supabase
        .from("contract_shares")
        .select("id, shared_with_email, shared_with_user_id, permission, status, created_at")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Fetch user profiles for shares using the API (bypasses RLS)
        const userIds = data.map((s: any) => s.shared_with_user_id).filter(Boolean);
        let userProfiles: Record<string, { full_name: string | null; email: string | null }> = {};

        // Fetch each profile via API
        await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const response = await fetch(`/api/users/${userId}/profile`);
              if (response.ok) {
                const profile = await response.json();
                userProfiles[userId] = { full_name: profile.full_name, email: profile.email };
              }
            } catch (e) {
              console.error("Error fetching profile:", e);
            }
          })
        );

        const sharesWithUsers = data.map((s: any) => ({
          ...s,
          user: s.shared_with_user_id ? userProfiles[s.shared_with_user_id] : null,
        }));

        setShares(sharesWithUsers);
        setHasShares(sharesWithUsers.length > 0);
      }
    } catch (err) {
      console.error("Error fetching shares:", err);
    }
  }, [contractId, supabase]);

  // Remove a share
  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from("contract_shares")
        .delete()
        .eq("id", shareId);

      if (!error) {
        setShares(prev => prev.filter(s => s.id !== shareId));
        setHasShares(shares.length > 1);
        toast.success("Access removed");
      }
    } catch (err) {
      console.error("Error removing share:", err);
      toast.error("Failed to remove access");
    }
  };

  // Fetch shares on load
  useEffect(() => {
    if (contractId) {
      fetchShares();
    }
  }, [contractId, fetchShares]);

  // Upload new version
  const handleUploadVersion = async (file: File) => {
    if (!contractId) return;
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchVersions();
        toast.success("New version uploaded successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to upload version");
      }
    } catch (err) {
      console.error("Error uploading version:", err);
    } finally {
      setUploadingVersion(false);
    }
  };

  // Add date
  const handleAddDate = async (newDate: { date_type: string; date: string; description: string }) => {
    if (!contractId) return;
    try {
      const response = await fetch(`/api/contracts/${contractId}/dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDate),
      });
      if (response.ok) {
        fetchDates();
      }
    } catch (err) {
      console.error("Error adding date:", err);
    }
  };

  // Delete date
  const handleDeleteDate = async (dateId: string) => {
    if (!contractId) return;
    try {
      await fetch(`/api/contracts/${contractId}/dates?dateId=${dateId}`, {
        method: "DELETE",
      });
      setDates(dates.filter((d) => d.id !== dateId));
    } catch (err) {
      console.error("Error deleting date:", err);
    }
  };

  // Download report
  const handleDownloadReport = async () => {
    if (!contract?.analysis) return;
    const analysis = contract.analysis as ContractAnalysis;

    const report = `CONTRACT ANALYSIS REPORT
========================

Contract: ${contract.title}
Analysis Date: ${new Date(contract.created_at).toLocaleDateString()}
Overall Risk: ${contract.overall_risk?.toUpperCase() || 'N/A'}

SUMMARY
-------
${analysis.summary}

KEY TERMS
---------
${analysis.keyTerms?.map(term => `
${term.title} (${term.riskLevel.toUpperCase()} RISK)
${term.content}
Explanation: ${term.explanation}
`).join('\n') || 'No key terms found.'}

FINANCIAL TERMS
---------------
Royalty Rate: ${analysis.financialTerms?.royaltyRate || 'N/A'}
Advance: ${analysis.financialTerms?.advanceAmount || 'N/A'}
Term Length: ${analysis.termLength || 'N/A'}
Payment Schedule: ${analysis.financialTerms?.paymentSchedule || 'N/A'}

POTENTIAL CONCERNS
------------------
${analysis.potentialConcerns?.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'No concerns identified.'}

RECOMMENDATIONS
---------------
${analysis.recommendations?.map((r, i) => {
  if (typeof r === 'string') return `${i + 1}. ${r}`;
  return `${i + 1}. ${r.advice}`;
}).join('\n') || 'No recommendations.'}

---
Generated by EasyTerms
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.title.replace(/[^a-z0-9]/gi, '_')}_analysis.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <MusicLoader />
      </div>
    );
  }

  // Error state
  if (error || !contract) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">{error || "Contract not found"}</p>
          <button
            onClick={() => router.push("/dashboard/contracts")}
            className="text-sm text-primary hover:underline"
          >
            Back to contracts
          </button>
        </div>
      </div>
    );
  }

  // No analysis data
  if (!contract.analysis) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">No analysis data available for this contract</p>
          <button
            onClick={() => router.push("/dashboard/contracts")}
            className="text-sm text-primary hover:underline"
          >
            Back to contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-12 bottom-10 left-0 right-0 md:left-[var(--sidebar-width)] overflow-hidden">
      <ContractAnalysisView
        analysis={contract.analysis as ContractAnalysis}
        fileName={contract.title}
        fileUrl={signedFileUrl}
        contractId={contract.id}
        onDownloadReport={handleDownloadReport}
        versions={versions}
        loadingVersions={loadingVersions}
        uploadingVersion={uploadingVersion}
        onUploadVersion={handleUploadVersion}
        dates={dates}
        loadingDates={loadingDates}
        onAddDate={handleAddDate}
        onDeleteDate={handleDeleteDate}
        showDiscussionTab={hasShares}
        canComment={true}
        initialTab={initialTab}
        shares={shares}
        onRemoveShare={handleRemoveShare}
      />
    </div>
  );
}
