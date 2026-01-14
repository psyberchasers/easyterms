"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const HeroSs22 = () => {
  return (
    <section className="relative min-h-[70vh] text-white overflow-hidden flex items-center" style={{ backgroundImage: 'url(/G-UKZbEWQAAVQ8L.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scaleY(-1)' }}>
      {/* Content wrapper - flipped back to normal */}
      <div className="w-full" style={{ transform: 'scaleY(-1)' }}>
        {/* Decorative circle */}
        <div className="absolute left-12 top-1/3 w-12 h-12 rounded-full border border-white/20 hidden lg:block" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <span className="text-lg">+</span>
          <span className="text-xs tracking-[0.2em] uppercase">Our Technology</span>
        </motion.div>

        {/* Main Headline with inline elements */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-12"
        >
          Our AI-Powered{" "}
          <span className="inline-flex items-center align-middle mx-1">
            <span className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L12 22M2 12L22 12M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" strokeLinecap="round" />
              </svg>
            </span>
          </span>{" "}
          analysis fuels{" "}
          <span className="inline-flex items-center align-middle mx-1">
            <span className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>{" "}
          confident contract decisions.
        </motion.h2>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/analyze"
            className="inline-flex items-center justify-center h-12 px-8 bg-white text-purple-600 font-medium hover:bg-white/90 transition-colors"
          >
            Explore Platform
          </Link>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

export { HeroSs22 };
