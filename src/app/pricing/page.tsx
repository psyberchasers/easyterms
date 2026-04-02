"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { Check, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "Try EasyTerms with one free contract analysis.",
    features: [
      "1 contract analysis",
      "Basic AI analysis",
      "Plain-English summary",
      "No credit card required",
    ],
    ctaLabel: "Get Started",
    popular: false,
  },
  {
    id: "artist",
    name: "Artist",
    price: "$29.99",
    period: "/year",
    description: "For independent artists and those newer to the industry.",
    features: [
      "10 contracts per year",
      "Full AI analysis",
      "Industry-specific templates",
      "Key term flagging & risk alerts",
      "Email support",
    ],
    ctaLabel: "Start Artist Plan",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79.99",
    period: "/year",
    description: "For managers, agents, and professionals who handle contracts regularly.",
    features: [
      "Unlimited contracts",
      "Everything in Artist, plus:",
      "Negotiation suggestions",
      "Redlining tools",
      "Contract comparisons",
      "AI chatbot for follow-up questions",
      "In-app contract signing",
      "Pre-send contract review",
      "Email support",
    ],
    ctaLabel: "Start Pro Plan",
    popular: true,
  },
];

const faqSections = [
  {
    title: "About EasyTerms",
    items: [
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
    title: "Using the Product",
    items: [
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
    title: "Plans & Pricing",
    items: [
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
    title: "Privacy & Data",
    items: [
      {
        q: "Who can see my uploaded contracts?",
        a: "Only you. Your uploaded contracts are private and processed securely using AES-256 encryption — the same military-grade standard used by banks and governments. Your documents are protected both in transit and at rest, and are never shared with third parties or sold. Period.",
      },
      {
        q: "What happens to my contracts after analysis?",
        a: "Once your contract has been analyzed, it is automatically purged from our servers. We do not store your documents longer than necessary to provide the Service. Your data moves through an end-to-end encrypted pipeline from the moment you upload to the moment you close the tab.",
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
    title: "Getting Help",
    items: [
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

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-sm font-medium text-white/80" style={{ fontFamily: "var(--font-circular)" }}>
          {q}
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-white/30 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-white/40 leading-relaxed pb-5" style={{ fontFamily: "var(--font-circular)" }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const currentTier = profile?.subscription_tier || "free";

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push(`/signup?redirect=/pricing&plan=${planId}`);
      return;
    }
    if (planId === "free") {
      router.push("/dashboard");
      return;
    }
    setLoading(planId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: planId }),
      });
      const data = await response.json();
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
        style={{ backgroundColor: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/darkModeS.svg" alt="EasyTerms" className="h-6" />
            <span className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-circular)" }}>EasyTerms</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors" style={{ fontFamily: "var(--font-circular)" }}>
              Log in
            </Link>
            <Link
              href="/analyze"
              className="h-9 px-4 text-sm font-medium rounded-lg bg-white text-black hover:bg-white/90 transition-all flex items-center"
              style={{ fontFamily: "var(--font-circular)" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "var(--font-circular)" }}>
            Simple pricing.
            <br />
            <span className="text-white/30">No surprises.</span>
          </h1>
          <p className="text-base text-white/40 max-w-xl mx-auto" style={{ fontFamily: "var(--font-circular)" }}>
            Start free, upgrade when you need more. All plans include AI-powered contract analysis.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 mb-24">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;
            const isLoading = loading === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl border p-6 sm:p-8 flex flex-col transition-all",
                  plan.popular
                    ? "border-purple-500/30 bg-purple-500/[0.04]"
                    : "border-white/[0.08] bg-white/[0.02]"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-circular)" }}>
                    {plan.name}
                  </span>
                  {plan.popular && (
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20" style={{ fontFamily: "var(--font-circular)" }}>
                      Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]" style={{ fontFamily: "var(--font-circular)" }}>
                      Current
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-circular)" }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-white/30" style={{ fontFamily: "var(--font-circular)" }}>{plan.period}</span>
                  )}
                </div>
                <div className="mb-4" />

                {/* Description */}
                <p className="text-sm text-white/40 mb-6" style={{ fontFamily: "var(--font-circular)" }}>
                  {plan.description}
                </p>

                {/* Features */}
                <div className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                        plan.popular ? "bg-purple-500/20" : "bg-white/[0.08]"
                      )}>
                        <Check className={cn("w-3 h-3", plan.popular ? "text-purple-400" : "text-white/50")} strokeWidth={3} />
                      </div>
                      <span className="text-sm text-white/60" style={{ fontFamily: "var(--font-circular)" }}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || isLoading}
                  className={cn(
                    "w-full py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                    isCurrentPlan
                      ? "bg-white/[0.06] text-white/30 cursor-default"
                      : plan.popular
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-white text-black hover:bg-white/90"
                  )}
                  style={{ fontFamily: "var(--font-circular)" }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    <>
                      {plan.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: "var(--font-circular)" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-base text-white/40" style={{ fontFamily: "var(--font-circular)" }}>
              Everything you need to know about EasyTerms.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-10">
            {faqSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs uppercase tracking-widest text-purple-400/70 font-medium mb-4" style={{ fontFamily: "var(--font-circular)" }}>
                  {section.title}
                </h3>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6">
                  {section.items.map((faq) => (
                    <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center">
          <p className="text-xs text-white/20 max-w-lg mx-auto leading-relaxed" style={{ fontFamily: "var(--font-circular)" }}>
            EasyTerms is not a substitute for legal advice — always consult a qualified attorney for your specific needs.
          </p>
        </div>
      </main>
    </div>
  );
}
