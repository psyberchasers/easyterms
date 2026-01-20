"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Trash2, Loader2, FileText, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

interface CameraCaptureProps {
  onComplete: (pdfBlob: Blob, fileName: string) => void;
  onClose: () => void;
  className?: string;
}

export function CameraCapture({
  onComplete,
  onClose,
  className,
}: CameraCaptureProps) {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle camera capture
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImages((prev) => [...prev, imageData]);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Remove an image
  const removeImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Create PDF from captured images
  const createPDF = async () => {
    if (capturedImages.length === 0) return;

    setIsProcessing(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      for (let i = 0; i < capturedImages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = capturedImages[i];

        // Load image to get dimensions
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = imgData;
        });

        // Calculate dimensions to fit page while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const pageAspect = (pageWidth - margin * 2) / (pageHeight - margin * 2);

        let drawWidth, drawHeight;
        if (imgAspect > pageAspect) {
          // Image is wider than page
          drawWidth = pageWidth - margin * 2;
          drawHeight = drawWidth / imgAspect;
        } else {
          // Image is taller than page
          drawHeight = pageHeight - margin * 2;
          drawWidth = drawHeight * imgAspect;
        }

        // Center on page
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, drawWidth, drawHeight);
      }

      const pdfBlob = pdf.output("blob");
      const fileName = `scanned-contract-${Date.now()}.pdf`;

      onComplete(pdfBlob, fileName);
    } catch (err) {
      console.error("Failed to create PDF:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {/* Captured images preview */}
      {capturedImages.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
            {capturedImages.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`Page ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-sm text-center text-muted-foreground">
            {capturedImages.length} page{capturedImages.length !== 1 ? "s" : ""} captured
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Page
            </Button>
            <Button
              onClick={createPDF}
              disabled={isProcessing}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Create PDF
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setCapturedImages([])}
              className="flex-1 text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Initial state - ready to capture */
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center">
            <Camera className="w-10 h-10 text-foreground/60" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-foreground">
              Scan Contract Pages
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Take photos of each page of your contract
            </p>
          </div>

          <div className="flex gap-3 mt-4 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            You can add multiple pages before creating the PDF
          </p>
        </div>
      )}
    </div>
  );
}
