"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Upload, Zap, FileText, Shield, Lock, Eye, Clock, X,
  ArrowRight, Sparkles, Scale, MessageSquare, Share2,
  Bot, GitCompareArrows, ShieldCheck, KeyRound, ServerCrash, Fingerprint,
} from "lucide-react";
import ScrollCards from "@/components/ScrollCards";
import TestimonialCards from "@/components/TestimonialCards";

/* ── Animation helpers ─────────────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0, 1] as [number, number, number, number] },
});

const sectionReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0, 1] as [number, number, number, number] },
};

/* ── Data ──────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Upload any contract and get a full breakdown in under 30 seconds. PDF, DOCX, or plain text.",
  },
  {
    icon: Shield,
    title: "Risk Detection",
    description: "Automatically flag unfavorable clauses, hidden obligations, and one-sided terms that could cost you.",
  },
  {
    icon: FileText,
    title: "Plain English",
    description: "Complex legal language translated into clear, simple summaries anyone can understand.",
  },
  {
    icon: Scale,
    title: "Industry Benchmarks",
    description: "Compare your terms against standard industry deals. Know if you're getting a fair offer.",
  },
  {
    icon: MessageSquare,
    title: "Negotiation Points",
    description: "Get specific counter-proposals and talking points to bring to the table with confidence.",
  },
  {
    icon: Share2,
    title: "Share & Collaborate",
    description: "Send your analysis to a lawyer, manager, or collaborator with a single link.",
  },
];

const steps = [
  { num: "01", title: "Upload", description: "Drop your contract — PDF, Word, or snap a photo. No account needed to start.", icon: Upload },
  { num: "02", title: "Analyze", description: "AI reads every clause, identifies risks, and translates legalese into plain English.", icon: Sparkles },
  { num: "03", title: "Act", description: "Get actionable recommendations on what to negotiate before you sign.", icon: ArrowRight },
];


/* ═══════════════════════════════════════════════
   V2 — ngrok-inspired landing page
   ═══════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">

      {/* ── NAV ────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/darkModeS.svg" alt="EasyTerms" className="h-6" />
            <span className="text-base font-semibold text-white" style={{ fontFamily: 'var(--font-circular)' }}>EasyTerms</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing#faq" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block" style={{ fontFamily: 'var(--font-circular)' }}>
              FAQ
            </Link>
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block" style={{ fontFamily: 'var(--font-circular)' }}>
              Pricing
            </Link>
            {!user && (
              <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors" style={{ fontFamily: 'var(--font-circular)' }}>
                Log in
              </Link>
            )}
            <Link
              href={user ? "/dashboard" : "/analyze"}
              className="h-9 px-4 text-sm font-medium rounded-lg bg-white text-black hover:bg-white/90 transition-all flex items-center"
              style={{ fontFamily: 'var(--font-circular)' }}
            >
              {user ? "Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────── */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fade(0)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/50" style={{ fontFamily: 'var(--font-circular)' }}>
              Free to analyze — no account required
            </span>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.95] mb-6"
            style={{ fontFamily: 'var(--font-circular)' }}
          >
            Your music contracts.
            <br />
            <span className="text-white/30">Finally understood.</span>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="text-lg sm:text-xl text-white/40 leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ fontFamily: 'var(--font-circular)' }}
          >
            AI-powered contract analysis that breaks down complex legal language, flags hidden risks, and gives you real negotiation leverage — in under 30 seconds.
          </motion.p>

          <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="h-12 px-6 text-sm font-semibold rounded-lg bg-white text-black hover:bg-white/90 transition-all flex items-center gap-2"
              style={{ fontFamily: 'var(--font-circular)' }}
            >
              Analyze a contract — free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="h-12 px-6 text-sm font-medium rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
              style={{ fontFamily: 'var(--font-circular)' }}
            >
              See how it works
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── SCROLL CARDS — Animated contract types ── */}
      <ScrollCards />

      {/* ── FEATURES GRID ──────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-16">
            <p className="text-sm text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-circular)' }}>
              Everything you need to
              <br />
              <span className="text-white/30">sign with confidence.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="group p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-4 group-hover:bg-white/[0.1] transition-colors">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ fontFamily: 'var(--font-circular)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed" style={{ fontFamily: 'var(--font-circular)' }}>
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS — Animated card stack ── */}
      <TestimonialCards />

      {/* ── HOW IT WORKS ───────────────────── */}
      <section id="how-it-works" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-20">
            <p className="text-sm text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-circular)' }}>
              Three steps.
              <br />
              <span className="text-white/30">Zero confusion.</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent hidden lg:block" />

            {/* ── Step 01: Upload ── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 mb-24"
            >
              <div className="w-full lg:w-1/2 relative">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <div className="border-b border-white/[0.06] px-5 py-3 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/30" style={{ fontFamily: 'var(--font-circular)' }}>Upload Contract</span>
                  </div>
                  <div className="p-8">
                    <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-10 text-center hover:border-white/[0.2] transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-5 h-5 text-white/40" />
                      </div>
                      <p className="text-sm font-medium text-white/50 mb-1" style={{ fontFamily: 'var(--font-circular)' }}>
                        Drop your contract here
                      </p>
                      <p className="text-xs text-white/25" style={{ fontFamily: 'var(--font-circular)' }}>
                        PDF, DOCX, or take a photo
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <span className="h-7 px-3 text-[10px] rounded-md bg-white/[0.08] text-white/40 flex items-center" style={{ fontFamily: 'var(--font-circular)' }}>.pdf</span>
                        <span className="h-7 px-3 text-[10px] rounded-md bg-white/[0.08] text-white/40 flex items-center" style={{ fontFamily: 'var(--font-circular)' }}>.docx</span>
                        <span className="h-7 px-3 text-[10px] rounded-md bg-white/[0.08] text-white/40 flex items-center" style={{ fontFamily: 'var(--font-circular)' }}>.txt</span>
                        <span className="h-7 px-3 text-[10px] rounded-md bg-white/[0.08] text-white/40 flex items-center" style={{ fontFamily: 'var(--font-circular)' }}>camera</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white/20 bg-[#0a0a0a] z-10 items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
              <div className="w-full lg:w-1/2 lg:text-left">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center"><Upload className="w-5 h-5 text-white/50" /></div>
                  <span className="text-xs text-white/20 uppercase tracking-widest font-medium" style={{ fontFamily: 'var(--font-circular)' }}>Step 01</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-circular)' }}>Upload</h3>
                <p className="text-base text-white/40 leading-relaxed max-w-md" style={{ fontFamily: 'var(--font-circular)' }}>Drop your contract — PDF, Word, or snap a photo. No account needed to start.</p>
              </div>
            </motion.div>

            {/* ── Step 02: Analyze ── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="relative flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16 mb-24"
            >
              <div className="w-full lg:w-1/2 relative">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <div className="border-b border-white/[0.06] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs text-white/30" style={{ fontFamily: 'var(--font-circular)' }}>Analysis — recording-deal.pdf</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400" style={{ fontFamily: 'var(--font-circular)' }}>Complete</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {/* Risk score */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                      <span className="text-xs text-white/40" style={{ fontFamily: 'var(--font-circular)' }}>Overall Risk Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="w-[72%] h-full rounded-full bg-gradient-to-r from-amber-400 to-red-400" />
                        </div>
                        <span className="text-sm font-bold text-amber-400" style={{ fontFamily: 'var(--font-circular)' }}>7.2</span>
                      </div>
                    </div>
                    {/* Findings */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/[0.04] border border-red-500/[0.08]">
                      <span className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-red-400">!</span></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-red-400" style={{ fontFamily: 'var(--font-circular)' }}>Perpetual rights — no reversion</p>
                      </div>
                      <span className="text-[10px] text-red-400/60" style={{ fontFamily: 'var(--font-circular)' }}>§4.2</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/[0.08]">
                      <span className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-amber-400">~</span></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-400" style={{ fontFamily: 'var(--font-circular)' }}>12% royalty rate — below average</p>
                      </div>
                      <span className="text-[10px] text-amber-400/60" style={{ fontFamily: 'var(--font-circular)' }}>§6.1</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/[0.04] border border-green-500/[0.08]">
                      <span className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-green-400">&#10003;</span></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-green-400" style={{ fontFamily: 'var(--font-circular)' }}>Creative control retained</p>
                      </div>
                      <span className="text-[10px] text-green-400/60" style={{ fontFamily: 'var(--font-circular)' }}>§3.1</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                      <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-blue-400">5</span></span>
                      <p className="text-xs text-white/40" style={{ fontFamily: 'var(--font-circular)' }}>5 more findings...</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white/20 bg-[#0a0a0a] z-10 items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
              <div className="w-full lg:w-1/2 lg:text-right">
                <div className="inline-flex items-center gap-3 mb-4 lg:flex-row-reverse">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center"><Sparkles className="w-5 h-5 text-white/50" /></div>
                  <span className="text-xs text-white/20 uppercase tracking-widest font-medium" style={{ fontFamily: 'var(--font-circular)' }}>Step 02</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-circular)' }}>Analyze</h3>
                <p className="text-base text-white/40 leading-relaxed max-w-md ml-auto" style={{ fontFamily: 'var(--font-circular)' }}>AI reads every clause, identifies risks, and translates legalese into plain English.</p>
              </div>
            </motion.div>

            {/* ── Step 03: Act ── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16"
            >
              <div className="w-full lg:w-1/2 relative">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <div className="border-b border-white/[0.06] px-5 py-3 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/30" style={{ fontFamily: 'var(--font-circular)' }}>Negotiation Playbook</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium" style={{ fontFamily: 'var(--font-circular)' }}>Priority</span>
                        <span className="text-xs font-medium text-white/70" style={{ fontFamily: 'var(--font-circular)' }}>Add rights reversion clause</span>
                      </div>
                      <p className="text-xs text-white/35 leading-relaxed mb-2" style={{ fontFamily: 'var(--font-circular)' }}>
                        &ldquo;Request that all master rights revert to Artist after 20 years, or 5 years after Label ceases commercial exploitation.&rdquo;
                      </p>
                      <div className="flex gap-2">
                        <span className="h-6 px-2.5 text-[10px] rounded-md bg-white/[0.06] text-white/30 flex items-center" style={{ fontFamily: 'var(--font-circular)' }}>Copy language</span>
                        <span className="h-6 px-2.5 text-[10px] rounded-md bg-white/[0.06] text-white/30 flex items-center" style={{ fontFamily: 'var(--font-circular)' }}>See clause §4.2</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium" style={{ fontFamily: 'var(--font-circular)' }}>Negotiate</span>
                        <span className="text-xs font-medium text-white/70" style={{ fontFamily: 'var(--font-circular)' }}>Increase royalty rate</span>
                      </div>
                      <p className="text-xs text-white/35 leading-relaxed" style={{ fontFamily: 'var(--font-circular)' }}>
                        &ldquo;Industry standard for new artists is 15-20%. Request minimum 18% with escalation clauses based on sales milestones.&rdquo;
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium" style={{ fontFamily: 'var(--font-circular)' }}>Suggest</span>
                        <span className="text-xs font-medium text-white/70" style={{ fontFamily: 'var(--font-circular)' }}>Cap exclusivity period</span>
                      </div>
                      <p className="text-xs text-white/35 leading-relaxed" style={{ fontFamily: 'var(--font-circular)' }}>
                        &ldquo;Limit exclusive rights to 3 album cycles or 5 years, whichever comes first.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white/20 bg-[#0a0a0a] z-10 items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
              <div className="w-full lg:w-1/2 lg:text-left">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center"><ArrowRight className="w-5 h-5 text-white/50" /></div>
                  <span className="text-xs text-white/20 uppercase tracking-widest font-medium" style={{ fontFamily: 'var(--font-circular)' }}>Step 03</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-circular)' }}>Act</h3>
                <p className="text-base text-white/40 leading-relaxed max-w-md" style={{ fontFamily: 'var(--font-circular)' }}>Get actionable recommendations on what to negotiate before you sign.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW ───────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-12">
            <p className="text-sm text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
              See it in action
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-circular)' }}>
              From legalese to
              <br />
              <span className="text-white/30">plain English.</span>
            </h2>
          </motion.div>

          <motion.div
            {...sectionReveal}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            {/* Mock contract analysis UI */}
            <div className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <span className="text-xs text-white/30 ml-2" style={{ fontFamily: 'var(--font-circular)' }}>
                recording-agreement-2024.pdf — Analysis
              </span>
            </div>

            <div className="grid md:grid-cols-2 divide-x divide-white/[0.06]">
              {/* Left: Contract clause */}
              <div className="p-6">
                <p className="text-xs text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-circular)' }}>Original Clause</p>
                <p className="text-sm text-white/50 leading-relaxed font-mono">
                  &ldquo;Artist hereby grants to Label an exclusive, irrevocable, perpetual license to all Masters recorded during the Term, including all rights of reproduction, distribution, and public performance throughout the universe, in any and all media now known or hereafter devised.&rdquo;
                </p>
              </div>

              {/* Right: AI analysis */}
              <div className="p-6">
                <p className="text-xs text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-circular)' }}>AI Analysis</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded bg-red-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] font-bold text-red-400">!</span>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-red-400" style={{ fontFamily: 'var(--font-circular)' }}>High Risk — Perpetual Rights</p>
                      <p className="text-xs text-white/40 mt-1" style={{ fontFamily: 'var(--font-circular)' }}>
                        Label owns your recordings forever. Standard deals have a reversion clause after 15-25 years.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] font-bold text-amber-400">~</span>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-amber-400" style={{ fontFamily: 'var(--font-circular)' }}>Caution — Universe-wide scope</p>
                      <p className="text-xs text-white/40 mt-1" style={{ fontFamily: 'var(--font-circular)' }}>
                        &ldquo;Throughout the universe&rdquo; is standard but paired with perpetual license this is aggressive.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] font-bold text-blue-400">&rarr;</span>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-blue-400" style={{ fontFamily: 'var(--font-circular)' }}>Negotiate: Add reversion clause</p>
                      <p className="text-xs text-white/40 mt-1" style={{ fontFamily: 'var(--font-circular)' }}>
                        Request rights revert to artist after 20 years or if label fails to exploit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AI CHAT ──────────────────────────── */}
      <section className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <motion.div {...sectionReveal}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/[0.06] mb-6">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-purple-400" style={{ fontFamily: 'var(--font-circular)' }}>AI Assistant</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
                Ask anything about
                <br />
                <span className="text-white/30">your contract.</span>
              </h2>
              <p className="text-base text-white/40 leading-relaxed mb-6" style={{ fontFamily: 'var(--font-circular)' }}>
                Not sure what a clause means? Wondering if a term is standard? Our AI chat understands your entire contract and answers questions in plain English — like having a music lawyer on call.
              </p>
              <ul className="space-y-3">
                {[
                  "\"What happens if I want to leave the label early?\"",
                  "\"Is this royalty rate fair for a new artist?\"",
                  "\"What rights am I giving up with this clause?\"",
                ].map((q) => (
                  <li key={q} className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-purple-400/60 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/50 italic" style={{ fontFamily: 'var(--font-circular)' }}>{q}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Mock chat UI */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
            >
              <div className="border-b border-white/[0.06] px-5 py-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-white/50" style={{ fontFamily: 'var(--font-circular)' }}>Contract AI</span>
              </div>
              <div className="p-5 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-white/[0.08] rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-circular)' }}>
                      What does the &ldquo;perpetual license&rdquo; clause actually mean for me?
                    </p>
                  </div>
                </div>
                {/* AI response */}
                <div className="flex justify-start">
                  <div className="bg-purple-500/[0.08] border border-purple-500/10 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]">
                    <p className="text-sm text-white/70 leading-relaxed" style={{ fontFamily: 'var(--font-circular)' }}>
                      This means the label owns your recordings <span className="text-red-400 font-medium">forever</span> — even after the contract ends. You&apos;d never get them back. Most fair deals include a <span className="text-green-400 font-medium">reversion clause</span> (15-25 years). I&apos;d strongly recommend negotiating one.
                    </p>
                  </div>
                </div>
                {/* User follow-up */}
                <div className="flex justify-end">
                  <div className="bg-white/[0.08] rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-white/70" style={{ fontFamily: 'var(--font-circular)' }}>
                      How should I phrase that in my counter-offer?
                    </p>
                  </div>
                </div>
                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="bg-purple-500/[0.08] border border-purple-500/10 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CONTRACT COMPARISON ────────────── */}
      <section className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mock comparison UI */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden order-2 lg:order-1"
            >
              <div className="border-b border-white/[0.06] px-5 py-3 flex items-center gap-2">
                <GitCompareArrows className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-white/50" style={{ fontFamily: 'var(--font-circular)' }}>Compare Contracts</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                <div className="p-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-circular)' }}>Contract A</p>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Royalty Rate</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-400" style={{ fontFamily: 'var(--font-circular)' }}>12%</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400/80">Below avg</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Term Length</p>
                      <span className="text-sm font-semibold text-amber-400" style={{ fontFamily: 'var(--font-circular)' }}>7 years</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Rights Reversion</p>
                      <span className="text-sm font-semibold text-red-400" style={{ fontFamily: 'var(--font-circular)' }}>None</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Advance</p>
                      <span className="text-sm font-semibold text-white/60" style={{ fontFamily: 'var(--font-circular)' }}>$50,000</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-circular)' }}>Contract B</p>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Royalty Rate</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-400" style={{ fontFamily: 'var(--font-circular)' }}>20%</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400/80">Fair</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Term Length</p>
                      <span className="text-sm font-semibold text-green-400" style={{ fontFamily: 'var(--font-circular)' }}>3 years</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Rights Reversion</p>
                      <span className="text-sm font-semibold text-green-400" style={{ fontFamily: 'var(--font-circular)' }}>After 15 yrs</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 mb-0.5" style={{ fontFamily: 'var(--font-circular)' }}>Advance</p>
                      <span className="text-sm font-semibold text-white/60" style={{ fontFamily: 'var(--font-circular)' }}>$35,000</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/[0.06] px-4 py-3">
                <p className="text-xs text-blue-400/80" style={{ fontFamily: 'var(--font-circular)' }}>
                  Recommendation: Contract B offers significantly better long-term value despite a lower advance.
                </p>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div {...sectionReveal} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/[0.06] mb-6">
                <GitCompareArrows className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-blue-400" style={{ fontFamily: 'var(--font-circular)' }}>Compare</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
                Compare deals
                <br />
                <span className="text-white/30">side by side.</span>
              </h2>
              <p className="text-base text-white/40 leading-relaxed" style={{ fontFamily: 'var(--font-circular)' }}>
                Got multiple offers? Upload them all and see a clear breakdown of how they stack up — royalty rates, term lengths, rights, and more. Make decisions based on data, not guesswork.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ENCRYPTION & SECURITY ─────────── */}
      <section className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...sectionReveal} className="text-center mb-16">
            <p className="text-sm text-white/30 uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
              Security & Privacy
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-circular)' }}>
              Your contracts
              <br />
              <span className="text-white/30">stay yours.</span>
            </h2>
            <p className="text-base text-white/40 leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-circular)' }}>
              We never share, sell, or train on your data. Every document is protected with enterprise-grade security from upload to deletion.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Lock,
                title: "AES-256 Encryption",
                description: "Military-grade encryption protects your contracts in transit and at rest. The same standard used by banks and governments.",
                color: "green",
              },
              {
                icon: ServerCrash,
                title: "You Own Your Data",
                description: "Your contracts are stored securely and only accessible by you. Delete your data at any time — no questions asked.",
                color: "green",
              },
              {
                icon: X,
                title: "Zero Data Sharing",
                description: "Your contracts are never shared with third parties, sold, or used to train AI models. Period.",
                color: "green",
              },
              {
                icon: ShieldCheck,
                title: "SOC 2 Compliant",
                description: "Our infrastructure meets the highest standards for security, availability, and confidentiality.",
                color: "green",
              },
              {
                icon: Fingerprint,
                title: "GDPR Ready",
                description: "Full compliance with data protection regulations. Request deletion of your data at any time.",
                color: "green",
              },
              {
                icon: KeyRound,
                title: "End-to-End Protection",
                description: "From the moment you upload to the moment you close the tab — your data never leaves the encrypted pipeline.",
                color: "green",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="p-6 rounded-xl border border-green-500/[0.08] bg-green-500/[0.02] hover:border-green-500/[0.15] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-green-50" style={{ fontFamily: 'var(--font-circular)' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/35 leading-relaxed" style={{ fontFamily: 'var(--font-circular)' }}>
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA + FOOTER ────────────────────── */}
      <section className="relative py-32 px-6 flex flex-col items-center justify-center">
        <p
          className="text-center uppercase tracking-[-0.05em]"
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "clamp(60px, 9vw, 156px)",
            lineHeight: 0.76,
            width: "56%",
            color: "rgb(241, 241, 241)",
          }}
        >
          Your Music. Your Terms.
        </p>
        <Link
          href="/analyze"
          className="mt-10 h-14 px-10 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all flex items-center gap-3"
          style={{ fontFamily: 'var(--font-circular)' }}
        >
          Get Started Free
        </Link>
      </section>

      <footer className="py-16 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <img src="/darkModeS.svg" alt="EasyTerms" className="h-6 mb-4" />
              <p className="text-sm text-white/40" style={{ fontFamily: 'var(--font-circular)' }}>
                Contract analysis for creators.
              </p>
            </div>
            {[
              { title: "Product", links: [["Analyze", "/analyze"], ["Dashboard", "/dashboard"], ["Templates", "/dashboard/templates"], ["Pricing", "/pricing"]] },
              { title: "Resources", links: [["FAQ", "/pricing#faq"], ["Blog", "/dashboard/blog"]] },
              { title: "Company", links: [["About", "/about"], ["Contact", "#"]] },
              { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-medium text-white mb-4" style={{ fontFamily: 'var(--font-circular)' }}>{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-white/40 hover:text-white transition-colors" style={{ fontFamily: 'var(--font-circular)' }}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06]">
            <p className="text-sm text-white/30" style={{ fontFamily: 'var(--font-circular)' }}>
              &copy; {new Date().getFullYear()} EasyTerms. All rights reserved.
            </p>
            <p className="text-sm text-white/30 mt-2 md:mt-0" style={{ fontFamily: 'var(--font-circular)' }}>
              Your data is encrypted and never shared.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
