"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, CheckCircle } from "lucide-react";

interface SigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  signingUrl: string;
  contractTitle: string;
  onSigningComplete?: () => void;
}

export function SigningModal({
  isOpen,
  onClose,
  signingUrl,
  contractTitle,
  onSigningComplete,
}: SigningModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Listen for messages from the iframe (Documenso sends postMessage on completion)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from Documenso
      if (event.origin.includes("documenso.com")) {
        if (event.data?.type === "document-signed" || event.data?.status === "completed") {
          setShowSuccess(true);
          setTimeout(() => {
            onSigningComplete?.();
            onClose();
          }, 2000);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose, onSigningComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] m-4 bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              Sign: {contractTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={signingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in new tab
            </a>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-muted/20">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading signing page...</p>
              </div>
            </div>
          )}

          {showSuccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-card z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-medium text-foreground">Document Signed!</p>
                <p className="text-sm text-muted-foreground">Closing...</p>
              </div>
            </div>
          )}

          <iframe
            src={signingUrl}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            allow="camera; microphone"
            title="Sign Document"
          />
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 border-t border-border bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Complete the signing process above. The window will close automatically when done.
          </p>
        </div>
      </div>
    </div>
  );
}
