"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
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
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserFullViewIcon,
  AiSearch02Icon,
  AiSheetsIcon,
  Login01Icon,
  AiUserIcon,
  RepeatOffIcon,
  Logout01Icon,
  Settings02Icon,
  SparklesIcon,
  Calendar03Icon,
  Home11Icon,
  FileAttachmentIcon,
} from "@hugeicons-pro/core-solid-rounded";

interface NavbarProps {
  showNewAnalysis?: boolean;
  showBorder?: boolean;
  showSearch?: boolean;
}

interface Contract {
  id: string;
  title: string;
  contract_type: string | null;
  overall_risk: string | null;
  created_at: string;
}

export function Navbar({ showNewAnalysis = true, showBorder = false, showSearch = true }: NavbarProps) {
  const { user, profile, loading, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [commandTab, setCommandTab] = useState<"all" | "contracts" | "actions" | "navigation">("all");
  const [searchValue, setSearchValue] = useState("");
  const supabase = createClient();

  // Fetch contracts when command menu opens
  const fetchContracts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("contracts")
      .select("id, title, contract_type, overall_risk, created_at")
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
      <header className={`fixed top-0 left-0 right-0 z-50 bg-background ${showBorder ? 'border-b border-border' : ''}`}>
        <div className="max-w-full mx-auto px-4 h-14 grid grid-cols-3 items-center">
          {/* Left - Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src={theme === "dark" ? "/darkModeS.svg" : "/logoSingle.svg"} alt="EasyTerms" className="h-8" />
          </Link>

          {/* Center - Command Menu Trigger */}
          <div className="flex justify-center items-center">
            {showSearch && (
              <button
                onClick={() => setCommandOpen(true)}
                className="group hidden sm:flex items-center justify-center gap-3 h-10 px-4 text-base text-muted-foreground hover:text-foreground bg-transparent transition-colors min-w-[240px] relative"
              >
                <HugeiconsIcon icon={AiSearch02Icon} size={18} className="text-muted-foreground/60 group-hover:text-primary transition-colors" />
                <span>Search</span>
                {/* Underline that expands from middle */}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-primary -translate-x-1/2 transition-all duration-300 ease-out group-hover:w-full" />
              </button>
            )}
          </div>

          {/* Right - Nav */}
          <nav className="flex items-center gap-2 justify-end">
          {loading ? (
            <div className="w-8 h-8 bg-muted animate-pulse" />
          ) : user ? (
            <>
              {showNewAnalysis && (
                <Link
                  href="/analyze"
                  className="h-8 px-3 text-[13px] font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center gap-2 transition-colors"
                >
                  <HugeiconsIcon icon={AiSheetsIcon} size={14} />
                  New Analysis
                </Link>
              )}
              <Link
                href="/dashboard"
                className="h-8 px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted border border-border rounded-md flex items-center gap-2 transition-colors"
              >
                <HugeiconsIcon icon={DashboardSquare01Icon} size={14} />
                Dashboard
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 border border-border rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                    <HugeiconsIcon icon={UserFullViewIcon} size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border rounded-none">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground/60">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted">
                    <Link href="/dashboard">
                      <HugeiconsIcon icon={DashboardSquare01Icon} size={16} className="mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted">
                    <Link href="/dashboard/compare">
                      <HugeiconsIcon icon={RepeatOffIcon} size={16} className="mr-2" />
                      Compare
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted">
                    <Link href="/pricing">
                      <HugeiconsIcon icon={SparklesIcon} size={16} className="mr-2" />
                      Upgrade
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted">
                    <HugeiconsIcon icon={Settings02Icon} size={16} className="mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400 focus:bg-muted">
                    <HugeiconsIcon icon={Logout01Icon} size={16} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="h-8 px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted border border-border rounded-md flex items-center gap-2 transition-colors"
              >
                <HugeiconsIcon icon={Login01Icon} size={14} />
                Log In
              </Link>
              <Link
                href="/login?mode=signup"
                className="h-8 px-3 text-[13px] font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center gap-2 transition-colors"
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
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} showCloseButton={false}>
        {/* Custom Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <HugeiconsIcon icon={AiSearch02Icon} size={18} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search contracts, actions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            autoFocus
          />
          <button
            onClick={() => setCommandOpen(false)}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
          {[
            { id: "all", label: "All" },
            { id: "contracts", label: "Contracts", icon: FileAttachmentIcon },
            { id: "actions", label: "Actions", icon: AiSheetsIcon },
            { id: "navigation", label: "Navigation", icon: DashboardSquare01Icon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCommandTab(tab.id as typeof commandTab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                commandTab === tab.id
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon && <HugeiconsIcon icon={tab.icon} size={14} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Contracts Section */}
          {(commandTab === "all" || commandTab === "contracts") && contracts.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-2">Contracts</p>
              <div className="space-y-1">
                {contracts
                  .filter((c) => !searchValue || c.title.toLowerCase().includes(searchValue.toLowerCase()))
                  .map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => runCommand(() => router.push(`/contract/${contract.id}`))}
                      className="w-full flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      {/* PDF Icon */}
                      <div className="w-10 h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.contract_type || "Contract"} | {new Date(contract.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Actions Section */}
          {(commandTab === "all" || commandTab === "actions") && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-2">Actions</p>
              <div className="space-y-1">
                <button
                  onClick={() => runCommand(() => router.push("/analyze"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={AiSheetsIcon} size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">New Analysis</p>
                    <p className="text-xs text-muted-foreground">Upload and analyze a contract</p>
                  </div>
                </button>
                <button
                  onClick={() => runCommand(() => router.push("/dashboard/compare"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={RepeatOffIcon} size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Compare Contracts</p>
                    <p className="text-xs text-muted-foreground">Side by side comparison</p>
                  </div>
                </button>
                <button
                  onClick={() => runCommand(() => router.push("/pricing"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={SparklesIcon} size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Upgrade Plan</p>
                    <p className="text-xs text-muted-foreground">Get more features</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {(commandTab === "all" || commandTab === "navigation") && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-2">Navigation</p>
              <div className="space-y-1">
                <button
                  onClick={() => runCommand(() => router.push("/"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={Home11Icon} size={16} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Home</p>
                </button>
                <button
                  onClick={() => runCommand(() => router.push("/dashboard"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={DashboardSquare01Icon} size={16} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Dashboard</p>
                </button>
                <button
                  onClick={() => runCommand(() => router.push("/calendar"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={Calendar03Icon} size={16} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Calendar</p>
                </button>
                <button
                  onClick={() => runCommand(() => router.push("/settings"))}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <HugeiconsIcon icon={Settings02Icon} size={16} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Settings</p>
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {searchValue && contracts.filter((c) => c.title.toLowerCase().includes(searchValue.toLowerCase())).length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{searchValue}"
            </div>
          )}
        </div>
      </CommandDialog>
    </>
  );
}

