"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle2, Mail, Lock, User, UserPlus, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const rotatingWords = ["contracts", "royalties", "publishing deals", "sync licenses", "agreements"];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirect, setRedirect] = useState("/dashboard");
  const [wordIndex, setWordIndex] = useState(0);
  const [isExtension, setIsExtension] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
    if (redirectParam) {
      setRedirect(redirectParam);
    }
    // Check if opened from Chrome extension
    const fromExtension = params.get("extension") === "true";
    if (fromExtension) {
      setIsExtension(true);
      // Check if already logged in - if so, send session to extension
      const supabaseClient = createClient();
      supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: { access_token: string; refresh_token: string; user: { id: string; email?: string } } | null } }) => {
        if (session) {
          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: {
              id: session.user.id,
              email: session.user.email,
            }
          };
          localStorage.setItem('easyterms_extension_session', JSON.stringify(sessionData));
          setSuccess(true);
        }
      });
    }
    // Check if URL has signup mode
    const modeParam = params.get("mode");
    if (modeParam === "signup") {
      setMode("signup");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (isExtension && data.session) {
        const sessionData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
          }
        };
        try {
          const chromeGlobal = (window as unknown as { chrome?: { runtime?: { sendMessage: (msg: unknown) => void } } }).chrome;
          if (chromeGlobal?.runtime?.sendMessage) {
            chromeGlobal.runtime.sendMessage({ type: 'EASYTERMS_AUTH', session: sessionData });
          }
        } catch (err) {
          console.log('Extension messaging not available');
        }
        localStorage.setItem('easyterms_extension_session', JSON.stringify(sessionData));
        setSuccess(true);
        setLoading(false);
        return;
      }
      router.push(redirect);
      router.refresh();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const switchMode = (newMode: "login" | "signup") => {
    setError("");
    setMode(newMode);
  };

  if (success) {
    if (isExtension) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "var(--font-circular)" }}>Signed in!</h2>
              <p className="text-white/40 mb-4 text-sm" style={{ fontFamily: "var(--font-circular)" }}>
                You&apos;re now signed in to the EasyTerms extension.
              </p>
              <p className="text-xs text-white/25" style={{ fontFamily: "var(--font-circular)" }}>
                You can close this tab and return to the extension.
              </p>
              <button
                onClick={() => window.close()}
                className="mt-6 px-6 py-2.5 text-sm font-medium rounded-lg border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                Close this tab
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "var(--font-circular)" }}>Check your email</h2>
            <p className="text-white/40 mb-4 text-sm" style={{ fontFamily: "var(--font-circular)" }}>
              We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-xs text-white/25" style={{ fontFamily: "var(--font-circular)" }}>
              Click the link in the email to activate your account.
            </p>
            <button
              onClick={() => { setSuccess(false); setMode("login"); }}
              className="mt-6 px-6 py-2.5 text-sm font-medium rounded-lg border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
              style={{ fontFamily: "var(--font-circular)" }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <img src="/darkModeS.svg" alt="EasyTerms" className="h-6" />
          <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-circular)" }}>EasyTerms</span>
        </Link>

        <div className="flex-1 flex items-center">
          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: "var(--font-circular)" }}>
            Understand your{" "}
            <span className="relative inline-block min-w-[280px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="text-purple-400 inline-block"
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            in plain English.
          </h1>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/darkModeS.svg" alt="EasyTerms" className="h-6" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "var(--font-circular)" }}>EasyTerms</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-circular)" }}>
                  {mode === "login" ? "Welcome back" : "Create an account"}
                </h2>
                <p className="text-white/40 mt-1 text-sm" style={{ fontFamily: "var(--font-circular)" }}>
                  {mode === "login" ? "Sign in to access your contracts" : "Start analyzing your music contracts"}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-sm text-white/60" style={{ fontFamily: "var(--font-circular)" }}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type="text"
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                        style={{ fontFamily: "var(--font-circular)" }}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm text-white/60" style={{ fontFamily: "var(--font-circular)" }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                      style={{ fontFamily: "var(--font-circular)" }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/60" style={{ fontFamily: "var(--font-circular)" }}>Password</label>
                    {mode === "login" && (
                      <Link href="/forgot-password" className="text-xs text-white/30 hover:text-white/50 transition-colors" style={{ fontFamily: "var(--font-circular)" }}>
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="password"
                      placeholder={mode === "signup" ? "Minimum 6 characters" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm"
                      style={{ fontFamily: "var(--font-circular)" }}
                      minLength={mode === "signup" ? 6 : undefined}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: "var(--font-circular)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : mode === "login" ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create account
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0a0a0a] px-3 text-white/25" style={{ fontFamily: "var(--font-circular)" }}>Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-white/30" style={{ fontFamily: "var(--font-circular)" }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-white/15 mt-6" style={{ fontFamily: "var(--font-circular)" }}>
            By {mode === "login" ? "signing in" : "signing up"}, you agree to our{" "}
            <Link href="/terms" className="text-white/25 hover:text-white/40 transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-white/25 hover:text-white/40 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
