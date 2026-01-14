"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const StepsCards = () => {
  const steps = [
    {
      title: "Upload your contract",
      description: "Import any format - PDF, Word, or just paste text directly.",
      color: "bg-purple-200",
      accentColor: "bg-purple-400",
    },
    {
      title: "AI analyzes every clause",
      description: "See risks highlighted and key terms explained in plain English.",
      color: "bg-emerald-100",
      accentColor: "bg-emerald-300",
    },
    {
      title: "Act with confidence",
      description: "Turn insights into a clear action plan you can follow.",
      color: "bg-orange-100",
      accentColor: "bg-orange-300",
    },
  ];

  return (
    <section className="py-24 px-6 bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs tracking-[0.2em] text-neutral-500 uppercase mb-4"
          >
            How EasyTerms Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-light text-neutral-900"
          >
            From contracts to clarity
            <br />
            to real confidence
          </motion.h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden"
            >
              {/* Text content */}
              <div className="p-6">
                <h3 className="text-xl font-medium text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-600">
                  {step.description}
                </p>
              </div>

              {/* Colored illustration area */}
              <div className={`${step.color} h-48 relative overflow-hidden`}>
                {/* Abstract shapes */}
                <div className={`absolute top-4 left-4 w-16 h-16 ${step.accentColor} rounded-xl rotate-12 opacity-60`} />
                <div className={`absolute bottom-8 right-8 w-20 h-20 ${step.accentColor} rounded-full opacity-40`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center`}>
                  <span className="text-lg font-semibold text-neutral-700">0{i + 1}</span>
                </div>
                <div className={`absolute bottom-4 left-8 px-3 py-1.5 ${step.accentColor} rounded-full text-xs font-medium text-white`}>
                  Step {i + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Start analyzing
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export { StepsCards };
