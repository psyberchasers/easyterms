"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, ChevronLeft, ChevronRight, Search, AlertCircle } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchMinusIcon, SearchAddIcon } from "@hugeicons-pro/core-stroke-rounded";
import { MusicLoader } from "@/components/MusicLoader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface TextMatch {
  pageNum: number;
  yPosition: number;
  matchedText: string;
  score: number;
  keywords: string[];
}

interface PDFViewerWithSearchProps {
  fileUrl: string;
  searchText?: string;
  highlightColor?: "yellow" | "red" | "green";
  className?: string;
  initialScale?: number;
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "'")
    .replace(/[\u201C\u201D"]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

// Extract significant keywords from search text
function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  // Filter out common words and keep significant ones
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "to", "of", "in",
    "for", "on", "with", "at", "by", "from", "as", "into", "through",
    "during", "before", "after", "above", "below", "between", "under",
    "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "all", "each", "every", "both", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "and", "but", "if", "or",
    "because", "until", "while", "this", "that", "these", "those", "any"
  ]);

  return words.filter(w => w.length > 2 && !stopWords.has(w));
}

// Calculate match score between search text and page text
function calculateMatchScore(searchKeywords: string[], pageText: string): number {
  const normalizedPage = normalizeText(pageText);
  let score = 0;

  for (const keyword of searchKeywords) {
    if (normalizedPage.includes(keyword)) {
      score += keyword.length; // Longer keywords are more significant
    }
  }

  return score;
}

// Get highlight color based on type
function getHighlightColors(color: "yellow" | "red" | "green") {
  switch (color) {
    case "red":
      return { bg: "rgba(239, 68, 68, 0.35)", border: "rgba(239, 68, 68, 0.6)" };
    case "green":
      return { bg: "rgba(34, 197, 94, 0.35)", border: "rgba(34, 197, 94, 0.6)" };
    case "yellow":
    default:
      return { bg: "rgba(250, 204, 21, 0.4)", border: "rgba(250, 204, 21, 0.7)" };
  }
}

export function PDFViewerWithSearch({
  fileUrl,
  searchText,
  highlightColor = "yellow",
  className,
  initialScale = 1.0,
}: PDFViewerWithSearchProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);
  const [loading, setLoading] = useState<boolean>(true);
  const [documentReady, setDocumentReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<TextMatch | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [pageError, setPageError] = useState<boolean>(false);
  const [pageRendered, setPageRendered] = useState<boolean>(false);
  const pdfDocRef = useRef<any>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset state when fileUrl changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    setNumPages(0);
    setCurrentPage(1);
    setLoading(true);
    setDocumentReady(false);
    setError(null);
    setMatch(null);
    setPageError(false);
    setPageRendered(false);
    pdfDocRef.current = null;
  }, [fileUrl]);

  const onDocumentLoadSuccess = useCallback((pdf: any) => {
    if (!isMountedRef.current) return;
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setLoading(false);
    setError(null);
    // Small delay to ensure document is fully ready
    setTimeout(() => {
      if (isMountedRef.current && pdfDocRef.current === pdf) {
        setDocumentReady(true);
      }
    }, 150);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setError("Failed to load PDF");
    setLoading(false);
    setDocumentReady(false);
  }, []);

  const onPageLoadError = useCallback(() => {
    setPageError(true);
  }, []);

  const onPageLoadSuccess = useCallback(() => {
    setPageError(false);
    setTimeout(() => {
      setPageRendered(true);
    }, 150);
  }, []);

  // Search for text across all pages
  useEffect(() => {
    if (!searchText || !pdfDocRef.current || numPages === 0 || !documentReady) {
      setMatch(null);
      return;
    }

    const findTextInPDF = async () => {
      setSearching(true);
      const pdf = pdfDocRef.current;

      // Safety check - ensure pdf has the required methods
      if (!pdf || typeof pdf.getPage !== 'function' || !pdf.numPages) {
        setSearching(false);
        return;
      }

      const keywords = extractKeywords(searchText);

      if (keywords.length === 0) {
        setMatch(null);
        setSearching(false);
        return;
      }

      console.log("Searching PDF for keywords:", keywords.slice(0, 5));

      let bestMatch: TextMatch | null = null;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // Check if component is still mounted and pdf is still valid
        if (!isMountedRef.current || pdfDocRef.current !== pdf) {
          setSearching(false);
          return;
        }
        try {
          const page = await pdf.getPage(pageNum);
          if (!page || !isMountedRef.current) continue;
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          // Build full page text with position info
          const textItems: Array<{ str: string; y: number }> = [];
          let fullPageText = "";

          for (const item of textContent.items as any[]) {
            if (item.str) {
              textItems.push({
                str: item.str,
                y: viewport.height - item.transform[5]
              });
              fullPageText += item.str + " ";
            }
          }

          // Check page match score
          const pageScore = calculateMatchScore(keywords, fullPageText);

          if (pageScore > 0 && (!bestMatch || pageScore > bestMatch.score)) {
            // Find best matching text item position
            let bestY = viewport.height / 2;
            let bestItemScore = 0;

            for (const item of textItems) {
              const itemScore = calculateMatchScore(keywords, item.str);
              if (itemScore > bestItemScore) {
                bestItemScore = itemScore;
                bestY = item.y;
              }
            }

            // If no individual item matched well, search for keyword sequences
            if (bestItemScore < keywords.length) {
              // Look for first keyword occurrence
              for (const keyword of keywords.slice(0, 3)) {
                for (const item of textItems) {
                  if (normalizeText(item.str).includes(keyword)) {
                    bestY = item.y;
                    break;
                  }
                }
              }
            }

            bestMatch = {
              pageNum,
              yPosition: bestY,
              matchedText: fullPageText.substring(0, 100),
              score: pageScore,
              keywords
            };
          }
        } catch (err) {
          console.error(`Error searching page ${pageNum}:`, err);
        }
      }

      if (bestMatch) {
        console.log("Found match on page", bestMatch.pageNum, "at Y:", bestMatch.yPosition, "score:", bestMatch.score);
        setMatch(bestMatch);
        setCurrentPage(bestMatch.pageNum);
      } else {
        console.log("No match found for:", keywords);
        setMatch(null);
      }

      setSearching(false);
    };

    findTextInPDF();
  }, [searchText, numPages, documentReady]);

  // Highlight text at the matched position (not by keyword, by Y position)
  useEffect(() => {
    if (!pageRendered || !match || match.pageNum !== currentPage || !pageContainerRef.current) {
      return;
    }

    const colors = getHighlightColors(highlightColor);
    const textLayer = pageContainerRef.current.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;

    const spans = textLayer.querySelectorAll('span');

    // Clear previous highlights
    spans.forEach(span => {
      (span as HTMLElement).style.backgroundColor = '';
      (span as HTMLElement).style.borderRadius = '';
      (span as HTMLElement).style.padding = '';
    });

    // Get the container's position for calculating relative positions
    const containerRect = pageContainerRef.current.getBoundingClientRect();
    const targetY = match.yPosition * scale;
    const tolerance = 25 * scale; // Only highlight spans within this Y range

    let firstMatchedSpan: HTMLElement | null = null;

    spans.forEach(span => {
      const spanRect = span.getBoundingClientRect();
      const spanY = spanRect.top - containerRect.top + (spanRect.height / 2);

      // Only highlight spans at the same Y position (within tolerance)
      if (Math.abs(spanY - targetY) < tolerance) {
        const htmlSpan = span as HTMLElement;
        htmlSpan.style.backgroundColor = colors.bg;
        htmlSpan.style.borderRadius = '2px';
        htmlSpan.style.padding = '2px 0';

        if (!firstMatchedSpan) {
          firstMatchedSpan = htmlSpan;
        }
      }
    });

    // Scroll to first matched span
    if (firstMatchedSpan && scrollContainerRef.current) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const span = firstMatchedSpan;
        if (container && span) {
          const spanRect = span.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const scrollTop = container.scrollTop + spanRect.top - containerRect.top - 150;
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [pageRendered, match, currentPage, highlightColor, scale]);

  // Reset pageRendered when page changes
  useEffect(() => {
    setPageRendered(false);
  }, [currentPage]);

  return (
    <div className={cn("flex flex-col h-full bg-muted/20", className)}>
      {/* Controls - Always visible with skeletons while loading */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border shrink-0">
        {/* Left - Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-background hover:bg-muted shadow-none"
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            disabled={loading}
          >
            <HugeiconsIcon icon={SearchMinusIcon} size={16} />
          </Button>
          {loading ? (
            <div className="w-14 h-4 bg-muted animate-pulse rounded" />
          ) : (
            <span className="text-sm text-muted-foreground w-14 text-center">{Math.round(scale * 100)}%</span>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-background hover:bg-muted shadow-none"
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            disabled={loading}
          >
            <HugeiconsIcon icon={SearchAddIcon} size={16} />
          </Button>
        </div>

        {/* Center - Search status indicator (only when searching) */}
        <div className="flex items-center justify-center">
          {searchText && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 text-xs",
              searching ? "text-muted-foreground" :
              match ? "text-foreground" : "text-muted-foreground/60"
            )}>
              {searching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : match ? (
                <>
                  <Search className="h-3.5 w-3.5" />
                  <span>Page {match.pageNum}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Not found</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right - Page controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-background hover:bg-muted shadow-none"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={loading || currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {loading ? (
            <div className="w-16 h-4 bg-muted animate-pulse rounded" />
          ) : (
            <span className="text-sm text-muted-foreground w-16 text-center">{currentPage}/{numPages}</span>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border bg-background hover:bg-muted shadow-none"
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={loading || currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-hidden flex justify-center items-start p-4 pb-8 bg-card">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <MusicLoader />
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-400 text-sm">
            {error}
          </div>
        )}

        <Document
          key={fileUrl}
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          {documentReady && numPages > 0 && !pageError && pdfDocRef.current && (
            <div ref={pageContainerRef} className="relative inline-block mb-8">
              <Page
                key={`${fileUrl}-${currentPage}`}
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
                onLoadSuccess={onPageLoadSuccess}
                onLoadError={onPageLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <MusicLoader />
                  </div>
                }
              />

            </div>
          )}
          {pageError && (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Failed to load page</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-border"
                  onClick={() => setPageError(false)}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </Document>
      </div>
    </div>
  );
}

export default PDFViewerWithSearch;
