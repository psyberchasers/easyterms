"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";

const FooterCTA = () => {
  const { theme } = useTheme();

  return (
    <footer className="gradient-bg border-t border-border">
      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
            Ready to understand your contracts?
          </h2>
          <p className="text-muted-foreground mb-8">
            Upload your first contract for free. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="h-10 px-6 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              Start Analyzing
            </Link>
            <Link
              href="/login"
              className="h-10 px-6 border border-border hover:border-muted-foreground/30 text-foreground font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="py-16 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Tagline */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-foreground font-medium leading-relaxed text-sm">
                We help creators move with clarity, confidence, and care.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Analyze</Link></li>
                <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</Link></li>
                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contract Guide</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img
                src={theme === "dark" ? "/darkModeS.svg" : "/logoSingle.svg"}
                alt="EasyTerms"
                className="h-6"
              />
              <span className="text-sm text-muted-foreground">EasyTerms</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} EasyTerms. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { FooterCTA };
