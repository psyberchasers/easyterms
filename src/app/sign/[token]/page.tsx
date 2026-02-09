"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  PenTool,
  Shield,
  Clock,
  Loader2,
  Download,
} from "lucide-react";

interface SigningInfo {
  contractId: string;
  contractTitle: string;
  ownerName: string | null;
  ownerEmail: string | null;
  signerEmail: string;
  message: string | null;
  status: string;
  createdAt: string;
  pdfUrl: string | null;
}

export default function PublicSigningPage() {
  const params = useParams();
  const token = params.token as string;

  const [signingInfo, setSigningInfo] = useState<SigningInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const fetchSigningInfo = async () => {
      try {
        const response = await fetch(`/api/sign/${token}`);
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Invalid or expired signing link");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSigningInfo(data);
        setSigned(data.status === "signed" || data.status === "completed");
      } catch (err) {
        setError("Failed to load signing information");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSigningInfo();
    }
  }, [token]);

  const handleSign = async () => {
    if (!signature || !signingInfo) return;

    setSigning(true);
    try {
      const response = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      if (response.ok) {
        setSigned(true);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to sign document");
      }
    } catch (err) {
      setError("Failed to sign document");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !signingInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Unable to Load Document
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Document Signed!
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for signing "{signingInfo?.contractTitle}". All parties will receive a copy.
          </p>
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Sent by <span className="font-medium text-foreground">{signingInfo?.ownerName || signingInfo?.ownerEmail}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="EasyTerms"
              width={28}
              height={28}
              className="dark:invert"
            />
            <span className="font-semibold text-foreground">EasyTerms</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            Secure signing
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* PDF Preview */}
        <div className="flex-1 bg-muted/30 p-4 lg:p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">{signingInfo?.contractTitle}</h2>
            {signingInfo?.pdfUrl ? (
              <iframe
                src={signingInfo.pdfUrl}
                className="w-full h-[60vh] lg:h-[80vh] rounded-xl border border-border bg-white"
                title="Contract PDF"
              />
            ) : (
              <div className="h-[60vh] flex items-center justify-center bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">PDF preview not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Signing Panel */}
        <div className="lg:w-[400px] border-t lg:border-t-0 lg:border-l border-border bg-card p-6 shrink-0">
          <div className="space-y-6">
            {/* Info */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Sign Document</h3>
              <p className="text-sm text-muted-foreground">
                Requested by {signingInfo?.ownerName || signingInfo?.ownerEmail}
              </p>
            </div>

            {signingInfo?.message && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Message:</p>
                <p className="text-sm text-foreground">"{signingInfo.message}"</p>
              </div>
            )}

            {/* Signing as */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <PenTool className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Signing as</p>
                <p className="text-sm font-medium text-foreground">{signingInfo?.signerEmail}</p>
              </div>
            </div>

            {/* Signature Canvas */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Your Signature</p>
              <SignatureCanvas onSignatureChange={setSignature} />
            </div>

            {/* Sign Button */}
            <button
              onClick={handleSign}
              disabled={!signature || signing}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {signing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4" />
                  Sign Document
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              By signing, you agree to the{" "}
              <a href="/terms" className="underline">Terms of Service</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
