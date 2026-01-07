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
      <Navbar showSearch={false} />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 pt-28">

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center animate-fade-in-up">
            <img src={theme === "dark" ? "/darkmodeS.svg" : "/logoSingle.svg"} alt="EasyTerms" className="h-12" />
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-fade-in-up stagger-1">
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight text-foreground">
              Welcome to <span className="text-purple-500">EasyTerms</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              AI Contract Analysis for Creators & Talent
            </p>
          </div>

          {/* Subheadline */}
          <div className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2 space-y-3">
            <p>Upload any contract and get an <span className="text-foreground">instant, easy-to-understand</span> breakdown</p>
            <p className="flex items-center justify-center gap-1.5 flex-wrap">
              <span>Spot</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 text-foreground border border-border text-sm font-medium">
                <HugeiconsIcon icon={Alert02Icon} size={14} />
                red flags
              </span>
              <span>understand</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 text-foreground border border-border text-sm font-medium">
                <HugeiconsIcon icon={DocumentValidationIcon} size={14} />
                key terms
              </span>
              <span>and negotiate with</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-muted/50 text-foreground border border-border text-sm font-medium">
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
                  ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                  : "border-border hover:border-purple-500/50 hover:bg-purple-500/5"
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
                  isDragging ? "text-purple-500" : "text-muted-foreground group-hover:text-purple-500"
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

      {/* Features Section - Minimal */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                title: "Instant Analysis",
                description: "Upload any contract and get a complete breakdown in under 30 seconds. No waiting, no scheduling.",
              },
              {
                title: "Plain English",
                description: "Every clause translated from legalese to language you actually understand. No law degree required.",
              },
              {
                title: "Risk Detection",
                description: "Automatically identifies red flags, unfavorable terms, and clauses that could cost you down the road.",
              },
            ].map((feature, i) => (
              <div key={i}>
                <h3 className="text-lg font-medium text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simple */}
      <section className="py-32 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-medium text-foreground mb-16">How it works</h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload your contract",
                description: "Drop a PDF, Word doc, or paste text directly. We support all common formats.",
              },
              {
                step: "02",
                title: "AI analyzes every clause",
                description: "Our AI reads the full document, identifies key terms, and flags potential issues.",
              },
              {
                step: "03",
                title: "Review and understand",
                description: "Get a clear breakdown with plain English explanations and actionable insights.",
              },
            ].map((item, i) => (
              <div key={i} className="group">
                <span className="text-xs font-mono text-muted-foreground/60 mb-4 block">{item.step}</span>
                <h3 className="text-lg font-medium text-foreground mb-2 group-hover:text-purple-400 transition-colors">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
            Ready to understand your contracts?
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload your first contract for free. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="h-10 px-6 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              Start Analyzing
            </Link>
            <Link
              href="/login"
              className="h-10 px-6 border border-border hover:border-muted-foreground/30 text-foreground font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analyze</Link></li>
                <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contract Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img
                src={theme === "dark" ? "/darkmodeS.svg" : "/logoSingle.svg"}
                alt="EasyTerms"
                className="h-6"
              />
              <span className="text-sm text-muted-foreground">EasyTerms</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} EasyTerms. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      </main>
  );
}
