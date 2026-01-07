"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { SecurityLockIcon } from "@hugeicons-pro/core-solid-rounded";
import { useTheme } from "@/components/providers/ThemeProvider";

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <HugeiconsIcon icon={SecurityLockIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/40 focus:border-purple-500 focus:ring-purple-500/50 focus:ring-[3px] h-10"
          style={{ borderRadius: '12px' }}
          data-rounded="true"
          autoFocus
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full bg-purple-500 text-white hover:bg-purple-600 h-10 rounded-xl"
        disabled={loading}
      >
        {loading ? "Checking..." : "Enter"}
      </Button>
    </form>
  );
}

export default function PasswordPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dotted background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src={theme === "dark" ? "/darkModeS.svg" : "/lightModeS.svg"}
              alt="EasyTerms"
              className="h-10"
            />
          </div>
          <p className="text-muted-foreground/60 mt-2 text-sm">Enter password to continue</p>
        </div>

        <Suspense fallback={<div className="h-24" />}>
          <PasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
