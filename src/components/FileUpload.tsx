"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  currentFile?: string;
  onClear?: () => void;
  compact?: boolean;
}

export function FileUpload({ onFileSelect, isLoading, currentFile, onClear, compact = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  if (currentFile) {
    return (
      <div className="relative">
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-primary/30 glow-amber">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{currentFile}</p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Analyzing..." : "Ready for analysis"}
              </p>
            </div>
          </div>
          {!isLoading && onClear && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          {isLoading && (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
        </div>
      </div>
    );
  }

  // Compact version for top of page
  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer group",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-card/50"
        )}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center gap-3">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            isDragging 
              ? "bg-primary/20" 
              : "bg-card group-hover:bg-primary/10"
          )}>
            <Upload className={cn(
              "w-6 h-6 transition-colors duration-300",
              isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-foreground">
              {isDragging ? "Drop here" : "Drop your contract here or click to browse"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-1">
              {["PDF", "Word", "TXT"].map((format) => (
                <span
                  key={format}
                  className="px-2 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer group",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-card/50"
      )}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn(
          "p-4 rounded-2xl transition-all duration-300",
          isDragging 
            ? "bg-primary/20 scale-110" 
            : "bg-card group-hover:bg-primary/10"
        )}>
          <Upload className={cn(
            "w-10 h-10 transition-colors duration-300",
            isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
          )} />
        </div>
        
        <div className="space-y-2">
          <p className="text-xl font-semibold text-foreground">
            {isDragging ? "Drop your contract here" : "Upload your music contract"}
          </p>
          <p className="text-muted-foreground">
            Drag and drop or click to browse
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {["PDF", "Word", "TXT"].map((format) => (
            <span
              key={format}
              className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
            >
              {format}
            </span>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground/70">
          Maximum file size: 10MB
        </p>
      </div>
    </div>
  );
}





