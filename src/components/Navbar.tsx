"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#262626] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">EasyTerms</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-7 bg-[#1a1a1a] animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "text-xs transition-colors",
                    pathname === "/dashboard" ? "text-white" : "text-[#878787] hover:text-white"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/analyze"
                  className={cn(
                    "text-xs transition-colors",
                    pathname === "/analyze" ? "text-white" : "text-[#878787] hover:text-white"
                  )}
                >
                  Analyze
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-7 h-7 border border-[#262626] flex items-center justify-center text-[#878787] hover:text-white hover:border-[#404040] transition-colors">
                      <UserIcon className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#0a0a0a] border-[#262626]">
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-[#878787] truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-[#262626]" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 text-xs text-[#878787] hover:text-white cursor-pointer">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#262626]" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-xs text-[#878787] hover:text-white cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs text-[#878787] hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="h-7 px-3 text-xs bg-white text-black hover:bg-white/90 flex items-center transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

