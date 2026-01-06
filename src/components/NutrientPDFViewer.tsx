"use client";

import { useEffect, useRef, useState } from "react";
import { MusicLoader } from "@/components/MusicLoader";
import { cn } from "@/lib/utils";

interface NutrientPDFViewerProps {
  fileUrl: string;
  searchText?: string;
  className?: string;
}

declare global {
  interface Window {
    NutrientViewer: {
      load: (config: {
        baseUrl: string;
        container: string | HTMLElement;
        document: string | ArrayBuffer;
        toolbarItems?: Array<{ type: string }>;
        initialViewState?: unknown;
      }) => Promise<{
        setViewState: (state: unknown) => void;
        search: (query: string) => Promise<void>;
        contentDocument: {
          search: (query: string) => Promise<Array<{ pageIndex: number }>>;
        };
      }>;
      unload: (target: string | HTMLElement | unknown) => boolean;
      ViewState: new (options: { currentPageIndex?: number }) => unknown;
    };
  }
}

export function NutrientPDFViewer({
  fileUrl,
  searchText,
  className,
}: NutrientPDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Awaited<ReturnType<typeof window.NutrientViewer.load>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadViewer = async () => {
      if (!containerRef.current) return;

      // Clean up previous instance
      if (viewerContainerRef.current) {
        try {
          window.NutrientViewer?.unload?.(viewerContainerRef.current);
        } catch (e) {
          // Ignore unload errors
        }
        viewerContainerRef.current.remove();
        viewerContainerRef.current = null;
        instanceRef.current = null;
      }

      setLoading(true);
      setError(null);

      try {
        // Dynamically import the Nutrient viewer script
        if (!window.NutrientViewer) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/nutrient/nutrient-viewer.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Nutrient viewer"));
            document.head.appendChild(script);
          });
        }

        if (!mounted) return;

        // Create a fresh container div for Nutrient
        const viewerDiv = document.createElement("div");
        viewerDiv.style.width = "100%";
        viewerDiv.style.height = "100%";
        containerRef.current.appendChild(viewerDiv);
        viewerContainerRef.current = viewerDiv;

        const baseUrl = `${window.location.protocol}//${window.location.host}/nutrient/`;

        const instance = await window.NutrientViewer.load({
          baseUrl,
          container: viewerDiv,
          document: fileUrl,
          toolbarItems: [
            { type: "sidebar-thumbnails" },
            { type: "sidebar-bookmarks" },
            { type: "pager" },
            { type: "zoom-out" },
            { type: "zoom-in" },
            { type: "zoom-mode" },
            { type: "spacer" },
            { type: "search" },
            { type: "print" },
            { type: "export-pdf" },
          ],
        });

        if (!mounted) {
          window.NutrientViewer?.unload?.(viewerDiv);
          viewerDiv.remove();
          return;
        }

        instanceRef.current = instance;
        setLoading(false);

        // If there's search text, perform search
        if (searchText && instance.search) {
          await instance.search(searchText);
        }
      } catch (err) {
        console.error("Error loading Nutrient viewer:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load PDF viewer");
          setLoading(false);
        }
      }
    };

    loadViewer();

    return () => {
      mounted = false;
      if (viewerContainerRef.current) {
        try {
          window.NutrientViewer?.unload?.(viewerContainerRef.current);
        } catch (e) {
          // Ignore unload errors
        }
        viewerContainerRef.current.remove();
        viewerContainerRef.current = null;
        instanceRef.current = null;
      }
    };
  }, [fileUrl]);

  // Handle search text changes
  useEffect(() => {
    if (instanceRef.current && searchText) {
      instanceRef.current.search?.(searchText);
    }
  }, [searchText]);

  return (
    <div className={cn("relative w-full h-full", className)}>
      {(loading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          {loading && <MusicLoader />}
          {error && (
            <div className="text-center text-red-500">
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: "500px" }}
      />
    </div>
  );
}

export default NutrientPDFViewer;
