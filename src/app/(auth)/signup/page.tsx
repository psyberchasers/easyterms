"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2, FileText, Shield, Zap } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const supabase = createClient();

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

  const handleGoogleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-md border border-[#262626] p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 border border-green-400/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
            <p className="text-[#878787] mb-4">
              We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-sm text-[#525252]">
              Click the link in the email to activate your account.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 border-[#262626] bg-black text-white hover:bg-[#1a1a1a] hover:text-white" 
              onClick={() => router.push("/login")}
            >
              Back to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-[#262626]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-xl text-white">EasyTerms</span>
          </Link>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Understand your contracts.
            </h1>
            <p className="text-[#878787] text-lg">
              AI-powered analysis that breaks down complex legal terms into plain language.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#262626] flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#878787]">Upload any contract format</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#262626] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#878787]">Instant AI analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-[#262626] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#878787]">Secure and private</span>
            </div>
          </div>
        </div>
        
        <p className="text-[#525252] text-sm">
          © 2025 EasyTerms. All rights reserved.
        </p>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl font-bold text-white">EasyTerms</span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Create an account</h2>
              <p className="text-[#878787] mt-1">Start analyzing your music contracts</p>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-400/30 bg-red-400/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#878787]" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-black border-[#262626] text-white placeholder:text-[#525252] focus:border-[#404040] focus:ring-0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#878787]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-black border-[#262626] text-white placeholder:text-[#525252] focus:border-[#404040] focus:ring-0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#878787]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-black border-[#262626] text-white placeholder:text-[#525252] focus:border-[#404040] focus:ring-0"
                    minLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-[#525252]">Minimum 6 characters</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-white/90 h-10" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#262626]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-[#525252]">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-[#262626] bg-black text-white hover:bg-[#1a1a1a] hover:text-white h-10"
              onClick={handleGoogleSignup}
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

            <p className="text-center text-sm text-[#878787]">
              Already have an account?{" "}
              <Link href="/login" className="text-white hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-[#525252] mt-8">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="hover:text-[#878787]">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="hover:text-[#878787]">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
