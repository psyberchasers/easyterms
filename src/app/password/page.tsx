"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { SecurityLockIcon } from "@hugeicons-pro/core-solid-rounded";

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
        <HugeiconsIcon icon={SecurityLockIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 rounded-none"
          autoFocus
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <Button type="submit" className="w-full rounded-none" disabled={loading}>
        {loading ? "Checking..." : "Enter"}
      </Button>
    </form>
  );
}

export default function PasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Repeating logo background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "url('/logo.png')",
          backgroundSize: "40px auto",
          backgroundRepeat: "space",
        }}
      />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="EasyTerms" className="h-8" />
          </div>
          <p className="text-muted-foreground mt-2">Enter password to continue</p>
        </div>

        <Suspense fallback={<div className="h-24" />}>
          <PasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
