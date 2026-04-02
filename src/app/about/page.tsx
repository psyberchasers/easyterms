"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0, 1] as [number, number, number, number] },
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
            <img src="/darkModeS.svg" alt="EasyTerms" className="h-6 w-auto" />
            <span className="text-sm font-semibold tracking-tight text-white/90" style={{ fontFamily: 'var(--font-circular)' }}>
              EasyTerms
            </span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        <motion.p
          {...fade(0)}
          className="text-xs uppercase tracking-widest text-purple-400/80 mb-6"
          style={{ fontFamily: 'var(--font-circular)' }}
        >
          About
        </motion.p>

        <motion.h1
          {...fade(0.1)}
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-12 leading-[1.1]"
          style={{ fontFamily: 'var(--font-circular)' }}
        >
          Making contracts
          <br />
          <span className="text-white/40">easy for everyone.</span>
        </motion.h1>

        <motion.div
          {...fade(0.2)}
          className="space-y-6 text-[17px] leading-[1.8] text-white/60"
          style={{ fontFamily: 'var(--font-circular)' }}
        >
          <p>
            EasyTerms was founded on a simple principle: make contracts easy and understandable for everyone.
          </p>

          <p>
            The music industry, since its inception, has always carried a reputation for being notorious and exploitative — preying on the young, the ambitious, and the uninformed. Even today, with an abundance of information and resources at our fingertips, contracts remain one of the last things that are still complicated and inaccessible for those just starting out.
          </p>

          <p className="text-white/80 font-medium text-lg">
            EasyTerms looks to change that.
          </p>

          <p>
            One of our founders, Augustus Banks, is an artist himself who has seen his fair share of contracts. He understood the difficulties artists face firsthand — not from the outside looking in, but from lived experience navigating an industry that rarely stops to explain itself. His partner, Uri Darnel, is a full-stack engineer with a deep concentration in AI. Uri brought the technical vision to match Augustus' industry insight, building a platform that uses AI for its most meaningful purpose: a tool that helps people move efficiently and confidently in their decision-making.
          </p>

          <p>
            Together, they built EasyTerms — not just as a product, but as a starting point. A resource for the newcomer learning what a 360 deal actually means, and a workflow accelerator for the seasoned professional looking to move faster alongside their legal team.
          </p>

          <p>
            At its core, EasyTerms exists to give education and clarity to the people who need it most — the artists.
          </p>
        </motion.div>

        {/* Founders */}
        <motion.div
          {...fade(0.3)}
          className="mt-16 pt-16 border-t border-white/[0.06]"
        >
          <p
            className="text-xs uppercase tracking-widest text-white/30 mb-8"
            style={{ fontFamily: 'var(--font-circular)' }}
          >
            Founders
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="font-semibold text-white/90 mb-1" style={{ fontFamily: 'var(--font-circular)' }}>Augustus Banks</p>
              <p className="text-sm text-white/40" style={{ fontFamily: 'var(--font-circular)' }}>Artist &amp; Industry Insight</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="font-semibold text-white/90 mb-1" style={{ fontFamily: 'var(--font-circular)' }}>Uri Darnel</p>
              <p className="text-sm text-white/40" style={{ fontFamily: 'var(--font-circular)' }}>Full-Stack Engineer &amp; AI</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          {...fade(0.4)}
          className="mt-16 pt-16 border-t border-white/[0.06] text-center"
        >
          <Link
            href="/analyze"
            className="inline-flex h-12 px-8 items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            style={{ fontFamily: 'var(--font-circular)' }}
          >
            Try EasyTerms free
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
