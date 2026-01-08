"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

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
  const [pages, setPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle camera capture
  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setPages((prev) => [...prev, imageData]);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Remove a page
  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert images to PDF
  const createPDF = async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const img = new Image();
        img.src = pages[i];

        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Calculate dimensions to fit page while maintaining aspect ratio
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

            pdf.addImage(pages[i], "JPEG", x, y, width, height);
            resolve();
          };
        });
      }

      const pdfBlob = pdf.output("blob");
      const fileName = `scanned-contract-${Date.now()}.pdf`;
      onScanComplete(pdfBlob, fileName);
    } catch (error) {
      console.error("Error creating PDF:", error);
      alert("Failed to create PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn("flex flex-col p-4", className)}>
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {/* Pages preview */}
      {pages.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {pages.map((page, index) => (
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
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs">Add page</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {pages.length} page{pages.length !== 1 ? "s" : ""} captured
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Scan your contract pages
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Take photos of each page, then convert to PDF
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>

        {pages.length === 0 ? (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-purple-500 hover:bg-purple-600"
          >
            <Camera className="w-4 h-4 mr-2" />
            Take Photo
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
