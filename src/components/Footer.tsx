import Link from "next/link";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-4 px-4 border-t border-border bg-background/95 backdrop-blur z-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-6">
          {/* Logo */}
          <img src="/logo.png" alt="EasyTerms" className="h-5" />

          {/* Separator */}
          <span className="text-border">|</span>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground">
            AI-powered analysis is not a substitute for professional legal advice. Always consult with a qualified attorney for your situation.
          </p>

          {/* Separator */}
          <span className="text-border">|</span>

          {/* Legal Links */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>

          {/* Separator */}
          <span className="text-border">|</span>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground shrink-0">
            © 2025 EasyTerms. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
