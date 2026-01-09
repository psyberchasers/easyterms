"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
  className?: string;
}

// Scanbot license key
const SCANBOT_LICENSE_KEY = "NnvGg+cUF3hPN6IyuC8X0P3xJF8eHn" +
  "TpP0m6xmfW1gy87n7FKLRxU5PwOcaL" +
  "5VcJSfqSG4DEcgqZMl8CDqqqZWHpLR" +
  "6cdbCcYVE5SBcR5WJaibKCLTEgxgJJ" +
  "JDEW/Fj5fLZj3IWSUT1hLqTYIYCNmz" +
  "PuyLCaAgbpcfZpw9f+gL3RE7qRqwJV" +
  "nNtZ5X8/I1kOhDdMxsNWb7+YIbrJnW" +
  "QIfEDnMCdBqUqFv5P6SFABKY4Gd7k8" +
  "k/jGDvHL67xTk/t9xDuoqv6rBT/s/B" +
  "V1ZVaLb1Qdj7CqWHvtwgSoZbtaki7U" +
  "fRVMUMgAm/gDVmgMDcPdQrqn4RMB6x" +
  "rHbvU2Sq3g==\nU2NhbmJvdFNESwps" +
  "b2NhbGhvc3R8ZWFzeXRlcm1zLmFpCj" +
  "E3NjYwMTU5OTkKODM4ODYwNwoz\n";

export function DocumentScanner({
  onScanComplete,
  onClose,
  className,
}: DocumentScannerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedPages, setScannedPages] = useState<any[]>([]);
  const sdkRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Scanbot SDK
  useEffect(() => {
    let mounted = true;

    const initSDK = async () => {
      try {
        const ScanbotSDK = (await import("scanbot-web-sdk")).default;

        const sdk = await ScanbotSDK.initialize({
          licenseKey: SCANBOT_LICENSE_KEY,
          enginePath: "/wasm/",
        });

        if (mounted) {
          sdkRef.current = sdk;
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Failed to initialize Scanbot SDK:", err);
        if (mounted) {
          setError("Failed to initialize scanner. Please try again.");
          setIsInitializing(false);
        }
      }
    };

    initSDK();

    return () => {
      mounted = false;
    };
  }, []);

  // Start scanning - just set state, useEffect will initialize camera
  const startScanning = () => {
    if (!sdkRef.current) return;
    setIsScanning(true);
    setError(null);
  };

  // Initialize camera when isScanning becomes true and container exists
  useEffect(() => {
    if (!isScanning || !sdkRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      try {
        const config = {
          containerId: "scanbot-scanner-container",
          onDocumentDetected: async (result: any) => {
            if (result.success && result.document) {
              setScannedPages((prev) => [...prev, result.document]);
            }
          },
          onError: (err: any) => {
            console.error("Scanner error:", err);
            setError("Scanner error occurred. Please try again.");
            setIsScanning(false);
          },
          style: {
            outline: {
              polygon: {
                fillCapturing: "rgba(168, 85, 247, 0.2)",
                strokeCapturing: "#a855f7",
                fillSearching: "rgba(168, 85, 247, 0.1)",
                strokeSearching: "#a855f7",
              },
            },
          },
          preferredCamera: "back",
          autoCaptureEnabled: true,
          autoCaptureSensitivity: 0.75,
        };

        await sdkRef.current.createDocumentScanner(config);
      } catch (err) {
        console.error("Failed to start scanner:", err);
        setError("Failed to start camera. Please check permissions.");
        setIsScanning(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isScanning]);

  // Stop scanning and create PDF
  const finishScanning = async () => {
    if (!sdkRef.current || scannedPages.length === 0) return;

    setIsScanning(false);

    try {
      // Create PDF from scanned pages
      const pdfGenerator = await sdkRef.current.beginPdf({
        pageSize: "A4",
        pageDirection: "PORTRAIT",
      });

      for (const page of scannedPages) {
        await pdfGenerator.addPage(page);
      }

      const pdfResult = await pdfGenerator.complete();
      const pdfBlob = new Blob([pdfResult], { type: "application/pdf" });
      const fileName = `scanned-contract-${Date.now()}.pdf`;

      onScanComplete(pdfBlob, fileName);
    } catch (err) {
      console.error("Failed to create PDF:", err);
      setError("Failed to create PDF. Please try again.");
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm text-muted-foreground">Initializing scanner...</p>
      </div>
    );
  }

  // Error state
  if (error && !isScanning) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-sm text-red-500 text-center">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setError(null);
              startScanning();
            }}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Scanning state
  if (isScanning) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div
          id="scanbot-scanner-container"
          ref={scannerContainerRef}
          className="w-full h-[400px] bg-black rounded-lg overflow-hidden"
        />
        <div className="p-4 space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            {scannedPages.length} page{scannedPages.length !== 1 ? "s" : ""} scanned
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsScanning(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={finishScanning}
              disabled={scannedPages.length === 0}
              className="flex-1 bg-purple-500 hover:bg-purple-600"
            >
              <FileText className="w-4 h-4 mr-2" />
              Create PDF ({scannedPages.length})
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - show start button
  return (
    <div className={cn("flex flex-col p-4", className)}>
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Camera className="w-8 h-8 text-purple-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Ready to scan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Position your document and tap Start
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={startScanning}
          className="flex-1 bg-purple-500 hover:bg-purple-600"
        >
          <Camera className="w-4 h-4 mr-2" />
          Start Scanning
        </Button>
      </div>
    </div>
  );
}
