"use client";

import { LegalPageLayout, TermItem } from "@/components/LegalPageLayout";
import { Navbar } from "@/components/Navbar";

const privacyContent: TermItem[] = [
  {
    id: "information-collection",
    title: "Information We Collect",
    content: (
      <div className="space-y-4">
        <p className="lg:text-lg">We collect information you provide directly to us, such as when you create an account, upload contracts for analysis, or contact us for support.</p>
        <p className="lg:text-lg">This may include your name, email address, and the content of contracts you upload for analysis.</p>
      </div>
    ),
  },
  {
    id: "use-of-information",
    title: "How We Use Your Information",
    content: (
      <div className="space-y-4">
        <p className="lg:text-lg">We use the information we collect to provide, maintain, and improve our services, including to analyze your contracts and provide AI-powered insights.</p>
        <p className="lg:text-lg">We may also use your information to communicate with you about our services, updates, and promotional offers.</p>
      </div>
    ),
  },
  {
    id: "data-security",
    title: "Data Security",
    content: (
      <div className="space-y-4">
        <p className="lg:text-lg">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        <p className="lg:text-lg">Your uploaded contracts are processed securely and are not shared with third parties except as necessary to provide our services.</p>
      </div>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: (
      <div className="space-y-4">
        <p className="lg:text-lg">We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements.</p>
        <p className="lg:text-lg">You may request deletion of your account and associated data at any time.</p>
      </div>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: (
      <div className="space-y-4">
        <p className="lg:text-lg">You have the right to access, correct, or delete your personal information. You may also have the right to restrict or object to certain processing of your data.</p>
        <p className="lg:text-lg">To exercise these rights, please contact us at <span className="text-purple-500">privacy@easyterms.io</span>.</p>
      </div>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    content: (
      <div className="space-y-4">
        <p className="lg:text-lg">If you have any questions about this Privacy Policy, please contact us at <span className="text-purple-500">privacy@easyterms.io</span>.</p>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar showSearch={false} />
      <LegalPageLayout title="Privacy Policy" terms={privacyContent} />
    </>
  );
}
