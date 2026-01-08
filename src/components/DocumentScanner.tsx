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

// Domains covered by the license
const LICENSED_DOMAINS = ["localhost", "easyterms.ai"];

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
  const [trialMode, setTrialMode] = useState(false);

  // Initialize Scanbot SDK
  useEffect(() => {
    let mounted = true;

    const initSDK = async () => {
      try {
        console.log("[DocumentScanner] Starting SDK initialization...");

        // Dynamic import for client-side only
        const ScanbotSDK = (await import("scanbot-web-sdk/ui")).default;
        console.log("[DocumentScanner] SDK module loaded");

        // Check if current domain is covered by license
        const currentHost = window.location.hostname;
        const isLicensedDomain = LICENSED_DOMAINS.some(d => currentHost.includes(d));

        console.log("[DocumentScanner] Current host:", currentHost);
        console.log("[DocumentScanner] Is licensed domain:", isLicensedDomain);

        // Use license key for licensed domains, empty string (trial mode) for others
        const licenseToUse = isLicensedDomain ? LICENSE_KEY : "";

        if (!isLicensedDomain) {
          console.log("[DocumentScanner] Using 60-second trial mode for unlicensed domain");
          setTrialMode(true);
        }

        await ScanbotSDK.initialize({
          licenseKey: licenseToUse,
          enginePath: "/wasm/",
        });

        console.log("[DocumentScanner] SDK initialized successfully");

        if (mounted) {
          setScanbotSDK(ScanbotSDK);
          setIsInitialized(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("[DocumentScanner] Failed to initialize Scanbot SDK:", err);
        if (mounted) {
          setError(`Failed to initialize scanner: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    console.log("[DocumentScanner] startScanning called");
    console.log("[DocumentScanner] scanbotSDK:", !!scanbotSDK);
    console.log("[DocumentScanner] isInitialized:", isInitialized);

    if (!scanbotSDK || !isInitialized) {
      console.log("[DocumentScanner] SDK not ready, aborting scan");
      return;
    }

    try {
      console.log("[DocumentScanner] Creating scanner config...");

      // Configure the document scanner
      const config = new scanbotSDK.UI.Config.DocumentScanningFlow();

      // Customize the scanner appearance
      config.palette = {
        sbColorPrimary: "#a855f7", // Purple theme
        sbColorOnPrimary: "#ffffff",
        sbColorSecondary: "#7c3aed",
        sbColorOnSecondary: "#ffffff",
      };

      console.log("[DocumentScanner] Launching scanner UI...");

      // Launch the scanner
      const result = await scanbotSDK.UI.createDocumentScanner(config);

      console.log("[DocumentScanner] Scanner result:", result);

      if (result && result.document) {
        console.log("[DocumentScanner] Document captured, generating PDF...");

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
          console.log("[DocumentScanner] PDF generated successfully");
          // Convert to Blob
          const pdfBlob = new Blob([pdfResult], { type: "application/pdf" });
          const fileName = `scanned-contract-${Date.now()}.pdf`;
          onScanComplete(pdfBlob, fileName);
        }
      } else {
        console.log("[DocumentScanner] No document in result, user may have cancelled");
      }
    } catch (err) {
      console.error("[DocumentScanner] Error during document scanning:", err);
      setError(`Failed to scan document: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      {trialMode && (
        <p className="text-xs text-amber-500 text-center">
          Trial mode: 60 second limit per session
        </p>
      )}
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
