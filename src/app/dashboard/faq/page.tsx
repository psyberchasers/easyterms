"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/animate-ui/components/radix/accordion";

const faqs = [
  {
    category: "Contract Types",
    questions: [
      {
        q: "What is a 360 deal?",
        a: "A 360 deal (or multiple rights deal) is a contract where a record label receives a percentage of all revenue streams from an artist, including touring, merchandise, endorsements, and publishing—not just recorded music sales. While these deals often come with larger advances and more label support, they significantly reduce your earnings across all income sources."
      },
      {
        q: "What's the difference between a publishing deal and a record deal?",
        a: "A record deal covers the recording and distribution of your music (masters). A publishing deal covers the underlying compositions (songs you write). Publishing deals involve royalties from streaming, radio play, sync licenses (TV/film), and covers by other artists. You can have different partners for each."
      },
      {
        q: "What is a distribution deal?",
        a: "A distribution deal is an agreement where a distributor gets your music onto streaming platforms and into stores in exchange for a percentage of revenue (typically 15-30%). Unlike record deals, you retain ownership of your masters and more creative control. Popular distributors include DistroKid, TuneCore, CD Baby, and AWAL."
      },
      {
        q: "What is a label services deal?",
        a: "A label services deal is a hybrid arrangement where you pay for specific services (marketing, radio promotion, playlist pitching) without signing away your masters or long-term rights. You maintain ownership while accessing label-level resources. These are becoming increasingly popular with established independent artists."
      },
    ]
  },
  {
    category: "Rights & Ownership",
    questions: [
      {
        q: "What are master recordings and why do they matter?",
        a: "Master recordings are the original recordings of your songs. Whoever owns the masters controls how the music is used, licensed, and distributed. Owning your masters means you keep more revenue and control over your music's future. Many artists regret signing away their masters early in their careers."
      },
      {
        q: "What does 'in perpetuity' mean in contracts?",
        a: "'In perpetuity' means forever. If a label owns your masters 'in perpetuity,' they own them for the duration of copyright (typically 70 years after death in the US). Always try to negotiate reversion clauses where rights return to you after a set period or when certain conditions are met."
      },
      {
        q: "What is a reversion clause?",
        a: "A reversion clause specifies conditions under which rights to your music return to you. This might be after a set number of years, when the advance is recouped, or if the label fails to meet certain obligations (like keeping your music available). Always push for reversion clauses in any deal."
      },
      {
        q: "What's the difference between copyright and masters?",
        a: "Copyright protects the underlying composition (melody, lyrics, arrangement)—this is handled by publishing. Masters refer to the specific sound recording of that composition. You can have multiple masters of the same copyrighted song. Both generate separate royalty streams."
      },
    ]
  },
  {
    category: "Money & Royalties",
    questions: [
      {
        q: "What are typical royalty rates?",
        a: "Traditional major label deals offer 12-20% of net receipts. Independent labels may offer 40-50%. Distribution deals can be 70-85%. Streaming typically pays $0.003-0.005 per stream. Always clarify whether rates are based on 'net' or 'gross' revenue—net deductions can significantly reduce your earnings."
      },
      {
        q: "What are recoupable expenses?",
        a: "Recoupable expenses are costs the label pays upfront (recording, marketing, videos, tour support) that are deducted from your royalties before you see any money. Until these are 'recouped,' you won't receive royalty payments. High advances with high recoupment can mean years without royalty income."
      },
      {
        q: "What is a mechanical royalty?",
        a: "Mechanical royalties are paid when your song is reproduced—on CDs, vinyl, or digital downloads. In the US, the statutory rate is 9.1 cents per song (or 1.75 cents per minute for songs over 5 minutes). Streaming services pay a reduced mechanical rate set by the Copyright Royalty Board."
      },
      {
        q: "What is a sync license?",
        a: "A sync (synchronization) license allows your music to be used in TV shows, films, commercials, video games, and other visual media. These can be lucrative one-time payments plus ongoing royalties. Make sure your contract allows you to approve or reject sync opportunities."
      },
      {
        q: "What are performance royalties?",
        a: "Performance royalties are paid when your music is publicly performed—radio, TV, live venues, streaming. These are collected by PROs (Performing Rights Organizations) like ASCAP, BMI, or SESAC in the US, or PRS in the UK. You should register as both a writer and publisher to collect all your royalties."
      },
    ]
  },
  {
    category: "Contract Terms",
    questions: [
      {
        q: "What is an option period?",
        a: "An option period gives the label the right (but not obligation) to extend your contract for additional albums. Labels typically have 30-90 days after delivering an album to decide. Multiple option periods can lock you into a deal for many years. Try to limit the number of options and their duration."
      },
      {
        q: "What is a commitment or delivery requirement?",
        a: "This specifies how many albums or songs you must deliver under the contract. A typical deal might require 1 album with 4-5 options for additional albums. Be careful—if each album takes 2+ years and there are 5 options, you could be locked in for over a decade."
      },
      {
        q: "What is an exclusivity clause?",
        a: "An exclusivity clause prevents you from recording for other labels or releasing music independently during your contract term. Some contracts extend exclusivity for a period after the term ends. Negotiate for carve-outs for features, collaborations, or side projects."
      },
      {
        q: "What is a key person clause?",
        a: "A key person clause lets you exit or renegotiate if a specific person (usually the A&R who signed you) leaves the label. This protects you from being orphaned at a label where no one champions your career. Always try to include this clause."
      },
    ]
  },
  {
    category: "Career Decisions",
    questions: [
      {
        q: "Should I sign with a major label or stay independent?",
        a: "Major labels offer larger advances, global reach, and industry connections, but take larger cuts and more control. Independence means keeping more revenue and creative control, but requires more self-investment and business management. Many artists now use hybrid approaches—independent release with distribution deals or label services deals."
      },
      {
        q: "Do I need a lawyer to review my contract?",
        a: "Yes, absolutely. Entertainment lawyers specialize in music contracts and can identify problematic clauses, negotiate better terms, and explain what you're agreeing to. The cost of a lawyer (typically $300-500/hour or 5% of deal value) is almost always worth it compared to being locked into a bad deal for years."
      },
      {
        q: "What should I look for in a manager contract?",
        a: "Key terms include: commission rate (typically 15-20%), sunset clause (reduced commission after term ends), scope of services, term length, and termination rights. Avoid managers who want ownership of your music or publishing. Ensure the term aligns with your career timeline."
      },
      {
        q: "When should I sign with a publisher?",
        a: "Consider signing with a publisher when you have a catalog of songs generating income, need sync placement support, want help with co-writing opportunities, or need an advance. If you're primarily a performer of your own songs, a traditional publishing deal may not be necessary early in your career."
      },
    ]
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter FAQs based on search
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Music Industry FAQ</h1>
          <p className="text-muted-foreground">
            Common questions about music contracts, royalties, and industry terms.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {category.category}
              </h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`${categoryIndex}-${faqIndex}`}
                      className="border-border px-4"
                    >
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredFaqs.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No questions found matching &quot;{searchQuery}&quot;</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            This information is for educational purposes only and does not constitute legal advice.
            Always consult with a qualified entertainment lawyer before signing any contract.
          </p>
        </div>
      </div>
    </div>
  );
}
