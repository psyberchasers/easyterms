"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileUploadIcon, DocumentAttachmentIcon } from "@hugeicons-pro/core-stroke-rounded";
import Lottie from "lottie-react";
import loadMusicAnimation from "@/../public/loadmusic.json";
import { cn } from "@/lib/utils";

type UploadStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

export default function DashboardUploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isHovering, setIsHovering] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animated phrases for loading
  const loadingPhrases = [
    "Reading contract terms",
    "Analyzing key clauses",
    "Checking risk factors",
    "Identifying obligations",
    "Reviewing financial terms",
  ];

  useEffect(() => {
    if (status === "uploading" || status === "analyzing") {
      const interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Animated dots component
  const AnimatedDots = () => (
    <span className="inline-flex">
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
      >.</motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      >.</motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
      >.</motion.span>
    </span>
  );

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setStatus("uploading");
    setFileName(file.name);
    setError("");

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

      // Save the contract if user is logged in
      if (user && data.analysis) {
        const saveFormData = new FormData();
        saveFormData.append("file", file);
        saveFormData.append("contractData", JSON.stringify({
          title: data.analysis.contractType || file.name,
          extractedText: "",
          analysis: data.analysis,
          contractType: data.analysis.contractType,
          overallRisk: data.analysis.overallRiskAssessment,
          industry: "music",
        }));

        const saveResponse = await fetch("/api/contracts/upload", {
          method: "POST",
          body: saveFormData,
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          // Redirect to the contract detail page
          router.push(`/contract/${saveData.contractId}`);
          return;
        }
      }

      setStatus("complete");
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStatus("error");
    }
  }, [user, router]);

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

  // Reset state
  const handleReset = () => {
    setStatus("idle");
    setFileName("");
    setError("");
  };

  // IDLE STATE - Upload Screen
  if (status === "idle") {
    return (
      <div
        className="h-full flex"
        style={{
          backgroundColor: '#fcfcfc',
          backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="w-full max-w-lg rounded-2xl py-16 px-10 text-center cursor-pointer"
            style={{
              border: isHovering ? '2.5px dashed #8b5cf6' : '2.5px dashed #c8cdd3',
              borderRadius: '16px',
              transition: 'border-color 0.3s ease',
              backgroundColor: '#fcfcfc'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-fit mx-auto mb-6" style={{ transition: 'color 0.3s ease' }}>
              <HugeiconsIcon icon={FileUploadIcon} size={40} style={{ color: isHovering ? '#8b5cf6' : '#d0d5dd', transition: 'color 0.3s ease' }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: '#c8cdd3' }}>
              Drag and Drop file here or{" "}
              <span className="underline underline-offset-2 hover:text-[#8b5cf6] transition-colors">
                Choose here
              </span>
            </p>
          </div>

          {/* Info below */}
          <div className="w-full max-w-lg flex justify-between items-center mt-4 px-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#c8cdd3' }}>PDF</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#c8cdd3' }}>DOC</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#c8cdd3' }}>DOCX</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#c8cdd3' }}>TXT</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#c8cdd3' }}>200 MB max</span>
          </div>
        </div>
      </div>
    );
  }

  // LOADING STATE
  if (status === "uploading" || status === "analyzing") {
    const currentStep = status === "uploading" ? 0 : 1;
    const steps = [
      { label: "Uploading", sublabel: "Securing your document" },
      { label: "Analyzing", sublabel: "Reading contract terms" },
      { label: "Generating", sublabel: "Building insights" },
    ];

    return (
      <div
        className="h-full flex items-center justify-center"
        style={{
          backgroundColor: '#fcfcfc',
          backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Music Loader with purple tint */}
          <div className="flex justify-center">
            <div className="w-32 h-32" style={{ filter: 'hue-rotate(290deg) saturate(2) brightness(1.1)' }}>
              <Lottie animationData={loadMusicAnimation} loop={true} />
            </div>
          </div>

          {/* Animated Status Text with Shimmer */}
          <div className="text-center h-8 relative overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.p
                key={phraseIndex}
                initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(4px)" }}
                transition={{
                  duration: 0.5,
                  ease: [0.32, 0.72, 0, 1]
                }}
                className="text-lg font-medium relative"
                style={{ color: '#565c65' }}
              >
                <span className="relative">
                  {loadingPhrases[phraseIndex]}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ mixBlendMode: 'overlay' }}
                  />
                </span>
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar - animated purple */}
          <div className="space-y-4">
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ backgroundColor: '#e5e6e7' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#8b5cf6' }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {/* Shimmer on progress bar */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Step Pills */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  )}
                  style={
                    i < currentStep
                      ? { backgroundColor: '#ede9fe', color: '#8b5cf6' }
                      : i === currentStep
                        ? { backgroundColor: '#e5e6e7', color: '#1a1a1a' }
                        : { color: '#9ca3af' }
                  }
                >
                  {i < currentStep ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : i === currentStep ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="w-3 h-3 flex items-center justify-center text-[10px]">{i + 1}</span>
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File Pill - darker, less rounded */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: '#e5e6e7' }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: '#d1d5db' }}>
                <HugeiconsIcon icon={DocumentAttachmentIcon} size={20} style={{ color: '#565c65' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: '#1a1a1a' }}>{fileName}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {status === "uploading" ? "Uploading" : "Analyzing"}<AnimatedDots />
                </p>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex justify-center">
            <p className="text-xs text-center" style={{ color: '#9ca3af' }}>
              Checking for 50+ common contract pitfalls
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (status === "error") {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#fcfcfc' }}>
        <div className="text-center space-y-4 max-w-md p-6 border rounded-lg" style={{ borderColor: '#e5e6e7' }}>
          <div className="w-12 h-12 rounded-lg border border-red-400/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">Analysis Failed</p>
            <p className="text-sm mt-1" style={{ color: '#565c65' }}>{error}</p>
          </div>
          <Button
            onClick={handleReset}
            className="rounded-md"
            style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // COMPLETE STATE - redirect should happen, but fallback
  return (
    <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#fcfcfc' }}>
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="text-foreground">Analysis complete! Redirecting...</p>
      </div>
    </div>
  );
}
