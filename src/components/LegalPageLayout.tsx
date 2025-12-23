"use client";

import { motion, useInView } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TermItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalPageLayoutProps = {
  title?: string;
  terms?: TermItem[];
  className?: string;
};

const TermSection = ({
  term,
  index,
  children,
  setActiveTerm,
}: {
  term: TermItem;
  index: number;
  children: React.ReactNode;
  setActiveTerm: (index: number) => void;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 0.3,
    margin: "-100px 0px -50% 0px",
  });

  useEffect(() => {
    if (isInView) {
      setActiveTerm(index);
    }
  }, [isInView, index, setActiveTerm]);

  return (
    <div ref={ref} id={term.id} className="space-y-4 md:space-y-6">
      {children}
    </div>
  );
};

const LegalPageLayout = ({
  title = "Terms & Conditions",
  terms = [],
  className,
}: LegalPageLayoutProps) => {
  const [activeTerm, setActiveTerm] = useState(0);

  return (
    <div className={cn("min-h-screen p-4 lg:p-12 bg-background", className)}>
      <h1 className="pt-[40px] lg:pt-0" style={{ fontWeight: 500, color: 'rgb(250, 250, 250)', fontSize: '24px', lineHeight: '32px' }}>
        {title}
      </h1>
      <div className="relative mb-[50vh] flex gap-12 py-[40px] md:py-[80px]">
        <ul className="border-border/30 sticky top-24 hidden h-fit w-full max-w-[280px] space-y-4 border-l md:block">
          {terms.map((term, index) => (
            <li className="relative cursor-pointer pl-3" key={term.id}>
              <a href={`#${term.id}`}>
                {activeTerm === index && (
                  <motion.span
                    layoutId="active-term"
                    className="bg-primary absolute -left-[1.5px] top-1/2 inline-block h-5 w-[2px] -translate-y-1/2 rounded-2xl"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                <p
                  className="transition-all duration-200"
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '20px',
                    color: activeTerm === index ? 'rgb(250, 250, 250)' : 'rgb(135, 135, 135)'
                  }}
                >
                  {term.title}
                </p>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-1 flex-col gap-[40px] md:gap-[60px]">
          {terms.map((term, index) => (
            <TermSection
              key={term.id}
              term={term}
              index={index}
              setActiveTerm={setActiveTerm}
            >
              <h3 style={{ fontWeight: 500, color: 'rgb(250, 250, 250)', fontSize: '24px', lineHeight: '32px' }}>
                {term.title}
              </h3>
              <div className="space-y-4" style={{ fontWeight: 400, color: 'rgb(135, 135, 135)', fontSize: '14px', lineHeight: '20px' }}>
                {term.content}
              </div>
            </TermSection>
          ))}
        </div>
      </div>
    </div>
  );
};

export { LegalPageLayout };
export type { LegalPageLayoutProps, TermItem };

