"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ContractAnalysis } from "@/types/contract";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  AlertTriangle,
} from "lucide-react";
import Lottie from "lottie-react";
import loadMusicAnimation from "@/../public/loadmusic.json";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ContractAnalysisView } from "@/components/ContractAnalysisView";
import { Button } from "@/components/ui/button";

// Loading phrases for animated text
const loadingPhrases = [
  "Reading contract terms",
  "Analyzing key clauses",
  "Checking risk factors",
  "Identifying obligations",
  "Reviewing financial terms",
];

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

const GUEST_REVIEW_LIMIT = 3;
const GUEST_REVIEWS_KEY = "easyterms_guest_reviews";

// Default missing clauses to check for
const DEFAULT_MISSING_CLAUSES = [
  { clause: "Audit Rights", severity: "critical" as const, description: "No provision allowing you to audit financial records" },
  { clause: "Reversion Clause", severity: "high" as const, description: "No automatic rights reversion if works are unexploited" },
  { clause: "Creative Control", severity: "medium" as const, description: "No approval rights over how your work is used" },
  { clause: "Termination for Cause", severity: "medium" as const, description: "Limited grounds specified for early termination" },
];

export default function AnalyzePage() {
  const { user } = useAuth();

  // Core state
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string>("");

  // Guest review tracking
  const [guestReviewsUsed, setGuestReviewsUsed] = useState(0);
  const guestReviewsRemaining = GUEST_REVIEW_LIMIT - guestReviewsUsed;

  // File state
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Version tracking (for logged-in users)
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
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  // Key dates (for logged-in users)
  interface ContractDate {
    id: string;
    date_type: string;
    date: string;
    description: string;
  }
  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Animated text phrase index
  const [phraseIndex, setPhraseIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cycle through loading phrases
  useEffect(() => {
    if (status === "uploading" || status === "analyzing") {
      const interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Load guest reviews count from localStorage
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem(GUEST_REVIEWS_KEY);
      if (stored) {
        setGuestReviewsUsed(parseInt(stored, 10) || 0);
      }
    }
  }, [user]);

  // Check for pending file from homepage upload
  useEffect(() => {
    const pendingFileData = sessionStorage.getItem("pendingFile");
    if (pendingFileData) {
      sessionStorage.removeItem("pendingFile");
      try {
        const { name, type, data } = JSON.parse(pendingFileData);
        const byteString = atob(data.split(",")[1]);
        const mimeType = type || "application/pdf";
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const file = new File([blob], name, { type: mimeType });
        handleFileSelect(file);
      } catch (err) {
        console.error("Error processing pending file:", err);
      }
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Check if guest has reviews remaining
    if (!user && guestReviewsUsed >= GUEST_REVIEW_LIMIT) {
      setError("You've used all your free reviews. Sign in for unlimited access.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setFileName(file.name);
    setOriginalFile(file);
    setError("");

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    try {
      setStatus("analyzing");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", "music");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();

      if (!data.analysis.missingClauses) {
        data.analysis.missingClauses = DEFAULT_MISSING_CLAUSES;
      }

      setAnalysis(data.analysis);
      setStatus("complete");

      // Track guest review usage
      if (!user) {
        const newCount = guestReviewsUsed + 1;
        setGuestReviewsUsed(newCount);
        localStorage.setItem(GUEST_REVIEWS_KEY, newCount.toString());
      }

      // Auto-save if user is logged in
      if (user && data.analysis) {
        saveContract(data.analysis, file);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStatus("error");
    }
  }, [user, guestReviewsUsed]);

  // Save contract
  const saveContract = useCallback(async (analysisData: ContractAnalysis, file: File) => {
    if (!user) return;

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contractData", JSON.stringify({
        title: analysisData.contractType || file.name,
        extractedText: "",
        analysis: analysisData,
        contractType: analysisData.contractType,
        overallRisk: analysisData.overallRiskAssessment,
        industry: "music",
      }));

      const response = await fetch("/api/contracts/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const data = await response.json();
      setSavedContractId(data.contractId);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Download report
  const handleDownloadReport = useCallback(async () => {
    if (!analysis) return;

    setDownloading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fileName || analysis.contractType || "Contract Analysis",
          analysis,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const html = await response.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  }, [analysis, fileName]);

  // Reset state
  const handleReset = () => {
    setStatus("idle");
    setAnalysis(null);
    setFileName("");
    setFileUrl("");
    setOriginalFile(null);
    setError("");
    setSavedContractId(null);
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Fetch versions for saved contract
  const fetchVersions = useCallback(async () => {
    if (!savedContractId) return;
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/contracts/${savedContractId}/versions`);
      const data = await response.json();
      if (response.ok && data.versions) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error("Error fetching versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  }, [savedContractId]);

  // Fetch dates for saved contract
  const fetchDates = useCallback(async () => {
    if (!savedContractId) return;
    setLoadingDates(true);
    try {
      const response = await fetch(`/api/contracts/${savedContractId}/dates`);
      const data = await response.json();
      if (response.ok && data.dates) {
        setDates(data.dates);
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
    } finally {
      setLoadingDates(false);
    }
  }, [savedContractId]);

  // Upload new version
  const uploadNewVersion = useCallback(async (file: File) => {
    if (!savedContractId) return;
    setUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/contracts/${savedContractId}/versions`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchVersions();
      }
    } catch (err) {
      console.error("Error uploading version:", err);
    } finally {
      setUploadingVersion(false);
    }
  }, [savedContractId, fetchVersions]);

  // Add date
  const addDate = useCallback(async (newDate: { date_type: string; date: string; description: string }) => {
    if (!savedContractId) return;
    try {
      const response = await fetch(`/api/contracts/${savedContractId}/dates`, {
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
  }, [savedContractId, fetchDates]);

  // Delete date
  const deleteDate = useCallback(async (dateId: string) => {
    if (!savedContractId) return;
    try {
      await fetch(`/api/contracts/${savedContractId}/dates?dateId=${dateId}`, {
        method: "DELETE",
      });
      setDates(dates.filter((d) => d.id !== dateId));
    } catch (err) {
      console.error("Error deleting date:", err);
    }
  }, [savedContractId, dates]);

  // Fetch versions and dates when contract is saved
  useEffect(() => {
    if (savedContractId) {
      fetchVersions();
      fetchDates();
    }
  }, [savedContractId, fetchVersions, fetchDates]);

  // Guest banner component
  const GuestBanner = () => {
    if (user) return null;
    return (
      <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm text-purple-300">
            {guestReviewsRemaining > 0 ? (
              <>{guestReviewsRemaining} free review{guestReviewsRemaining !== 1 ? 's' : ''} remaining</>
            ) : (
              <>You've used all free reviews</>
            )}
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            Sign in for unlimited →
          </Link>
        </div>
      </div>
    );
  };

  // ============================================
  // IDLE STATE - Upload Screen
  // ============================================
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar showNewAnalysis={false} showSearch={false} />
        <div className="pt-14">
          <GuestBanner />
        </div>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-medium text-white mb-2">Upload Contract</h1>
              <p className="text-muted-foreground text-sm">
                Drop a file to get instant AI analysis
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-purple-500/50 hover:bg-purple-500/5 rounded-2xl p-10 text-center transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="p-4 rounded-2xl w-fit mx-auto mb-4 bg-muted/50 group-hover:bg-purple-500/10 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-purple-500 transition-colors" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Drop your contract here</p>
              <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
              <div className="flex justify-center gap-2">
                {["PDF", "Word", "TXT"].map((format) => (
                  <Badge key={format} variant="secondary" className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30">{format}</Badge>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (status === "uploading" || status === "analyzing") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-center">
            <div className="w-32 h-32">
              <Lottie animationData={loadMusicAnimation} loop={true} />
            </div>
          </div>

          {/* Animated Status Text - Rolling characters */}
          <div className="text-center h-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={phraseIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center text-lg font-medium text-muted-foreground"
              >
                {loadingPhrases[phraseIndex].split('').map((letter, index) => {
                  const centerIndex = Math.floor(loadingPhrases[phraseIndex].length / 2);
                  const distanceFromCenter = Math.abs(index - centerIndex);
                  const delay = distanceFromCenter * 0.03;
                  const rollDuration = 0.15 + distanceFromCenter * 0.08;
                  const numberOfRolls = Math.floor(1.5 / rollDuration);
                  const totalMovement = numberOfRolls * 1.2;

                  return (
                    <div
                      key={index}
                      className="relative inline-block overflow-hidden"
                      style={{ height: "1.2em" }}
                    >
                      <motion.span
                        className="flex flex-col"
                        initial={{ y: 0 }}
                        animate={{ y: `-${totalMovement}em` }}
                        transition={{
                          duration: 1.5,
                          ease: [0.15, 1, 0.1, 1],
                          delay: delay,
                        }}
                      >
                        {Array(numberOfRolls + 2)
                          .fill(null)
                          .map((_, copyIndex) => (
                            <span
                              key={copyIndex}
                              className="flex shrink-0 items-center justify-center"
                              style={{ height: "1.2em" }}
                            >
                              {letter === ' ' ? '\u00A0' : letter}
                            </span>
                          ))}
                      </motion.span>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-6 border border-border rounded-lg">
          <div className="w-12 h-12 rounded-lg border border-red-400/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-base font-medium text-white">Analysis Failed</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-border"
            >
              Try Again
            </Button>
            {!user && (
              <Button asChild className="bg-purple-500 hover:bg-purple-600">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // COMPLETE STATE - Use ContractAnalysisView
  // ============================================
  if (!analysis) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar showBorder showSearch={!!user} />
      <div className="pt-14">
        <GuestBanner />
      </div>

      <div className="flex-1 overflow-hidden">
        <ContractAnalysisView
          analysis={analysis}
          fileName={fileName}
          fileUrl={fileUrl}
          contractId={savedContractId}
          onReset={handleReset}
          onDownloadReport={handleDownloadReport}
          originalFile={originalFile}
          saving={saving}
          versions={versions}
          loadingVersions={loadingVersions}
          uploadingVersion={uploadingVersion}
          onUploadVersion={uploadNewVersion}
          dates={dates}
          loadingDates={loadingDates}
          onAddDate={addDate}
          onDeleteDate={deleteDate}
        />
      </div>
    </div>
  );
}
