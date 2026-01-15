import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
// Footer removed from root - dashboard has its own layout

const circular = localFont({
  src: [
    {
      path: "../../public/lineto-circular-book.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/lineto-circular-medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/lineto-circular-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-circular",
});

export const metadata: Metadata = {
  title: "EasyTerms | AI Music Contract Analyzer",
  description: "Analyze your music contracts with AI. Get instant summaries, key term extraction, and risk analysis for recording agreements, publishing deals, and more.",
  keywords: ["music contracts", "AI contract analysis", "recording agreement", "publishing deal", "music lawyer", "contract review"],
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${circular.variable} antialiased min-h-screen flex flex-col`}
        style={{ fontFamily: 'var(--font-circular), system-ui, sans-serif' }}
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="flex-1">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
