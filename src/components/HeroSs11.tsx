"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { LanguageSkillIcon, SearchVisualIcon, StarSquareIcon } from "@hugeicons-pro/core-bulk-rounded";

const HeroSs11 = () => {
  const steps = [
    {
      number: "01",
      title: "Plan",
      description: "Upload your contract, choose analysis depth, and set your priorities.",
      icon: LanguageSkillIcon,
    },
    {
      number: "02",
      title: "Analyze",
      description: "AI scans every clause, identifies risks, and highlights key terms.",
      icon: SearchVisualIcon,
    },
    {
      number: "03",
      title: "Act",
      description: "Review insights, negotiate confidently, and sign with clarity.",
      icon: StarSquareIcon,
    },
  ];

  return (
    <section className="relative min-h-[80vh] text-white overflow-hidden" style={{ backgroundColor: '#0E0B1F' }}>
      {/* Dotted Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
        {/* Fade edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0B1F] via-transparent to-[#0E0B1F]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E0B1F] via-transparent to-[#0E0B1F]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-8"
        >
          <span className="text-xs tracking-[0.2em] text-white/60 uppercase">How It Works</span>
        </motion.div>

        {/* Main Text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-2xl lg:text-3xl font-light leading-tight max-w-3xl mb-24"
        >
          EasyTerms puts creators and talent first, delivering smart, transparent contract analysis that boosts confidence, cuts risk, and drives fair deals – powered by AI, insight, and genuine care.
        </motion.p>

        {/* Timeline Steps */}
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-12 md:gap-16 lg:gap-24">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative"
              >
                {/* Background Icon */}
                {step.icon && (
                  <div className="absolute -top-16 -right-4">
                    <HugeiconsIcon icon={step.icon} size={120} className="text-purple-700" />
                  </div>
                )}

                {/* Step Number with dot */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-xs tracking-wider text-white/60">{step.number}</span>
                </div>

                {/* Title */}
                <h3 className="relative text-lg font-medium mb-2">{step.title}</h3>

                {/* Description */}
                <p className="relative text-sm text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { HeroSs11 };
