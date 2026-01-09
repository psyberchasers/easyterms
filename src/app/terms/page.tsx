"use client";

import { LegalPageLayout, TermItem } from "@/components/LegalPageLayout";
import { Navbar } from "@/components/Navbar";

const termsContent: TermItem[] = [
  {
    id: "summary",
    title: "Summary of Key Terms",
    content: (
      <>
        <p className="lg:text-lg italic">
          This summary is provided for convenience and without prejudice to the full Terms of Service below:
        </p>
        <ul className="list-disc space-y-2 pl-6 lg:text-lg">
          <li><span className="text-foreground font-medium">Eligibility:</span> You must be 18 years of age or older to use EasyTerms.</li>
          <li><span className="text-foreground font-medium">Auto-Renewal:</span> Subscriptions auto-renew unless canceled before renewal.</li>
          <li><span className="text-foreground font-medium">Professional Advice Disclaimer:</span> EasyTerms is informational only and is not a law firm; it does not provide legal, tax, accounting, or other professional advice.</li>
          <li><span className="text-foreground font-medium">Usage & License:</span> You are granted a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial use.</li>
          <li><span className="text-foreground font-medium">Limitation of Liability:</span> EasyTerms and its affiliates are not liable for indirect, incidental, special, or consequential damages. Your total liability is limited to the fees you paid in the previous 12 months.</li>
          <li><span className="text-foreground font-medium">Agreement to Terms:</span> By using EasyTerms, you agree to these Terms and the Privacy Policy.</li>
          <li><span className="text-foreground font-medium">Modification of Terms:</span> We may revise these Terms at any time; continued use means acceptance of changes.</li>
          <li><span className="text-foreground font-medium">Governing Law:</span> These Terms are governed by the laws of New York, USA and disputes are resolved in those courts.</li>
        </ul>
      </>
    ),
  },
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <p className="lg:text-lg">
        EasyTerms ("EasyTerms", "we", "us", or "our") operates easyterms.ai and related services (collectively, the "Service"). 
        The Service provides AI-assisted document and contract explanations, guidance, insights, and related tools. 
        By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. 
        If you do not agree, do not use the Service.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: (
      <p className="lg:text-lg">
        You must be at least 18 years old and legally capable of forming a binding contract to use the Service. 
        By using EasyTerms, you represent and warrant that you meet this requirement.
      </p>
    ),
  },
  {
    id: "description",
    title: "3. Description of Service",
    content: (
      <p className="lg:text-lg">
        EasyTerms allows users to upload documents (e.g., contracts, agreements, terms) to receive AI-generated breakdowns, 
        key term summaries, risk insights, negotiation guidance, dashboards, and alerts. 
        The Service does not provide legal advice and should not substitute for a qualified professional's review.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "4. Professional Advice Disclaimer",
    content: (
      <p className="lg:text-lg">
        EasyTerms is an informational tool only. It does not provide legal, tax, accounting, or other professional advice, 
        nor does it create any kind of professional relationship (e.g., attorney-client). 
        You should consult a qualified professional when you require advice in these areas.
      </p>
    ),
  },
  {
    id: "subscriptions",
    title: "5. Subscriptions and Auto-Renewal",
    content: (
      <p className="lg:text-lg">
        If you purchase a subscription, you authorize EasyTerms (or its payment processor) to charge your payment method 
        for all fees, including recurring subscription fees, until you cancel. 
        Subscriptions auto-renew on the billing date unless you cancel before that date.
      </p>
    ),
  },
  {
    id: "user-content",
    title: "6. User Content and License",
    content: (
      <p className="lg:text-lg">
        You retain ownership of the content you upload ("User Content"). By uploading User Content, you grant EasyTerms 
        a non-exclusive, worldwide, royalty-free license to store, process, and use (including in de-identified form for AI improvements) 
        your content to provide and improve the Service.
      </p>
    ),
  },
  {
    id: "de-identified-data",
    title: "7. Use of De-identified Data",
    content: (
      <p className="lg:text-lg">
        We may analyze, aggregate, de-identify, or otherwise process User Content to train and improve our AI technology. 
        Any identifiers are removed or obscured so that data cannot reasonably be linked to you.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property Rights",
    content: (
      <p className="lg:text-lg">
        All rights in the Service, documentation, software, and content provided by EasyTerms are owned by us or our licensors. 
        You are granted a limited license to use the Service in accordance with these Terms. 
        You may not copy, modify, distribute, create derivative works, or otherwise exploit the Service outside the scope of this license.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "9. Acceptable Use Policy",
    content: (
      <>
        <p className="lg:text-lg">You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6 lg:text-lg">
          <li>Use the Service for any unlawful purpose.</li>
          <li>Upload harmful, defamatory, or malicious content.</li>
          <li>Reverse-engineer or misuse the Service.</li>
        </ul>
        <p className="lg:text-lg">We may suspend or terminate accounts that violate these Terms.</p>
      </>
    ),
  },
  {
    id: "limitation-liability",
    title: "10. Limitation of Liability",
    content: (
      <>
        <p className="lg:text-lg">
          To the fullest extent permitted by law, EasyTerms and its affiliates, licensors, and service providers will not be liable for:
        </p>
        <ul className="list-disc space-y-2 pl-6 lg:text-lg">
          <li>Indirect, incidental, special, or consequential damages;</li>
          <li>Loss of profits, data, or goodwill;</li>
          <li>Any damages over the amount you paid to EasyTerms in the 12 months preceding the claim.</li>
        </ul>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "11. Indemnification",
    content: (
      <p className="lg:text-lg">
        You agree to defend, indemnify, and hold harmless EasyTerms and its affiliates from and against any claims, 
        liabilities, damages, losses, and expenses arising from your use of the Service, violation of these Terms, 
        or infringement of any rights.
      </p>
    ),
  },
  {
    id: "modification",
    title: "12. Modification of Terms",
    content: (
      <p className="lg:text-lg">
        We may update or modify these Terms at any time. If we make material changes, we will notify you via email or through the Service. 
        Your continued use after changes means you accept the updated Terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "13. Governing Law and Jurisdiction",
    content: (
      <p className="lg:text-lg">
        These Terms and any disputes arising out of them are governed by the laws of New York, USA. 
        You consent to the exclusive jurisdiction and venue of courts in that jurisdiction.
      </p>
    ),
  },
  {
    id: "agreement",
    title: "14. Agreement to Terms",
    content: (
      <p className="lg:text-lg">
        By accessing or using easyterms.ai and the Service, you confirm that you have read, understood, 
        and agree to be bound by these Terms and the Privacy Policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "15. Contact Information",
    content: (
      <>
        <p className="lg:text-lg">If you have questions about these Terms, contact us at:</p>
        <p className="lg:text-lg text-primary">support@easyterms.ai</p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar showSearch={false} />
      <div className="pt-16">
        <LegalPageLayout
          title="Terms of Service"
          terms={termsContent}
        />
      </div>
    </>
  );
}


