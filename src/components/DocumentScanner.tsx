"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, FileText, AlertCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

interface DocumentScannerProps {
  onScanComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
  className?: string;
}

// Scanbot license key (valid for localhost and easyterms.ai)
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
  const [mode, setMode] = useState<"init" | "scanbot" | "native">("init");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const sdkRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Try to initialize Scanbot SDK, fall back to native if it fails
  useEffect(() => {
    let mounted = true;

    const initSDK = async () => {
      // Check if we're on a valid domain for Scanbot
      const hostname = window.location.hostname;
      const isValidDomain = hostname === "localhost" || hostname === "easyterms.ai" || hostname.endsWith(".easyterms.ai");

      if (!isValidDomain) {
        console.log("Not on valid Scanbot domain, using native camera");
        if (mounted) {
          setMode("native");
          setIsInitializing(false);
        }
        return;
      }

      try {
        const ScanbotSDK = (await import("scanbot-web-sdk")).default;

        const sdk = await ScanbotSDK.initialize({
          licenseKey: SCANBOT_LICENSE_KEY,
          enginePath: "/wasm/",
        });

        if (mounted) {
          sdkRef.current = sdk;
          setMode("scanbot");
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Scanbot SDK failed, falling back to native:", err);
        if (mounted) {
          setMode("native");
          setIsInitializing(false);
        }
      }
    };

    initSDK();

    return () => {
      mounted = false;
    };
  }, []);

  // Start Scanbot scanning
  const startScanbotScanning = () => {
    if (!sdkRef.current) return;
    setIsScanning(true);
    setError(null);
  };

  // Initialize Scanbot camera when isScanning becomes true
  useEffect(() => {
    if (!isScanning || mode !== "scanbot" || !sdkRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const config = {
          containerId: "scanbot-scanner-container",
          onDocumentDetected: async (result: any) => {
            if (result.success && result.document) {
              // Convert to base64 for storage
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx && result.document.blob) {
                const img = new Image();
                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                  setScannedPages((prev) => [...prev, dataUrl]);
                };
                img.src = URL.createObjectURL(result.document.blob);
              }
            }
          },
          onError: (err: any) => {
            console.error("Scanner error:", err);
            setError("Scanner error. Switching to basic camera.");
            setIsScanning(false);
            setMode("native");
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
        console.error("Failed to start Scanbot, falling back to native:", err);
        setError(null);
        setIsScanning(false);
        setMode("native");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isScanning, mode]);

  // Native camera capture
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setScannedPages((prev) => [...prev, imageData]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Remove a page
  const removePage = (index: number) => {
    setScannedPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Create PDF from scanned pages
  const createPDF = async () => {
    if (scannedPages.length === 0) return;

    setIsProcessing(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < scannedPages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const img = new Image();
        img.src = scannedPages[i];

        await new Promise<void>((resolve) => {
          img.onload = () => {
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;

            let width = pageWidth;
            let height = pageHeight;

            if (imgRatio > pageRatio) {
              height = pageWidth / imgRatio;
            } else {
              width = pageHeight * imgRatio;
            }

            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            pdf.addImage(scannedPages[i], "JPEG", x, y, width, height);
            resolve();
          };
        });
      }

      const pdfBlob = pdf.output("blob");
      const fileName = `scanned-contract-${Date.now()}.pdf`;
      onScanComplete(pdfBlob, fileName);
    } catch (error) {
      console.error("Error creating PDF:", error);
      setError("Failed to create PDF. Please try again.");
    } finally {
      setIsProcessing(false);
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

  // Scanbot scanning state
  if (mode === "scanbot" && isScanning) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div
          id="scanbot-scanner-container"
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
              Done
            </Button>
            <Button
              onClick={createPDF}
              disabled={scannedPages.length === 0 || isProcessing}
              className="flex-1 bg-purple-500 hover:bg-purple-600"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Create PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Native camera mode OR ready state with pages
  return (
    <div className={cn("flex flex-col p-4", className)}>
      {/* Hidden file input for native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCapture}
        className="hidden"
      />

      {/* Pages preview */}
      {scannedPages.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {scannedPages.map((page, index) => (
              <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                <img
                  src={page}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
              </div>
            ))}

            {/* Add more button */}
            <button
              onClick={() => {
                if (mode === "scanbot") {
                  startScanbotScanning();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs">Add page</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {scannedPages.length} page{scannedPages.length !== 1 ? "s" : ""} captured
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-purple-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {mode === "scanbot" ? "Ready to scan" : "Take photos of your contract"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "scanbot"
                ? "Auto-detect document edges"
                : "Capture each page, then create PDF"}
            </p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>

        {scannedPages.length === 0 ? (
          <Button
            onClick={() => {
              if (mode === "scanbot") {
                startScanbotScanning();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="flex-1 bg-purple-500 hover:bg-purple-600"
          >
            <Camera className="w-4 h-4 mr-2" />
            {mode === "scanbot" ? "Start Scanning" : "Take Photo"}
          </Button>
        ) : (
          <Button
            onClick={createPDF}
            disabled={isProcessing}
            className="flex-1 bg-purple-500 hover:bg-purple-600"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Create PDF
          </Button>
        )}
      </div>
    </div>
  );
}
