"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LICENSE_KEY =
  "U/xLAB01alTT1BqldY8IU+vHhk6uOf" +
  "Dx8y7BLVNh3Btt5nCuA7c6Du10mqlF" +
  "Cck3eAxELWJWOBzezzOXFVe2f41D5k" +
  "4jnrlY9VepJhEQEE+t2cRVby2+4HJh" +
  "BEg+GXv4z1lHrPUuuR6XaFnB2N4Q95" +
  "hX6QH/9vxfg491qs/iBcLhChjxFMGY" +
  "5NTXStkLqhc8Ayk1UKZu1S4BNdr4fM" +
  "VkYVlENP2utVP90A6mx1IvWE7K1fqz" +
  "QuoN6F/zx3Aao9ke+KfXJmTtxjRzza" +
  "ZeQ39ikVwTcIKsI0mNUNu7wOnbqi4x" +
  "ffsvplxXr8OjI8LrZsZy9cZnxD7vRi" +
  "4T6hnoErKbzA==\nU2NhbmJvdFNESw" +
  "psb2NhbGhvc3R8ZWFzeXRlcm1zLmFp" +
  "CjE3Njg1MjE1OTkKODM4ODYwNwo4\n";

interface DocumentScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
  className?: string;
}

export function DocumentScanner({
  onScanComplete,
  onClose,
  className,
}: DocumentScannerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanbotSDK, setScanbotSDK] = useState<any>(null);

  // Initialize Scanbot SDK
  useEffect(() => {
    let mounted = true;

    const initSDK = async () => {
      try {
        // Dynamic import for client-side only
        const ScanbotSDK = (await import("scanbot-web-sdk/ui")).default;

        await ScanbotSDK.initialize({
          licenseKey: LICENSE_KEY,
          enginePath: "/wasm/",
        });

        if (mounted) {
          setScanbotSDK(ScanbotSDK);
          setIsInitialized(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Failed to initialize Scanbot SDK:", err);
        if (mounted) {
          setError("Failed to initialize document scanner. Please try again.");
          setIsInitializing(false);
        }
      }
    };

    initSDK();

    return () => {
      mounted = false;
    };
  }, []);

  // Launch the document scanner
  const startScanning = useCallback(async () => {
    if (!scanbotSDK || !isInitialized) return;

    try {
      // Configure the document scanner
      const config = new scanbotSDK.UI.Config.DocumentScanningFlow();

      // Customize the scanner appearance
      config.palette = {
        sbColorPrimary: "#a855f7", // Purple theme
        sbColorOnPrimary: "#ffffff",
        sbColorSecondary: "#7c3aed",
        sbColorOnSecondary: "#ffffff",
      };

      // Launch the scanner
      const result = await scanbotSDK.UI.createDocumentScanner(config);

      if (result && result.document) {
        // Generate PDF from scanned document
        const pdfConfig = {
          pageSize: "A4",
          pageDirection: "AUTO",
        };

        const pdfResult = await scanbotSDK.generatePdfFromDocument(
          result.document,
          pdfConfig
        );

        if (pdfResult) {
          // Convert to Blob
          const pdfBlob = new Blob([pdfResult], { type: "application/pdf" });
          const fileName = `scanned-contract-${Date.now()}.pdf`;
          onScanComplete(pdfBlob, fileName);
        }
      }
    } catch (err) {
      console.error("Error during document scanning:", err);
      setError("Failed to scan document. Please try again.");
    }
  }, [scanbotSDK, isInitialized, onScanComplete]);

  // Auto-start scanning when initialized
  useEffect(() => {
    if (isInitialized && scanbotSDK) {
      startScanning();
    }
  }, [isInitialized, scanbotSDK, startScanning]);

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-sm text-red-500 text-center">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => { setError(null); startScanning(); }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Initializing scanner...</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Camera className="w-8 h-8 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Position your contract document in the camera view
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={startScanning}>
          <Camera className="w-4 h-4 mr-2" />
          Start Scanning
        </Button>
      </div>
    </div>
  );
}
