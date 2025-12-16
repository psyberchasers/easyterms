"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  highlightText?: string;
  className?: string;
}

export function PDFViewer({ fileUrl, highlightText, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 48); // Account for padding
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // Custom text renderer for highlighting
  const textRenderer = useCallback(
    (textItem: { str: string }) => {
      if (!highlightText) return textItem.str;

      const normalizedHighlight = highlightText.toLowerCase().replace(/\s+/g, " ").trim();
      const normalizedText = textItem.str.toLowerCase();

      // Check if this text chunk contains part of the highlight
      const words = normalizedHighlight.split(" ").filter((w) => w.length > 3);
      
      for (const word of words) {
        if (normalizedText.includes(word)) {
          // Return with highlight wrapper
          const regex = new RegExp(`(${word})`, "gi");
          return textItem.str.replace(
            regex,
            '<mark class="bg-amber-400/50 text-inherit rounded px-0.5">$1</mark>'
          );
        }
      }

      return textItem.str;
    },
    [highlightText]
  );

  // Apply highlighting styles after render
  useEffect(() => {
    if (!highlightText || loading) return;

    const applyHighlighting = () => {
      const textLayers = document.querySelectorAll(".react-pdf__Page__textContent");
      
      textLayers.forEach((layer) => {
        const spans = layer.querySelectorAll("span");
        const normalizedHighlight = highlightText.toLowerCase().replace(/\s+/g, " ").trim();
        const words = normalizedHighlight.split(" ").filter((w) => w.length > 3).slice(0, 5);

        spans.forEach((span) => {
          const text = span.textContent?.toLowerCase() || "";
          let shouldHighlight = false;

          for (const word of words) {
            if (text.includes(word)) {
              shouldHighlight = true;
              break;
            }
          }

          if (shouldHighlight) {
            span.style.backgroundColor = "rgba(251, 191, 36, 0.4)";
            span.style.borderRadius = "2px";
            span.style.padding = "1px 2px";
            span.style.margin = "-1px -2px";
            
            // Scroll to first highlight
            if (!document.querySelector("[data-scrolled-to-highlight]")) {
              span.setAttribute("data-scrolled-to-highlight", "true");
              span.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          } else {
            span.style.backgroundColor = "";
            span.style.borderRadius = "";
            span.style.padding = "";
            span.style.margin = "";
          }
        });
      });
    };

    // Apply after a short delay to ensure text layer is rendered
    const timeout = setTimeout(applyHighlighting, 300);
    return () => clearTimeout(timeout);
  }, [highlightText, loading, pageNumber]);

  // Clear scroll marker when highlight changes
  useEffect(() => {
    document.querySelectorAll("[data-scrolled-to-highlight]").forEach((el) => {
      el.removeAttribute("data-scrolled-to-highlight");
    });
  }, [highlightText]);

  return (
    <div ref={containerRef} className={cn("flex flex-col h-full", className)}>
      {/* Controls */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {pageNumber} / {numPages || "..."}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 2.5}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="flex justify-center p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
            error={
              <div className="text-center py-20 text-muted-foreground">
                Failed to load PDF
              </div>
            }
            className="shadow-xl"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={containerWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="rounded-lg overflow-hidden"
            />
          </Document>
        </div>
      </div>
    </div>
  );
}

