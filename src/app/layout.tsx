import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Footer } from "@/components/Footer";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "EasyTerms | AI Music Contract Analyzer",
  description: "Analyze your music contracts with AI. Get instant summaries, key term extraction, and risk analysis for recording agreements, publishing deals, and more.",
  keywords: ["music contracts", "AI contract analysis", "recording agreement", "publishing deal", "music lawyer", "contract review"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
        style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif" }}
      >
        <AuthProvider>
          <div className="flex-1 pb-16">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
