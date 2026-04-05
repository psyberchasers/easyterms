"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/animate-ui/components/radix/accordion";

const faqSections = [
  {
    category: "About EasyTerms",
    questions: [
      {
        q: "What is EasyTerms?",
        a: "EasyTerms is an AI-powered contract tool that helps you understand, review, and manage your agreements. You upload a contract, and EasyTerms breaks it down into plain English — flagging key terms, risks, and anything you should pay attention to before signing. It also includes contract templates, a pre-send review tool, and an AI chatbot for follow-up questions.",
      },
      {
        q: "Who is EasyTerms built for?",
        a: "EasyTerms was built primarily for music industry professionals — artists, managers, agents, and independent labels. Whether you're new to the industry and seeing your first contract, or a seasoned professional looking to speed up your workflow, EasyTerms is designed to give you clarity and confidence. We are actively expanding to serve professionals in other industries as well.",
      },
      {
        q: "Is EasyTerms a law firm or legal service?",
        a: "No. EasyTerms is an informational tool only. It is not a law firm and does not provide legal, tax, accounting, or any other form of professional advice. Using EasyTerms does not create an attorney-client relationship. Our AI analysis is a starting point to help you better understand your documents — it is not a substitute for a qualified attorney. We always recommend consulting a licensed legal professional before signing or acting on any contract.",
      },
      {
        q: "Who founded EasyTerms?",
        a: "EasyTerms was co-founded by Augustus Banks, a music artist who experienced firsthand how confusing and costly contracts can be in the industry, and Uri Darnel, a full-stack engineer with a deep concentration in AI. Together, they built EasyTerms to give artists and music professionals the clarity they deserve — without the expensive legal bill.",
      },
    ],
  },
  {
    category: "Using the Product",
    questions: [
      {
        q: "How do I upload a contract?",
        a: "Simply log into your EasyTerms account, navigate to your dashboard, and upload your contract file. Our AI will analyze the document and return a plain-language breakdown, key term summary, and any flagged risk areas — typically within seconds.",
      },
      {
        q: "What types of contracts can EasyTerms analyze?",
        a: "EasyTerms is built with music industry agreements in mind, including recording contracts, management agreements, artist booking and agency agreements, licensing deals, publishing agreements, 360 deals, and more. While optimized for the music industry, the AI can analyze most standard contract types.",
      },
      {
        q: "How accurate is the AI analysis?",
        a: "Our AI is designed to provide helpful, high-quality insights, but it is not infallible. AI-generated analysis may occasionally be incomplete or not fully applicable to your specific situation. EasyTerms is best used as a first step in understanding your contract — not as a final legal opinion. For anything high-stakes, we strongly recommend having a licensed attorney review the document as well.",
      },
      {
        q: "What is the AI chatbot and how does it work?",
        a: "The AI chatbot (available on the Pro Plan) allows you to ask follow-up questions about any contract or clause in plain English. After uploading a document, you can ask things like 'What does this royalty clause mean?' or 'What happens if I want to leave this deal?' and receive contextual, easy-to-understand answers based on the document you uploaded.",
      },
      {
        q: "Can I use EasyTerms to send contracts?",
        a: "Yes — the Pro Plan includes in-app contract signing, allowing you to send contracts and collect signatures directly within EasyTerms. This feature is not available on the Free or Artist plans.",
      },
      {
        q: "What contract templates does EasyTerms offer?",
        a: "EasyTerms provides professionally crafted templates built specifically for the music industry, including common agreement types for artists, managers, agents, and labels. Templates are available on the Artist and Pro plans and can be customized to suit your needs.",
      },
      {
        q: "What is the pre-send contract review feature?",
        a: "Before you send a contract to another party, you can run it through EasyTerms' pre-send review tool. The AI will flag unusual clauses, potentially missing terms, or anything that may warrant a second look — helping you send cleaner, more confident agreements.",
      },
    ],
  },
  {
    category: "Plans & Pricing",
    questions: [
      {
        q: "What's included in the free tier?",
        a: "The Free Tier lets you upload and analyze one contract at no cost, with no credit card required. You'll receive a basic AI analysis and plain-English summary of your document. It's a great way to experience EasyTerms before committing to a paid plan.",
      },
      {
        q: "What is the difference between the Artist and Pro plans?",
        a: "The Artist Plan ($29.99/year) allows up to 10 contracts per year and includes full AI analysis, industry-specific templates, and email support — ideal for independent artists and those newer to the industry. The Pro Plan ($79.99/year) includes unlimited contracts and adds advanced features: negotiation suggestions, redlining tools, contract comparisons, an AI chatbot, in-app signing, and email support. It's built for managers, agents, and professionals who handle contracts regularly.",
      },
      {
        q: "Does my subscription auto-renew?",
        a: "Yes. All paid subscriptions automatically renew on your billing date each year unless you cancel before the renewal date. You will not be charged after cancellation, but your access will continue until the end of the current billing period.",
      },
      {
        q: "Can I cancel at any time?",
        a: "Yes, you can cancel your subscription at any time through your account settings or by contacting our support team at support@easyterms.ai. Cancellations take effect at the end of your current billing cycle.",
      },
      {
        q: "Will monthly plans be available?",
        a: "At launch, EasyTerms will offer annual subscriptions only. Monthly billing options and pay-per-use credits are on our roadmap and may be introduced in a future update.",
      },
    ],
  },
  {
    category: "Privacy & Data",
    questions: [
      {
        q: "Who can see my uploaded contracts?",
        a: "Only you. Your uploaded contracts are private and processed securely using AES-256 encryption — the same military-grade standard used by banks and governments. Your documents are protected both in transit and at rest, and are never shared with third parties or sold. Period.",
      },
      {
        q: "What happens to my contracts after analysis?",
        a: "Your contracts are stored securely using AES-256 encryption and are only accessible by you. You can delete any contract or your entire account at any time. Your data moves through an end-to-end encrypted pipeline from the moment you upload it.",
      },
      {
        q: "Does EasyTerms use my contracts to train its AI?",
        a: "No — not unless you choose to. AI training data use is entirely opt-in. Your contracts will never be used to train or improve our AI systems without your explicit consent. You can opt in or out at any time through your account settings, and opting out has no effect on your access to any features.",
      },
      {
        q: "How is my data protected?",
        a: "EasyTerms is built on a SOC 2 compliant infrastructure, meeting the highest standards for security, availability, and confidentiality. We use AES-256 encryption across the platform and are GDPR ready, meaning you can request deletion of your personal data at any time. We take your privacy seriously — your contracts are your business, not ours.",
      },
      {
        q: "Can I delete my data?",
        a: "Yes. You may request deletion of your account and all associated data at any time by contacting us at support@easyterms.ai. You also have the right to access or correct your personal information at any time.",
      },
    ],
  },
  {
    category: "Getting Help",
    questions: [
      {
        q: "How do I contact support?",
        a: "You can reach our support team at any time by emailing support@easyterms.ai. All users — regardless of plan — have equal access to our support team. We'll get back to you as quickly as possible.",
      },
      {
        q: "How do I delete my account?",
        a: "To delete your account and all associated data, please contact us at support@easyterms.ai with your request. We will process your deletion promptly.",
      },
      {
        q: "I have a question that isn't answered here. What should I do?",
        a: "We'd love to hear from you. Send us an email at support@easyterms.ai and our team will be happy to help.",
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqSections.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Everything you need to know about EasyTerms.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 mt-6">
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
              <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4">
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
            EasyTerms is not a substitute for legal advice — always consult a qualified attorney for your specific needs.
          </p>
        </div>
      </div>
    </div>
  );
}
