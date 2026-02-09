"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Upload, ArrowRight, ArrowUpRight, Check, X, AlertCircle, FileText, Clock, Shield, Star, DollarSign, Calendar, MapPin, Mic, PenLine, Handshake, Globe, Clapperboard, SlidersHorizontal, RefreshCw, ScrollText } from "lucide-react";
import anime from "animejs";
import gsap from "gsap";

// Feature Pills Component
function FeaturePills() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemHeights, setItemHeights] = useState<Map<number, { buttonH: number; openH: number }>>(new Map());
  const [collapsedWidths, setCollapsedWidths] = useState<Map<number, number>>(new Map());

  const features = [
    {
      label: "Risk Detection",
      body: "Risk Detection.",
      detail: "Our AI scans every clause to identify unfavorable terms, perpetual rights grants, and hidden obligations that could hurt you.",
      image: "/feature-risk.jpg"
    },
    {
      label: "Plain English Translation",
      body: "Plain English Translation.",
      detail: "Complex legal jargon translated into simple language you can actually understand — no law degree required.",
      image: "/feature-translate.jpg"
    },
    {
      label: "Market Rate Comparison",
      body: "Market Rate Comparison.",
      detail: "See how your deal stacks up against industry standards. Know if your royalty rates and terms are fair.",
      image: "/feature-compare.jpg"
    },
    {
      label: "Negotiation Points",
      body: "Negotiation Points.",
      detail: "Get specific, actionable recommendations on what to push back on and how to ask for better terms.",
      image: "/feature-negotiate.jpg"
    },
    {
      label: "Clause-by-Clause Breakdown",
      body: "Clause-by-Clause Breakdown.",
      detail: "Every section analyzed individually with risk ratings, explanations, and what it means for your career.",
      image: "/feature-breakdown.jpg"
    },
    {
      label: "Instant Analysis",
      body: "Instant Analysis.",
      detail: "Upload your contract and get comprehensive insights in under 30 seconds. No waiting, no appointments.",
      image: "/feature-instant.jpg"
    }
  ];

  useEffect(() => {
    if (!wrapRef.current) return;

    const items = wrapRef.current.querySelectorAll('[data-feature-item]');
    const newHeights = new Map<number, { buttonH: number; openH: number }>();
    const newWidths = new Map<number, number>();

    items.forEach((item, i) => {
      const btn = item.querySelector('[data-feature-button]') as HTMLElement;
      const inner = item.querySelector('[data-feature-inner]') as HTMLElement;

      if (btn && inner) {
        const buttonH = btn.getBoundingClientRect().height;
        const innerH = inner.getBoundingClientRect().height;
        newHeights.set(i, { buttonH, openH: Math.max(buttonH, innerH) });
      }

      newWidths.set(i, (item as HTMLElement).getBoundingClientRect().width);
    });

    setItemHeights(newHeights);
    setCollapsedWidths(newWidths);

    // Set initial heights
    items.forEach((item, i) => {
      const heights = newHeights.get(i);
      if (heights) {
        (item as HTMLElement).style.height = `${heights.buttonH}px`;
      }
    });
  }, []);

  const openItem = (index: number) => {
    if (!wrapRef.current) return;
    const item = wrapRef.current.querySelectorAll('[data-feature-item]')[index] as HTMLElement;
    if (!item) return;

    const heights = itemHeights.get(index);
    if (!heights) return;

    gsap.to(item, {
      height: heights.openH,
      width: "25em",
      duration: 0.5,
      ease: "back.out(2)"
    });
  };

  const closeItem = (index: number) => {
    if (!wrapRef.current) return;
    const item = wrapRef.current.querySelectorAll('[data-feature-item]')[index] as HTMLElement;
    if (!item) return;

    const heights = itemHeights.get(index);
    const width = collapsedWidths.get(index);
    if (!heights) return;

    gsap.to(item, {
      height: heights.buttonH,
      width: width || "auto",
      duration: 0.5,
      ease: "back.out(2)"
    });
  };

  const handleClick = (index: number) => {
    if (activeIndex === index) {
      closeItem(index);
      setActiveIndex(null);
    } else {
      if (activeIndex !== null) {
        closeItem(activeIndex);
      }
      openItem(index);
      setActiveIndex(index);
    }
  };

  const handleClose = () => {
    if (activeIndex !== null) {
      closeItem(activeIndex);
      setActiveIndex(null);
    }
  };

  return (
    <section className="py-32 px-6 flex justify-center">
      <div
        ref={wrapRef}
        className="feature-pills__wrap"
        data-feature-pills-active={activeIndex !== null ? "true" : "false"}
      >
        <div className="feature-pills__layout">
          {/* Left Column - Pills */}
          <div className="feature-pills__col">
            <div className="feature-pills__info-collection">
              <ul className="feature-pills__info-list">
                {features.map((feature, i) => (
                  <li
                    key={i}
                    data-feature-item
                    data-active={activeIndex === i ? "true" : "false"}
                    className="feature-pills__info-item"
                  >
                    <div className="feature-pills__item-bg" />
                    <button
                      data-feature-button
                      onClick={() => handleClick(i)}
                      aria-expanded={activeIndex === i}
                      className="feature-pills__item-button"
                    >
                      <span className="feature-pills__item-label">{feature.label}</span>
                      <span className="feature-pills__item-icon">
                        <span className="feature-pills__item-icon-bar" />
                        <span className="feature-pills__item-icon-bar is--horizontal" />
                      </span>
                    </button>
                    <div
                      aria-hidden={activeIndex !== i}
                      className="feature-pills__item-content"
                    >
                      <div className="feature-pills__item-mask">
                        <div data-feature-inner className="feature-pills__item-inner">
                          <p className="feature-pills__item-body">
                            {feature.body}
                            <br /><br />
                            <span className="feature-pills__item-body-span">{feature.detail}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Visuals */}
          <div className="feature-pills__col is--visual">
            <div className="feature-pills__visual-collection">
              <div className="feature-pills__visual-list">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    data-active={activeIndex === i ? "true" : "false"}
                    aria-hidden={activeIndex !== i}
                    className="feature-pills__visual-item"
                  >
                    <div className={`w-full h-full flex items-center justify-center ${
                      i === 0 ? 'bg-gradient-to-br from-red-500/20 to-red-600/10' :
                      i === 1 ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' :
                      i === 2 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10' :
                      i === 3 ? 'bg-gradient-to-br from-green-500/20 to-green-600/10' :
                      i === 4 ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10' :
                      'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10'
                    }`}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">
                          {i === 0 ? '🛡️' : i === 1 ? '📖' : i === 2 ? '📊' : i === 3 ? '💪' : i === 4 ? '🔍' : '⚡'}
                        </div>
                        <p className="text-white/60 text-lg">{feature.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              data-active={activeIndex === null ? "true" : "false"}
              className="feature-pills__visual-cover"
            >
              <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-violet-600/10 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-4">✨</p>
                  <p className="text-white/40 text-sm">Click a feature to explore</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="feature-pills__close">
          <button
            onClick={handleClose}
            aria-hidden={activeIndex === null}
            className="feature-pills__close-button"
          >
            <span className="feature-pills__item-icon-bar" />
            <span className="feature-pills__item-icon-bar is--horizontal" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeWord, setActiveWord] = useState(0);

  const rotatingWords = ["Record Deal", "Publishing Agreement", "Sync License", "Management Contract", "Distribution Deal"];
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeBadge, setActiveBadge] = useState(0);

  const floatingBadges = [
    { id: "badge-1", icon: Check, iconColor: "text-green-400", bg: "bg-green-500/20", title: "Analysis Complete", subtitle: "3 issues found", position: "top-left" },
    { id: "badge-2", icon: AlertCircle, iconColor: "text-red-400", bg: "bg-red-500/20", title: "High Risk Found", subtitle: "Perpetual clause", position: "top-right" },
    { id: "badge-3", icon: DollarSign, iconColor: "text-amber-400", bg: "bg-amber-500/20", title: "Below Market", subtitle: "15% royalty rate", position: "bottom-left" },
    { id: "badge-4", icon: Star, iconColor: "text-purple-400", bg: "bg-purple-500/20", title: "Recommendation", subtitle: "Negotiate term", position: "bottom-right" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Anime.js floating badges animation
  useEffect(() => {
    const badges = document.querySelectorAll('.floating-badge');
    if (badges.length === 0) return;

    // Initial hide all
    badges.forEach((badge) => {
      anime.set(badge, { scale: 0, opacity: 0 });
    });

    // Cycle through badges
    let currentIndex = 0;

    const showBadge = (index: number) => {
      const badge = badges[index];
      if (!badge) return;

      // Animate in
      anime({
        targets: badge,
        scale: [0, 1],
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutBack',
      });

      // Animate out after delay
      setTimeout(() => {
        anime({
          targets: badge,
          scale: [1, 0],
          opacity: [1, 0],
          translateY: [0, -10],
          duration: 400,
          easing: 'easeInQuad',
          complete: () => {
            currentIndex = (currentIndex + 1) % badges.length;
            setActiveBadge(currentIndex);
            showBadge(currentIndex);
          }
        });
      }, 2000);
    };

    // Start the animation loop
    const timer = setTimeout(() => showBadge(0), 500);

    return () => {
      clearTimeout(timer);
      anime.remove(badges);
    };
  }, []);

  const handleFileSelect = useCallback((file: File) => {
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
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/darkModeS.svg" alt="EasyTerms" className="h-7" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="h-10 px-5 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/15 transition-all flex items-center justify-center"
            >
              Log in
            </Link>
            <Link
              href="/analyze"
              className="h-10 px-5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all flex items-center justify-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-6 pt-32 pb-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {/* Base Dot Grid Pattern - white dots */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Purple dots in the grid - offset grids to make some dots purple with twinkle */}
          <div
            className="absolute inset-0 animate-twinkle1"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.7) 1px, transparent 0)`,
              backgroundSize: '128px 160px',
            }}
          />
          <div
            className="absolute inset-0 animate-twinkle2"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.6) 1px, transparent 0)`,
              backgroundSize: '192px 128px',
              backgroundPosition: '64px 32px',
            }}
          />
          <div
            className="absolute inset-0 animate-twinkle3"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(167, 139, 250, 0.6) 1px, transparent 0)`,
              backgroundSize: '160px 192px',
              backgroundPosition: '96px 64px',
            }}
          />
          <div
            className="absolute inset-0 animate-twinkle4"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(192, 132, 252, 0.5) 1px, transparent 0)`,
              backgroundSize: '224px 176px',
              backgroundPosition: '32px 96px',
            }}
          />

          {/* Top Gradient Fade */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left - Text */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-white/40 uppercase tracking-[0.2em] mb-6"
              >
                Contract Analysis for Creators
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
              >
                Don't sign
                <br />
                what you don't
                <br />
                <span className="text-purple-400">understand.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-white/50 mb-10 max-w-lg leading-relaxed"
              >
                Upload your contract. Get instant clarity on what it really says, what's risky, and what to negotiate.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 px-8 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all flex items-center gap-3"
                >
                  <Upload className="w-5 h-5" />
                  Upload Contract
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Link
                  href="#how-it-works"
                  className="h-14 px-8 text-white font-medium rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  How it works
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
              ref={cardRef}
            >
              {/* Contract Preview Card */}
              <div className="relative bg-[#111] rounded-3xl border border-white/10 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-white/30">recording_agreement_v2.pdf</span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Risk Alert */}
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">High Risk Clause Detected</p>
                      <p className="text-xs text-white/50 mt-1">Perpetual rights grant in Section 4.2</p>
                    </div>
                  </div>

                  {/* Key Terms */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-white/70">Royalty Rate</span>
                      <span className="text-sm font-medium text-white">15%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-white/70">Term Length</span>
                      <span className="text-sm font-medium text-amber-400">Life of Copyright</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-white/70">Territory</span>
                      <span className="text-sm font-medium text-white">Worldwide</span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-xs text-purple-400 uppercase tracking-wider mb-2">Recommendation</p>
                    <p className="text-sm text-white/80">Negotiate the term length to 7 years with renewal options.</p>
                  </div>
                </div>
              </div>

              {/* Floating Animated Badges */}
              {floatingBadges.map((badge, index) => {
                const BadgeIcon = badge.icon;
                const positionClasses = {
                  "top-left": "-left-6 top-16",
                  "top-right": "-right-6 top-8",
                  "bottom-left": "-left-4 bottom-32",
                  "bottom-right": "-right-4 bottom-16",
                }[badge.position];

                return (
                  <div
                    key={badge.id}
                    className={`floating-badge absolute ${positionClasses} bg-[#111] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl z-10`}
                    style={{ opacity: 0, transform: 'scale(0)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${badge.bg} flex items-center justify-center`}>
                        <BadgeIcon className={`w-5 h-5 ${badge.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-white/50">{badge.title}</p>
                        <p className="text-sm font-medium text-white">{badge.subtitle}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scrolling Text */}
      <section className="py-8 overflow-hidden bg-white/[0.02]">
        <div className="flex animate-scroll">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 shrink-0">
              {["50K+ Contracts Analyzed", "98% Risk Detection", "30 Second Analysis", "Bank-Level Encryption", "Plain English Summaries"].map((text) => (
                <span key={text} className="text-sm text-white/30 whitespace-nowrap flex items-center gap-8">
                  {text}
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* What We Analyze - Marquee */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <p className="text-sm text-white/40 uppercase tracking-[0.2em] mb-4">What We Analyze</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Every deal in music.
          </h2>
        </div>

        {/* Marquee Cards */}
        <div className="relative">
          <div className="flex animate-marquee">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex gap-4 px-2 shrink-0">
                {[
                  { title: "Recording", icon: Mic, color: "from-red-950 to-red-900/50", border: "border-red-800/30" },
                  { title: "Publishing", icon: PenLine, color: "from-amber-950 to-amber-900/50", border: "border-amber-800/30" },
                  { title: "Management", icon: Handshake, color: "from-yellow-950 to-yellow-900/50", border: "border-yellow-800/30" },
                  { title: "Distribution", icon: Globe, color: "from-emerald-950 to-emerald-900/50", border: "border-emerald-800/30" },
                  { title: "Sync", icon: Clapperboard, color: "from-purple-950 to-purple-900/50", border: "border-purple-800/30" },
                  { title: "Producer", icon: SlidersHorizontal, color: "from-pink-950 to-pink-900/50", border: "border-pink-800/30" },
                  { title: "360 Deals", icon: RefreshCw, color: "from-cyan-950 to-cyan-900/50", border: "border-cyan-800/30" },
                  { title: "Licensing", icon: ScrollText, color: "from-teal-950 to-teal-900/50", border: "border-teal-800/30" },
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={`${setIndex}-${item.title}`}
                      className={`shrink-0 w-44 h-44 p-5 bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer`}
                    >
                      <IconComponent className="w-7 h-7 text-white/60" strokeWidth={1.5} />
                      <span className="text-base font-medium text-white/90">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none z-10" />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] mb-4">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              From upload to insight
              <br />
              <span className="text-white/40">in under 30 seconds.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload",
                description: "Drop any contract — PDF, Word, or plain text. We support all standard formats.",
                icon: Upload,
              },
              {
                step: "02",
                title: "Analyze",
                description: "Our AI reads every clause, identifies risks, and translates legal jargon into plain English.",
                icon: FileText,
              },
              {
                step: "03",
                title: "Act",
                description: "Get specific recommendations on what to negotiate and questions to ask before signing.",
                icon: Check,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-7xl font-bold text-white/[0.03] absolute -top-4 -left-2">{item.step}</div>
                <div className="relative pt-8">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-white/50 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pills Section */}
      <FeaturePills />

      {/* Stats & Trust Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] mb-4">Trusted by Creators</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              The numbers speak
              <br />
              <span className="text-white/40">for themselves.</span>
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large Stat Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:row-span-2 p-8 bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 rounded-3xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px] group-hover:bg-purple-500/30 transition-all" />
              <div className="relative z-10">
                <p className="text-sm text-purple-400 uppercase tracking-wider mb-4">Contracts Analyzed</p>
                <p className="text-7xl font-bold text-white mb-2">50K+</p>
                <p className="text-white/50 mb-8">Music contracts reviewed and analyzed by our AI</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Recording Deals</span>
                    <span className="text-sm font-medium text-white">18,420</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[75%] h-full bg-purple-500 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Publishing</span>
                    <span className="text-sm font-medium text-white">12,850</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[52%] h-full bg-purple-500 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/50">Sync & Licensing</span>
                    <span className="text-sm font-medium text-white">9,200</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[38%] h-full bg-purple-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Risk Detection Stat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-3xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-4xl font-bold text-white">98%</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Risk Detection Rate</h3>
              <p className="text-sm text-white/40">Unfavorable clauses identified before signing</p>
            </motion.div>

            {/* Speed Stat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="p-8 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-3xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-4xl font-bold text-white">&lt;30s</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Analysis Time</h3>
              <p className="text-sm text-white/40">Full contract breakdown in seconds</p>
            </motion.div>

            {/* Wide Card - What We Catch */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 p-8 bg-white/[0.02] border border-white/10 rounded-3xl"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Common issues we catch</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { issue: "Perpetual rights grants", pct: "34%" },
                  { issue: "Below-market royalty rates", pct: "28%" },
                  { issue: "Unfair recoupment terms", pct: "22%" },
                  { issue: "Hidden exclusivity clauses", pct: "16%" },
                ].map((item) => (
                  <div key={item.issue} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                    <span className="text-sm text-white/70">{item.issue}</span>
                    <span className="text-sm font-medium text-red-400">{item.pct}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Row - Security & Testimonial */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Bank-Level Security</h3>
                  <p className="text-sm text-white/40">Your contracts are always private</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["AES-256 Encryption", "SOC 2 Compliant", "GDPR Ready", "No Data Sharing"].map((badge) => (
                  <span key={badge} className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-8 bg-white/[0.02] border border-white/10 rounded-3xl"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-white/70 mb-4 leading-relaxed">
                "EasyTerms caught a perpetual rights clause in my publishing deal that would have cost me ownership of my catalog forever. Worth every penny."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-400">JM</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Jordan Mitchell</p>
                  <p className="text-xs text-white/40">Independent Artist</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Ready to understand
            <br />
            your contracts?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/50 mb-10"
          >
            Upload your first contract free. No credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "max-w-lg mx-auto border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                isDragging
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/20 hover:border-white/40 hover:bg-white/[0.02]"
              )}
            >
              <Upload className={cn(
                "w-10 h-10 mx-auto mb-4 transition-colors",
                isDragging ? "text-purple-400" : "text-white/30"
              )} />
              <p className="text-lg font-medium text-white mb-2">Drop your contract here</p>
              <p className="text-sm text-white/40">PDF, Word, or text files</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img src="/darkModeS.svg" alt="EasyTerms" className="h-6 mb-4" />
              <p className="text-sm text-white/40">
                Contract analysis for creators.
              </p>
            </div>

            {[
              { title: "Product", links: [["Analyze", "/analyze"], ["Dashboard", "/dashboard"], ["Templates", "/dashboard/templates"], ["Pricing", "/pricing"]] },
              { title: "Resources", links: [["FAQ", "/dashboard/faq"], ["Blog", "/dashboard/blog"]] },
              { title: "Company", links: [["About", "#"], ["Contact", "#"]] },
              { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-medium text-white mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/40 hover:text-white transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
            <p className="text-sm text-white/30">
              &copy; {new Date().getFullYear()} EasyTerms. All rights reserved.
            </p>
            <p className="text-sm text-white/30 mt-2 md:mt-0">
              Your data is encrypted and never shared.
            </p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        /* Feature Pills */
        .feature-pills__wrap {
          color: #f2f2f2;
          background-color: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25em;
          width: 100%;
          max-width: 75em;
          height: 40em;
          position: relative;
          overflow: clip;
        }

        .feature-pills__layout {
          justify-content: flex-start;
          align-items: stretch;
          width: 100%;
          height: 100%;
          display: flex;
          position: relative;
        }

        .feature-pills__col {
          width: 50%;
          position: relative;
        }

        .feature-pills__col.is--visual {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feature-pills__info-collection {
          flex-flow: column;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          height: 100%;
          padding: 1.25em;
          display: flex;
        }

        .feature-pills__info-list {
          --content-item-expanded: 25em;
          gap: 0.75em;
          flex-flow: column;
          flex: none;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
        }

        .feature-pills__info-item {
          padding: 0;
          position: relative;
          overflow: hidden;
        }

        .feature-pills__item-bg {
          z-index: 0;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 2em;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0%;
        }

        .feature-pills__item-button {
          z-index: 1;
          gap: 0.625em;
          color: inherit;
          background-color: transparent;
          border: none;
          cursor: pointer;
          flex-flow: row;
          justify-content: flex-start;
          align-items: center;
          padding: 0.75em 1.25em;
          display: flex;
          position: relative;
          transition: opacity 0.4s ease-in-out 0.3s;
        }

        [data-active="true"] .feature-pills__item-button {
          opacity: 0;
          transition: opacity 0.05s ease-in-out 0s;
        }

        .feature-pills__item-label {
          letter-spacing: -0.015em;
          white-space: nowrap;
          flex: none;
          font-size: 1.125em;
          font-weight: 500;
        }

        .feature-pills__item-icon {
          aspect-ratio: 1;
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 100em;
          flex: none;
          justify-content: center;
          align-items: center;
          width: 1.25em;
          padding: 0;
          display: flex;
          position: relative;
        }

        .feature-pills__item-icon-bar {
          background-color: #fff;
          flex: none;
          width: 1px;
          height: 50%;
          padding: 0;
          position: absolute;
        }

        .feature-pills__item-icon-bar.is--horizontal {
          width: 50%;
          height: 1px;
        }

        .feature-pills__item-content {
          z-index: 2;
          pointer-events: none;
          position: absolute;
          inset: 0%;
        }

        .feature-pills__item-mask {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .feature-pills__item-inner {
          max-width: var(--content-item-expanded);
          flex-flow: column;
          justify-content: flex-start;
          align-items: flex-start;
          width: max-content;
          padding: 1.25em 1.25em 1.5em;
          display: flex;
          opacity: 0;
          transition: opacity 0.3s ease-in-out 0s;
        }

        [data-active="true"] .feature-pills__item-inner {
          opacity: 1;
        }

        .feature-pills__item-body {
          margin: 0;
          font-size: 1.125em;
          font-weight: 500;
          line-height: 1.4;
        }

        .feature-pills__item-body-span {
          opacity: 0.5;
          font-weight: 400;
        }

        .feature-pills__visual-collection {
          z-index: 0;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .feature-pills__visual-list {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .feature-pills__visual-item {
          opacity: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0%;
          transition: opacity 0.35s ease-in-out;
        }

        .feature-pills__visual-item[data-active="true"] {
          opacity: 1;
        }

        .feature-pills__visual-cover {
          z-index: 1;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0%;
          transition: opacity 0.35s ease-in-out;
        }

        .feature-pills__visual-cover[data-active="false"] {
          opacity: 0;
        }

        .feature-pills__close {
          z-index: 2;
          position: absolute;
          top: 1em;
          right: 1em;
          transform: scale(0) rotate(135deg);
          opacity: 0;
          pointer-events: none;
          transition: all 0.5s cubic-bezier(0.7, 0, 0.3, 1);
        }

        [data-feature-pills-active="true"] .feature-pills__close {
          transform: scale(1) rotate(45deg);
          opacity: 1;
          pointer-events: auto;
        }

        .feature-pills__close-button {
          aspect-ratio: 1;
          backdrop-filter: blur(10px);
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 10em;
          justify-content: center;
          align-items: center;
          width: 2.5em;
          display: flex;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .feature-pills__close-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        @media screen and (max-width: 991px) {
          .feature-pills__wrap {
            background-color: transparent;
            border: none;
            border-radius: 0;
            height: auto;
          }

          .feature-pills__layout {
            flex-flow: column;
          }

          .feature-pills__col {
            width: 100%;
          }

          .feature-pills__col.is--visual {
            aspect-ratio: 1;
            border-radius: 1.25em;
            border-left: none;
            order: -9999;
            overflow: hidden;
          }

          .feature-pills__info-collection {
            padding: 2em 0;
          }

          .feature-pills__info-list {
            flex-flow: wrap;
            justify-content: flex-start;
            align-items: flex-start;
            --content-item-expanded: 100%;
          }

          .feature-pills__info-item {
            width: 100%;
          }

          .feature-pills__item-button {
            justify-content: space-between;
            width: 100%;
          }
        }
        @keyframes twinkle1 {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes twinkle2 {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes twinkle3 {
          0%, 100% { opacity: 0.5; }
          33% { opacity: 1; }
          66% { opacity: 0.2; }
        }
        @keyframes twinkle4 {
          0%, 100% { opacity: 0.2; }
          25% { opacity: 0.8; }
          75% { opacity: 0.4; }
        }
        .animate-twinkle1 {
          animation: twinkle1 3s ease-in-out infinite;
        }
        .animate-twinkle2 {
          animation: twinkle2 4s ease-in-out infinite;
        }
        .animate-twinkle3 {
          animation: twinkle3 5s ease-in-out infinite;
        }
        .animate-twinkle4 {
          animation: twinkle4 3.5s ease-in-out infinite;
        }

        /* Two-Step Scaling Navigation */
        .twostep-nav {
          --cubic-default: cubic-bezier(0.625, 0.05, 0, 1);
          --animation-ease: 0.2s ease;
          --duration-default: 0.5s;
          --duration-default-long: 0.75s;
          --duration-default-half: 0.25s;
          --animation-default: var(--duration-default) var(--cubic-default);
          --animation-default-long: var(--duration-default-long) var(--cubic-default);
          --animation-default-half: var(--duration-default-half) var(--cubic-default);

          z-index: 100;
          pointer-events: none;
          position: fixed;
          inset: 0;
        }

        .twostep-nav__bg {
          z-index: 0;
          opacity: 0;
          pointer-events: auto;
          visibility: hidden;
          background-color: rgba(0, 0, 0, 0.5);
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0% auto auto 0%;
          transition: opacity var(--animation-default), visibility var(--animation-default);
        }

        [data-nav-status="active"] .twostep-nav__bg {
          opacity: 1;
          visibility: visible;
        }

        .twostep-nav__wrap {
          justify-content: center;
          align-items: stretch;
          width: 100%;
          display: flex;
          position: absolute;
          top: 0;
          left: 0;
        }

        .twostep-nav__width {
          flex-flow: column;
          flex: none;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          max-width: 48em;
          padding-top: 1.25em;
          padding-left: 1.25em;
          padding-right: 1.25em;
          display: flex;
        }

        .twostep-nav__bar {
          pointer-events: auto;
          color: #201d1d;
          width: 100%;
          max-width: 25em;
          position: relative;
          transition: max-width var(--animation-default-long) 0.2s;
        }

        [data-nav-status="active"] .twostep-nav__bar {
          transition: max-width var(--animation-default) 0s;
          max-width: 100%;
        }

        .twostep-nav__back {
          z-index: 0;
          position: absolute;
          inset: 0%;
          transition: all var(--animation-default);
          inset: 0em;
        }

        [data-nav-status="active"] .twostep-nav__back {
          inset: -0.25em;
        }

        .twostep-nav__back-bg {
          background-color: #f2f2f2;
          border-radius: 0.5em;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0%;
          transition: background-color var(--animation-ease);
        }

        .twostep-nav__top {
          z-index: 1;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 4em;
          padding: 1.25em;
          display: flex;
          position: relative;
        }

        .twostep-nav__logo {
          justify-content: flex-start;
          align-items: center;
          width: 6em;
          height: 100%;
          display: flex;
        }

        .twostep-nav__toggle {
          pointer-events: auto;
          cursor: pointer;
          background-color: transparent;
          border: none;
          justify-content: center;
          align-items: center;
          width: 2.5em;
          height: 2.5em;
          padding: 0;
          display: flex;
          position: relative;
        }

        .twostep-nav__toggle-bar {
          background-color: #131313;
          width: 1.875em;
          height: 0.125em;
          position: absolute;
          transition: transform var(--animation-default);
          transform: translateY(-0.25em) rotate(0.001deg);
        }

        .twostep-nav__toggle-bar:nth-child(2) {
          transform: translateY(0.15em) rotate(0.001deg);
        }

        .twostep-nav__toggle:hover .twostep-nav__toggle-bar {
          transform: translateY(0.25em) rotate(0.001deg);
        }

        .twostep-nav__toggle:hover .twostep-nav__toggle-bar:nth-child(2) {
          transform: translateY(-0.15em) rotate(0.001deg);
        }

        [data-nav-status="active"] .twostep-nav__toggle .twostep-nav__toggle-bar {
          transform: translateY(0em) rotate(45deg);
        }

        [data-nav-status="active"] .twostep-nav__toggle .twostep-nav__toggle-bar:nth-child(2) {
          transform: translateY(0em) rotate(-45deg);
        }

        .twostep-nav__top-line {
          z-index: 2;
          background-color: rgba(0, 0, 0, 0.1);
          height: 1px;
          position: absolute;
          bottom: 0;
          left: 0.5em;
          right: 0.5em;
          transition: all var(--animation-default) 0s;
          opacity: 0;
        }

        [data-nav-status="active"] .twostep-nav__top-line {
          transition: all var(--animation-default) 0.1s;
          opacity: 1;
        }

        .twostep-nav__bottom {
          grid-template-rows: 0fr;
          width: 100%;
          display: grid;
          position: relative;
          overflow: hidden;
          transition: grid-template-rows var(--animation-default) 0s;
        }

        [data-nav-status="active"] .twostep-nav__bottom {
          transition: grid-template-rows var(--animation-default-long) 0.25s;
          grid-template-rows: 1fr;
        }

        .twostep-nav__bottom-overflow {
          flex-flow: column;
          justify-content: flex-start;
          align-items: center;
          height: 100%;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        .twostep-nav__bottom-inner {
          flex-flow: column;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          padding: 1.5em;
          display: flex;
          position: relative;
        }

        .twostep-nav__bottom-row {
          justify-content: flex-start;
          align-items: flex-start;
          width: 100%;
          display: flex;
        }

        .twostep-nav__bottom-row > * {
          transition: all var(--animation-default) 0s;
          transform: translateY(2em);
          opacity: 0;
        }

        .twostep-nav__bottom-row > *:nth-child(2) {
          transition-delay: 0.075s;
        }

        [data-nav-status="active"] .twostep-nav__bottom-row > * {
          transition: all var(--animation-default-long) 0.5s;
          transform: translateY(0em);
          opacity: 1;
        }

        [data-nav-status="active"] .twostep-nav__bottom-row > *:nth-child(2) {
          transition-delay: 0.575s;
        }

        .twostep-nav__bottom-col {
          flex: 1;
          min-height: 100%;
          display: flex;
        }

        .twostep-nav__info {
          gap: 2em;
          flex-flow: column;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          display: flex;
        }

        .twostep-nav__ul {
          flex-flow: column;
          justify-content: flex-start;
          align-items: stretch;
          width: 100%;
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
        }

        .twostep-nav__ul.is--small {
          gap: 0.25em 1em;
          flex-flow: wrap;
          justify-content: flex-start;
          align-items: flex-start;
        }

        .twostep-nav__li {
          list-style: none;
        }

        .twostep-nav__link {
          color: inherit;
          width: 100%;
          padding-top: 0.375em;
          padding-bottom: 0.375em;
          text-decoration: none;
          position: relative;
          display: block;
        }

        .twostep-nav__link:hover {
          opacity: 0.7;
        }

        .twostep-nav__link-span {
          letter-spacing: -0.04em;
          font-size: 2.125em;
          font-weight: 400;
          line-height: 1;
        }

        .twostep-nav__link-eyebrow {
          opacity: 0.7;
          letter-spacing: -0.02em;
          font-size: 1em;
          font-weight: 400;
          line-height: 1;
        }

        .twostep-nav__visual {
          aspect-ratio: 1;
          border-radius: 0.375em;
          width: 100%;
          overflow: hidden;
        }

        @media screen and (max-width: 767px) {
          .twostep-nav__bottom-col.is--visual {
            display: none;
          }

          .twostep-nav__top-line {
            bottom: -0.5em;
            left: 1em;
            right: 1em;
          }

          [data-nav-status="active"] .twostep-nav__top-line {
            transition: all var(--animation-default) 0.2s;
            inset: auto 0em -0.5em;
          }

          [data-nav-status="active"] .twostep-nav__back {
            inset: -1.25em;
          }

          .twostep-nav__bottom {
            transition: grid-template-rows var(--animation-default) 0s, transform var(--animation-default) 0s;
            transform: translateY(-0.625em);
          }

          [data-nav-status="active"] .twostep-nav__bottom {
            transition: grid-template-rows var(--animation-default-long) 0.25s, transform var(--animation-default) 0.25s;
            transform: translateY(0em);
          }
        }
      `}</style>
    </main>
  );
}
