"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import {
  FileText,
  Zap,
  ChevronDown,
  DollarSign,
  Clock,
  CheckCircle2,
  Sparkles,
  Lock,
  FileSearch,
  BookOpen,
  Eye,
  AlertTriangle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, DocumentValidationIcon, FallingStarIcon } from "@hugeicons-pro/core-solid-rounded";

export default function Home() {
  const router = useRouter();
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
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 pt-28">

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center animate-fade-in-up">
            <img src="/logo.png" alt="EasyTerms" className="h-12" />
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-fade-in-up stagger-1">
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight text-white">
              Welcome to <span className="text-gradient">EasyTerms</span>
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium">
                <HugeiconsIcon icon={Alert02Icon} size={14} />
                red flags
              </span>
              <span>understand</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/30 text-sm font-medium">
                <HugeiconsIcon icon={DocumentValidationIcon} size={14} />
                key terms
              </span>
              <span>and negotiate with</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-sm font-medium">
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
                  ? "border-primary bg-primary/10 scale-[1.02]" 
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
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
                isDragging ? "bg-primary/20" : "bg-muted/50 group-hover:bg-primary/10"
              )}>
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />
              </div>
              <p className="text-lg font-medium mb-2">Drop your contract here</p>
              <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
              <div className="flex justify-center gap-2">
                {["PDF", "Word", "TXT"].map((format) => (
                  <Badge key={format} variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/30">{format}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="pt-24 pb-8 animate-fade-in-up stagger-5 flex justify-center">
            <ChevronDown className="w-8 h-8 animate-bounce text-primary" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-transparent via-primary/3 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "30s", label: "Average Analysis Time", icon: Clock },
              { value: "50+", label: "Clause Types Detected", icon: FileSearch },
              { value: "99%", label: "Accuracy Rate", icon: CheckCircle2 },
              { value: "24/7", label: "Always Available", icon: Sparkles },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section className="py-24 px-4 relative">
        {/* Background decoration - extended and extra blur to avoid sharp edges */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[900px] bg-primary/[0.04] rounded-full blur-[150px]" />
        </div>
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Artists Choose <span className="text-gradient">EasyTerms</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t sign away your rights. Get the clarity you need before putting pen to paper.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {/* Large Feature Card - AI Analysis */}
            <div className="lg:row-span-2 p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-4 rounded-2xl bg-primary/20">
                    <Eye className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Advanced AI Analysis</h3>
                  </div>
                </div>
                <p className="text-foreground/80 text-lg leading-relaxed">
                  Our AI doesn&apos;t just scan for keywords. It understands context, industry standards, 
                  and the subtle implications that could cost you in the long run.
                </p>
              </div>
            </div>

            {/* Risk Detection Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 group hover:border-red-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Red Flag Detection</h3>
                  <p className="text-muted-foreground mb-4">
                    Instantly identify problematic clauses that labels hope you&apos;ll miss. 
                    Get warned before it&apos;s too late.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Ownership Traps", "Hidden Fees", "Term Extensions"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 group hover:border-green-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Financial Clarity</h3>
                  <p className="text-muted-foreground mb-4">
                    Understand exactly where your money goes. Advances, royalties, recoupment: all 
                    broken down in plain terms.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Royalty Rates", "Recoupment", "Payment Terms"].map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Features Row - Enhanced */}
          <div className="grid md:grid-cols-2 gap-8 mt-4 max-w-3xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: "Plain English Mode",
                description: "Every paragraph translated from legalese to language you actually understand.",
                highlight: "No law degree required",
                gradient: "from-cyan-500/20 to-blue-500/20",
                iconBg: "bg-cyan-500/20",
                iconColor: "text-cyan-400",
                borderHover: "hover:border-cyan-500/40",
                pillBg: "bg-cyan-500/10",
                pillText: "text-cyan-400",
              },
              {
                icon: Lock,
                title: "Private & Secure",
                description: "Your contracts are encrypted and securely stored. De-identified data may help improve our AI, and you control access and deletion.",
                highlight: "You control your data",
                gradient: "from-emerald-500/20 to-green-500/20",
                iconBg: "bg-emerald-500/20",
                iconColor: "text-emerald-400",
                borderHover: "hover:border-emerald-500/40",
                pillBg: "bg-emerald-500/10",
                pillText: "text-emerald-400",
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className={`group relative p-8 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 border border-border ${feature.borderHover} transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Subtle gradient glow on hover */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10`} />
                
                {/* Icon with ring */}
                <div className={`inline-flex p-4 rounded-2xl ${feature.iconBg} mb-6 ring-1 ring-white/10`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Highlight badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${feature.pillBg} ${feature.pillText} text-xs font-medium`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {feature.highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">Three steps to contract clarity</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            
            {[
              {
                step: "01",
                title: "Upload",
                description: "Drop your contract in any format. PDF, Word, or plain text. We handle the rest.",
                icon: FileText,
              },
              {
                step: "02", 
                title: "Analyze",
                description: "Our AI scans every clause, identifies risks, and extracts key terms in seconds.",
                icon: Zap,
              },
              {
                step: "03",
                title: "Understand",
                description: "Get a complete breakdown with actionable insights and negotiation points.",
                icon: CheckCircle2,
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-card border border-border flex items-center justify-center mb-6 relative z-10">
                  <item.icon className="w-10 h-10 text-primary" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </main>
  );
}
