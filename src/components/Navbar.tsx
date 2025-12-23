"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LogOut,
  Settings,
  GitCompare,
  Sparkles,
  FileText,
  Calendar,
  CreditCard,
  Home,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserFullViewIcon,
  AiSearch02Icon,
  AiSheetsIcon,
  Login01Icon,
  AiUserIcon,
} from "@hugeicons-pro/core-solid-rounded";

interface NavbarProps {
  showNewAnalysis?: boolean;
  showBorder?: boolean;
}

interface Contract {
  id: string;
  title: string;
  contract_type: string | null;
  overall_risk: string | null;
}

export function Navbar({ showNewAnalysis = true, showBorder = false }: NavbarProps) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandTab, setCommandTab] = useState<"commands" | "contracts">("commands");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const supabase = createClient();

  // Fetch contracts when command menu opens
  const fetchContracts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("contracts")
      .select("id, title, contract_type, overall_risk")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setContracts(data);
  }, [user, supabase]);

  useEffect(() => {
    if (commandOpen && user) {
      fetchContracts();
    }
  }, [commandOpen, user, fetchContracts]);

  // Handle ⌘K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setCommandOpen(false);
    command();
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-black ${showBorder ? 'border-b border-[#262626]' : ''}`}>
        <div className="max-w-full mx-auto px-4 h-14 grid grid-cols-3 items-center">
          {/* Left - Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EasyTerms" className="h-5" />
          </Link>

          {/* Center - Command Menu Trigger */}
          <div className="flex justify-center">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 h-8 px-3 text-sm text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/50 bg-primary/5 transition-colors min-w-[200px]"
            >
              <HugeiconsIcon icon={AiSearch02Icon} size={16} />
              <span className="flex-1 text-left">Search</span>
            </button>
          </div>

          {/* Right - Nav */}
          <nav className="flex items-center gap-2 justify-end">
          {loading ? (
            <div className="w-8 h-8 bg-[#1a1a1a] animate-pulse" />
          ) : user ? (
            <>
              {showNewAnalysis && (
                <Link
                  href="/analyze"
                  className="h-8 px-3 text-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-colors"
                >
                  <HugeiconsIcon icon={AiSheetsIcon} size={18} className="text-primary-foreground/70" />
                  New Analysis
                </Link>
              )}
              <Link
                href="/dashboard"
                className="h-8 px-3 text-sm text-[#878787] hover:text-primary flex items-center gap-2 transition-colors group"
              >
                <HugeiconsIcon icon={DashboardSquare01Icon} size={18} className="group-hover:text-primary transition-colors" />
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 border border-[#262626] flex items-center justify-center hover:border-[#404040] transition-colors">
                    <HugeiconsIcon icon={UserFullViewIcon} size={16} className="text-[#878787]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0a] border-[#262626] rounded-none">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-[#525252]">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="text-[#878787] hover:text-white focus:text-white focus:bg-[#1a1a1a]">
                    <Link href="/dashboard">
                      <HugeiconsIcon icon={DashboardSquare01Icon} size={16} className="mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[#878787] hover:text-white focus:text-white focus:bg-[#1a1a1a]">
                    <Link href="/compare">
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-[#878787] hover:text-white focus:text-white focus:bg-[#1a1a1a]">
                    <Link href="/pricing">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[#878787] hover:text-white focus:text-white focus:bg-[#1a1a1a]">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400 focus:bg-[#1a1a1a]">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="h-8 px-3 text-sm text-[#878787] hover:text-white flex items-center gap-2 transition-colors"
              >
                <HugeiconsIcon icon={Login01Icon} size={14} />
                Log In
              </Link>
              <Link
                href="/signup"
                className="h-8 px-3 text-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 transition-colors"
              >
                <HugeiconsIcon icon={AiUserIcon} size={14} />
                Sign Up
              </Link>
            </>
          )}
          </nav>
        </div>
      </header>

      {/* Command Menu Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={(open) => { setCommandOpen(open); if (!open) setCommandTab("commands"); }} showCloseButton={false}>
        {/* Tabs */}
        <div className="flex border-b border-primary/20">
          <button
            onClick={() => setCommandTab("commands")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              commandTab === "commands"
                ? "text-primary border-b-2 border-primary"
                : "text-primary/50 hover:text-primary/70"
            }`}
          >
            Commands
          </button>
          <button
            onClick={() => setCommandTab("contracts")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              commandTab === "contracts"
                ? "text-primary border-b-2 border-primary"
                : "text-primary/50 hover:text-primary/70"
            }`}
          >
            Contracts
          </button>
        </div>
        <CommandInput placeholder={commandTab === "commands" ? "Search commands..." : "Search contracts..."} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commandTab === "contracts" ? (
            <CommandGroup heading="Recent Contracts">
              {contracts.length > 0 ? (
                contracts.map((contract) => (
                  <CommandItem
                    key={contract.id}
                    onSelect={() => runCommand(() => router.push(`/contract/${contract.id}`))}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{contract.title}</span>
                    {contract.overall_risk && (
                      <span className={`text-[10px] px-1.5 py-0.5 ${
                        contract.overall_risk === 'high' ? 'text-red-400 bg-red-400/10' :
                        contract.overall_risk === 'medium' ? 'text-primary bg-primary/10' :
                        'text-green-400 bg-green-400/10'
                      }`}>
                        {contract.overall_risk}
                      </span>
                    )}
                  </CommandItem>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-primary/50">No contracts yet</div>
              )}
            </CommandGroup>
          ) : (
            <>
              <CommandGroup heading="Navigation">
                <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                  <HugeiconsIcon icon={DashboardSquare01Icon} size={16} className="mr-2" />
                  Dashboard
                  <CommandShortcut>⌘D</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/analyze"))}>
                  <HugeiconsIcon icon={AiSheetsIcon} size={16} className="mr-2" />
                  New Analysis
                  <CommandShortcut>⌘N</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/compare"))}>
                  <GitCompare className="mr-2 h-4 w-4" />
                  Compare Contracts
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Actions">
                <CommandItem onSelect={() => runCommand(() => router.push("/pricing"))}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pricing & Upgrade
                </CommandItem>
                {user && (
                  <CommandItem onSelect={() => runCommand(() => signOut())}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

