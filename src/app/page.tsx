"use client";

import { useState, useRef, useCallback } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { ChevronDown, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, DocumentValidationIcon, FallingStarIcon } from "@hugeicons-pro/core-solid-rounded";
import { Skiper30 } from "@/components/Skiper30";
import { HeroSs11 } from "@/components/HeroSs11";
import { HeroSs22 } from "@/components/HeroSs22";
import { StepsCards } from "@/components/StepsCards";
import { FooterCTA } from "@/components/FooterCTA";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    // Store file in sessionStorage for the analyze page to pick up
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("pendingFile", JSON.stringify({
        name: file.name,
        type: file.type,
        data: reader.result,
      }));
      router.push("/analyze");
    };
    reader.readAsDataURL(file);
  }, [router]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <main className="min-h-screen gradient-bg">
      <Navbar showSearch={false} transparent />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 pt-28" style={{ backgroundImage: 'url(/G-UKZbEWQAAVQ8L.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center animate-fade-in-up">
            <img src={theme === "dark" ? "/darkModeS.svg" : "/logoSingle.svg"} alt="EasyTerms" className="h-12" />
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-fade-in-up stagger-1">
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white">
              Welcome to <span className="text-white">EasyTerms</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-light">
              AI Contract Analysis for Creators & Talent
            </p>
          </div>

          {/* Subheadline */}
          <div className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2 space-y-3">
            <p>Upload any contract and get an <span className="text-white">instant, easy-to-understand</span> breakdown</p>
            <p className="flex items-center justify-center gap-1.5 flex-wrap">
              <span>Spot</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 text-white border border-white/30 text-sm font-medium">
                <HugeiconsIcon icon={Alert02Icon} size={14} />
                red flags
              </span>
              <span>understand</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 text-white border border-white/30 text-sm font-medium">
                <HugeiconsIcon icon={DocumentValidationIcon} size={14} />
                key terms
              </span>
              <span>and negotiate with</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 text-white border border-white/30 text-sm font-medium">
                <HugeiconsIcon icon={FallingStarIcon} size={14} />
                confidence
              </span>
            </p>
          </div>

          {/* Upload Widget */}
          <div className="pt-6 animate-fade-in-up stagger-3 w-full max-w-xl mx-auto">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group",
                isDragging
                  ? "border-purple-300 bg-purple-500/10 scale-[1.02]"
                  : "border-white/50 hover:border-purple-300 hover:bg-purple-500/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className={cn(
                "p-4 rounded-2xl w-fit mx-auto mb-4 transition-all",
                isDragging ? "bg-purple-500/20" : "bg-muted/50 group-hover:bg-purple-500/10"
              )}>
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-purple-300" : "text-white group-hover:text-purple-300"
                )} />
              </div>
              <p className="text-lg font-medium mb-2">Drop your contract here</p>
              <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
              <div className="flex justify-center gap-2">
                {["PDF", "Word", "TXT"].map((format) => (
                  <Badge key={format} variant="secondary" className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30">{format}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="pt-24 pb-8 animate-fade-in-up stagger-5 flex justify-center">
            <ChevronDown className="w-8 h-8 animate-bounce text-purple-500" />
          </div>
        </div>
      </section>

      {/* Purple Hero - ss22 style */}
      <HeroSs22 />

      {/* Purple Hero with Steps - ss11 style */}
      <HeroSs11 />

      {/* Parallax Gallery */}
      <Skiper30 />

      {/* Steps Cards Section */}
      <StepsCards />

      {/* Footer with CTA */}
      <FooterCTA />
      </main>
  );
}
