"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, LockPasswordIcon, UserAdd01Icon, UserIcon } from "@hugeicons-pro/core-solid-rounded";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

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
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
    if (redirectParam) {
      setRedirect(redirectParam);
    }
    // Check if URL has signup mode
    const modeParam = params.get("mode");
    if (modeParam === "signup") {
      setMode("signup");
    }
  }, []);

  // Rotating text effect
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
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
        data: {
          full_name: fullName,
        },
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
    return (
      <div className="h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border border-border p-8 rounded-xl"
        >
          <div className="text-center">
            <div className="mx-auto w-12 h-12 border border-green-400/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">Check your email</h2>
            <p className="text-muted-foreground/60 mb-4 text-sm">
              We&apos;ve sent a confirmation link to <strong className="text-foreground">{email}</strong>
            </p>
            <p className="text-xs text-muted-foreground/40">
              Click the link in the email to activate your account.
            </p>
            <Button
              variant="outline"
              className="mt-6 border-border bg-background text-foreground hover:bg-muted hover:text-foreground rounded-md"
              onClick={() => {
                setSuccess(false);
                setMode("login");
              }}
            >
              Back to login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-dashed border-border relative overflow-hidden">
        {/* Light Dots Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <img
              src={theme === "dark" ? "/darkModeS.svg" : "/lightModeS.svg"}
              alt="EasyTerms"
              className="h-10"
            />
          </Link>
        </div>

        <div className="flex-1 flex items-center relative z-10">
          <h1 className="text-4xl font-medium text-foreground leading-tight flex flex-wrap items-center gap-x-3">
            <span>Understand your</span>
            <LayoutGroup>
              <motion.span
                className="inline-flex items-center bg-purple-500 text-white px-3 py-1.5 -rotate-2 whitespace-nowrap text-3xl translate-y-0.5"
                layout="size"
                transition={{
                  layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={wordIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    layout
                    className="inline-block"
                  >
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
                <motion.span layout className="inline-block">&nbsp;in plain English</motion.span>
              </motion.span>
            </LayoutGroup>
          </h1>
        </div>

      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img
              src={theme === "dark" ? "/darkModeS.svg" : "/lightModeS.svg"}
              alt="EasyTerms"
              className="h-8"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-medium text-[#e8e4df] flex items-center justify-center gap-2">
                  <img
                    src={theme === "dark" ? "/darkModeS.svg" : "/lightModeS.svg"}
                    alt=""
                    className="h-6"
                  />
                  {mode === "login" ? "Welcome back" : "Create an account"}
                </h2>
                <p className="text-muted-foreground/60 mt-1 text-sm">
                  {mode === "login" ? "Sign in to access your contracts" : "Start analyzing your music contracts"}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-400/30 bg-red-400/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground text-sm">Full Name</Label>
                    <div className="relative">
                      <HugeiconsIcon icon={UserIcon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/40 focus:border-purple-500 focus:ring-purple-500/50 focus:ring-[3px] h-10"
                        style={{ borderRadius: '12px' }}
                        data-rounded="true"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                  <div className="relative">
                    <HugeiconsIcon icon={Mail01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/40 focus:border-purple-500 focus:ring-purple-500/50 focus:ring-[3px] h-10"
                      style={{ borderRadius: '12px' }}
                      data-rounded="true"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground text-sm">Password</Label>
                    {mode === "login" && (
                      <Link href="/forgot-password" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <HugeiconsIcon icon={LockPasswordIcon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/40 focus:border-purple-500 focus:ring-purple-500/50 focus:ring-[3px] h-10"
                      style={{ borderRadius: '12px' }}
                      data-rounded="true"
                      minLength={mode === "signup" ? 6 : undefined}
                      required
                    />
                  </div>
                  {mode === "signup" && (
                    <p className="text-xs text-muted-foreground/40">Minimum 6 characters</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-500 text-white hover:bg-purple-600 h-10 rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {mode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : mode === "login" ? (
                    "Sign in"
                  ) : (
                    <>
                      <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4 mr-2" />
                      Create account
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground/40">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-border bg-background text-foreground hover:bg-muted hover:text-foreground h-10 rounded-xl"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground/60">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                  className="text-purple-500 hover:underline font-medium"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground/40 mt-8">
            By {mode === "login" ? "signing in" : "signing up"}, you agree to our{" "}
            <Link href="/terms" className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
