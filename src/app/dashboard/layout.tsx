"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Settings02Icon,
  GridViewIcon,
  PanelRightIcon,
  ContractsIcon,
  AiSearch02Icon,
  Settings03Icon,
  FileUploadIcon,
  Moon02Icon,
  Sun01Icon,
  ChatSparkIcon,
  CreditCardIcon,
  GitCompareIcon,
} from "@hugeicons-pro/core-stroke-rounded";
import { MusicLoader } from "@/components/MusicLoader";
import { useTheme } from "@/components/providers/ThemeProvider";
import { CommandMenu } from "@/components/CommandMenu";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SidebarContract {
  id: string;
  title: string;
  overall_risk: string | null;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted transition-colors rounded-md"
    >
      <HugeiconsIcon icon={PanelRightIcon} size={14} className="text-muted-foreground" />
    </button>
  );
}

interface DashboardHeaderProps {
  onSearchClick: () => void;
  theme: string;
  toggleTheme: () => void;
}

function DashboardHeader({
  onSearchClick,
  theme,
  toggleTheme,
}: DashboardHeaderProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();

  const isContractsPage = pathname.startsWith("/dashboard/contracts");
  const isUploadContractPage = pathname.startsWith("/dashboard/upload-contract");
  const isChatPage = pathname.startsWith("/dashboard/chat");
  const isTemplatesPage = pathname.startsWith("/dashboard/templates");
  const isComparePage = pathname.startsWith("/dashboard/compare");
  const isRecipientPage = pathname.includes("/recipient");
  const isSenderPage = pathname.includes("/sender");

  // Build page title with breadcrumb for recipient/sender
  const getHeaderContent = () => {
    if (isChatPage) {
      return (
        <>
          <HugeiconsIcon icon={ChatSparkIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Chat</span>
        </>
      );
    }
    if (isTemplatesPage) {
      return (
        <>
          <HugeiconsIcon icon={GridViewIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Templates</span>
        </>
      );
    }
    if (isUploadContractPage) {
      if (isRecipientPage) {
        return (
          <>
            <HugeiconsIcon icon={FileUploadIcon} size={16} className="text-muted-foreground" />
            <Link href="/dashboard/upload-contract" className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">Upload Contract</Link>
            <span className="text-sm text-muted-foreground/60">/</span>
            <span className="text-sm font-medium text-muted-foreground">Recipient</span>
          </>
        );
      }
      if (isSenderPage) {
        return (
          <>
            <HugeiconsIcon icon={FileUploadIcon} size={16} className="text-muted-foreground" />
            <Link href="/dashboard/upload-contract" className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">Upload Contract</Link>
            <span className="text-sm text-muted-foreground/60">/</span>
            <span className="text-sm font-medium text-muted-foreground">Sender</span>
          </>
        );
      }
      return (
        <>
          <HugeiconsIcon icon={FileUploadIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Upload Contract</span>
        </>
      );
    }
    if (isContractsPage) {
      return (
        <>
          <HugeiconsIcon icon={ContractsIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Contracts</span>
        </>
      );
    }
    if (isComparePage) {
      return (
        <>
          <HugeiconsIcon icon={GitCompareIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Compare</span>
        </>
      );
    }
    return (
      <>
        <HugeiconsIcon icon={Home01Icon} size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Home</span>
      </>
    );
  };

  return (
    <header
      className="fixed top-0 right-0 z-50 flex h-12 items-center gap-2 border-b border-border bg-background px-4 transition-[left] duration-400 ease-[cubic-bezier(0.75,0,0.25,1)]"
      style={{
        left: isCollapsed ? 'var(--sidebar-width-icon, 3rem)' : 'var(--sidebar-width, 16rem)'
      }}
    >
      {getHeaderContent()}
      <div className="flex-1" />

      {/* Actions */}
      <SidebarToggleButton />
      <button
        onClick={onSearchClick}
        className="h-8 px-3 flex items-center gap-2 border border-border hover:bg-muted transition-colors rounded-md text-[13px] font-semibold text-muted-foreground"
      >
        <HugeiconsIcon icon={AiSearch02Icon} size={14} />
        <span>Search</span>
      </button>
      <button
        disabled
        className="h-8 px-3 flex items-center gap-2 border border-border rounded-md text-[13px] font-semibold text-muted-foreground/40 cursor-not-allowed"
      >
        <HugeiconsIcon icon={Settings03Icon} size={14} />
        <span>Settings</span>
      </button>
      <Link href="/dashboard/upload-contract">
        <button className="h-8 px-3 flex items-center gap-2 transition-colors rounded-md text-[13px] font-semibold text-white bg-purple-500 hover:bg-purple-600">
          <HugeiconsIcon icon={FileUploadIcon} size={14} />
          <span>Upload</span>
        </button>
      </Link>
      <button
        onClick={toggleTheme}
        className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted transition-colors rounded-md"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <HugeiconsIcon icon={Sun01Icon} size={14} className="text-muted-foreground" />
        ) : (
          <HugeiconsIcon icon={Moon02Icon} size={14} className="text-muted-foreground" />
        )}
      </button>
    </header>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [sidebarContracts, setSidebarContracts] = useState<SidebarContract[]>([]);
  const supabase = createClient();

  // Fetch recent contracts for sidebar
  useEffect(() => {
    if (!user) return;

    const fetchContracts = async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, overall_risk")
        .order("created_at", { ascending: false })
        .limit(7);

      if (!error && data) {
        setSidebarContracts(data);
      }
    };

    fetchContracts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("sidebar-contracts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          fetchContracts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandMenuOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  const mainNav = [
    { title: "Home", icon: Home01Icon, href: "/dashboard" },
    { title: "Chat", icon: ChatSparkIcon, href: "/dashboard/chat" },
    { title: "Contracts", icon: ContractsIcon, href: "/dashboard/contracts" },
    { title: "Upload Contract", icon: FileUploadIcon, href: "/dashboard/upload-contract" },
    { title: "Compare", icon: GitCompareIcon, href: "/dashboard/compare" },
    { title: "Templates", icon: GridViewIcon, href: "/dashboard/templates" },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-border">
        {/* Header - matches h-12 (48px) of main header with border-b */}
        <motion.div
          className="flex items-center px-3 h-12 border-b border-sidebar-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <img
            src={theme === "dark" ? "/darkModeS.svg" : "/lightModeS.svg"}
            alt="EasyTerms"
            className="h-7 w-auto ml-1"
          />
        </motion.div>

        <SidebarContent className="px-2 pt-3">
          {/* Main Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <SidebarGroup className="p-0 pb-4">
              <SidebarMenu className="gap-0.5">
                {mainNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-auto py-1.5 px-3 text-[13px] font-medium text-sidebar-foreground"
                      >
                        <Link href={item.href}>
                          <HugeiconsIcon icon={item.icon} size={16} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="h-px mb-4 -mx-2 group-data-[collapsible=icon]:hidden bg-sidebar-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />

          {/* Contracts Section */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <SidebarGroup className="p-0 pb-4">
              <SidebarGroupLabel
                className="h-auto py-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/70"
              >
                Contracts
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {sidebarContracts.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                    Your contracts will appear here
                  </p>
                ) : (
                  <SidebarMenu className="gap-0.5">
                    {sidebarContracts.map((contract) => {
                      const isActive = pathname === `/dashboard/contracts/${contract.id}`;
                      const riskColor = contract.overall_risk === "high" ? "bg-red-500" :
                                       contract.overall_risk === "medium" ? "bg-yellow-500" :
                                       contract.overall_risk === "low" ? "bg-green-500" : "bg-muted-foreground/30";
                      return (
                        <SidebarMenuItem key={contract.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={contract.title}
                            className="h-auto py-1.5 px-3 text-[12px] font-normal text-sidebar-foreground/80"
                          >
                            <Link href={`/dashboard/contracts/${contract.id}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${riskColor} shrink-0`} />
                              <span className="truncate">{contract.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </motion.div>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                    <div
                      className="h-8 w-8 rounded-lg shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' }}
                    />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{profile?.full_name || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email || "user@example.com"}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <div
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' }}
                      />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{profile?.full_name || "User"}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email || "user@example.com"}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/billing">
                      <HugeiconsIcon icon={CreditCardIcon} size={16} className="mr-2" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <HugeiconsIcon icon={Settings02Icon} size={16} className="mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </motion.div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen bg-background">
        {/* Top bar - FIXED */}
        <DashboardHeader
          onSearchClick={() => setCommandMenuOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Main content - offset for fixed header */}
        <main className="flex-1 overflow-auto pt-12">
          {children}
        </main>
      </SidebarInset>

      {/* Command Menu */}
      <CommandMenu open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
    </SidebarProvider>
  );
}
