"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  MoreHorizontal,
  User,
  Settings,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Notification02Icon,
  InboxIcon,
  Task01Icon,
  ChartHistogramIcon,
  Folder01Icon,
  File01Icon,
  UserGroupIcon,
  Settings02Icon,
  GridViewIcon,
  PanelRightIcon,
  ContractsIcon,
  AiSearch02Icon,
  Settings03Icon,
  FileUploadIcon,
  Upload02Icon,
  Moon02Icon,
  Sun01Icon,
  AiBrain02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";
import { useTheme } from "@/components/providers/ThemeProvider";
import { CommandMenu } from "@/components/CommandMenu";

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
      <HugeiconsIcon icon={PanelRightIcon} size={14} style={{ color: '#565c65' }} />
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
  const searchParams = useSearchParams();

  const isContractsPage = pathname.startsWith("/dashboard/contracts");
  const isUploadPage = pathname.startsWith("/dashboard/upload");
  const isAnalyzeDemoPage = pathname.startsWith("/dashboard/analyze-demo");

  const role = searchParams.get("role");

  // Build page title with breadcrumb for recipient
  const getHeaderContent = () => {
    if (isAnalyzeDemoPage) {
      if (role === "recipient") {
        return (
          <>
            <HugeiconsIcon icon={FileUploadIcon} size={16} style={{ color: '#565c65' }} />
            <Link href="/dashboard/analyze-demo" className="text-sm hover:text-neutral-600 transition-colors" style={{ color: '#9ca3af' }}>Upload Contract</Link>
            <span className="text-sm" style={{ color: '#9ca3af' }}>/</span>
            <span className="text-sm font-medium" style={{ color: '#565c65' }}>Recipient</span>
          </>
        );
      }
      return (
        <>
          <HugeiconsIcon icon={FileUploadIcon} size={16} style={{ color: '#565c65' }} />
          <span className="text-sm font-medium" style={{ color: '#565c65' }}>Upload Contract</span>
        </>
      );
    }
    if (isContractsPage) {
      return (
        <>
          <HugeiconsIcon icon={ContractsIcon} size={16} style={{ color: '#565c65' }} />
          <span className="text-sm font-medium" style={{ color: '#565c65' }}>Contracts</span>
        </>
      );
    }
    if (isUploadPage) {
      return (
        <>
          <HugeiconsIcon icon={FileUploadIcon} size={16} style={{ color: '#565c65' }} />
          <span className="text-sm font-medium" style={{ color: '#565c65' }}>Upload</span>
        </>
      );
    }
    return <span className="text-sm font-medium" style={{ color: '#565c65' }}>Dashboard</span>;
  };

  return (
    <header
      className="fixed top-0 right-0 z-50 flex h-12 items-center gap-2 border-b border-border bg-background px-4 transition-[left] duration-200 ease-linear"
      style={{
        left: isCollapsed ? '3rem' : '14rem'
      }}
    >
      {getHeaderContent()}
      <div className="flex-1" />

      {/* Actions */}
      <SidebarToggleButton />
      <button
        onClick={onSearchClick}
        className="h-8 px-3 flex items-center gap-2 border border-border hover:bg-muted transition-colors rounded-md text-[13px] font-medium"
        style={{ color: '#565c65' }}
      >
        <HugeiconsIcon icon={AiSearch02Icon} size={14} />
        <span>Search</span>
      </button>
      <Link href="/settings">
        <button className="h-8 px-3 flex items-center gap-2 border border-border hover:bg-muted transition-colors rounded-md text-[13px] font-medium" style={{ color: '#565c65' }}>
          <HugeiconsIcon icon={Settings03Icon} size={14} />
          <span>Settings</span>
        </button>
      </Link>
      <Link href="/dashboard/upload">
        <button className="h-8 px-3 flex items-center gap-2 transition-colors rounded-md text-[13px] font-medium text-white" style={{ backgroundColor: '#8b5cf6' }}>
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
          <HugeiconsIcon icon={Sun01Icon} size={14} style={{ color: '#565c65' }} />
        ) : (
          <HugeiconsIcon icon={Moon02Icon} size={14} style={{ color: '#565c65' }} />
        )}
      </button>
    </header>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
    const [commandMenuOpen, setCommandMenuOpen] = useState(false);

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
    { title: "Home", icon: Home01Icon, href: "/dashboard", badge: null },
    { title: "Updates", icon: Notification02Icon, href: "/dashboard/updates", badge: "3" },
    { title: "Inbox", icon: InboxIcon, href: "/dashboard/inbox", badge: "12" },
    { title: "My Tasks", icon: Task01Icon, href: "/dashboard/tasks", badge: null, hasAdd: true },
  ];

  const workspaceItems = [
    { title: "Contracts", icon: ContractsIcon, href: "/dashboard/contracts" },
    { title: "Upload Contract", icon: FileUploadIcon, href: "/dashboard/analyze-demo" },
    { title: "Projects", icon: Folder01Icon, href: "/dashboard/projects", hasDropdown: true },
    { title: "Templates", icon: GridViewIcon, href: "/dashboard/templates", hasDropdown: true },
    { title: "Documents", icon: File01Icon, href: "/dashboard/documents", hasAdd: true },
    { title: "Teams", icon: UserGroupIcon, href: "/dashboard/teams", badge: "5" },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
        {/* Header */}
        <div
          className="flex items-center px-3 border-b border-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          style={{ height: '48px' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{ background: 'linear-gradient(135deg, #FFEF00 0%, #f59e0b 100%)' }}
            />
            <span className="text-[13px] font-semibold text-foreground group-data-[collapsible=icon]:hidden">EasyTerms</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] hover:bg-muted/50 transition-colors rounded-lg border border-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:border-0 text-muted-foreground">
            <HugeiconsIcon icon={AiSearch02Icon} size={14} className="shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Search</span>
            <kbd className="ml-auto text-[11px] opacity-50 group-data-[collapsible=icon]:hidden">⌘K</kbd>
          </button>
        </div>

        <SidebarContent className="px-2">
          {/* Main Navigation */}
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
                      className={cn(
                        "h-auto py-1.5 px-3 text-[13px] font-medium",
                        isActive ? "bg-white" : "hover:bg-white/50"
                      )}
                      style={{ color: '#565c65' }}
                    >
                      <Link href={item.href}>
                        <HugeiconsIcon icon={item.icon} size={16} />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs opacity-60 group-data-[collapsible=icon]:hidden">{item.badge}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          {/* Divider */}
          <div className="h-px mb-4 -mx-2 group-data-[collapsible=icon]:hidden bg-border" />

          {/* Workspace Section */}
          <SidebarGroup className="p-0 pb-4">
            <SidebarGroupLabel
              className="h-auto py-1.5 px-3 text-[11px] font-medium uppercase tracking-wider"
              style={{ color: '#565c65' }}
            >
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 mt-1">
                {workspaceItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "h-auto py-1.5 px-3 text-[13px] font-medium",
                          isActive ? "bg-white" : "hover:bg-white/50"
                        )}
                        style={{ color: '#565c65' }}
                      >
                        <Link href={item.href}>
                          <HugeiconsIcon icon={item.icon} size={16} />
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-xs opacity-60 group-data-[collapsible=icon]:hidden">{item.badge}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Divider */}
          <div className="h-px mb-4 -mx-2 group-data-[collapsible=icon]:hidden bg-border" />

          {/* Contracts Section */}
          <SidebarGroup className="p-0 pb-4">
            <SidebarGroupLabel
              className="h-auto py-1.5 px-3 text-[11px] font-medium uppercase tracking-wider"
              style={{ color: '#565c65' }}
            >
              Contracts
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <p className="px-3 py-2 text-[11px] group-data-[collapsible=icon]:hidden" style={{ color: '#565c65', opacity: 0.6 }}>
                Your contracts will appear here
              </p>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-2 mb-24 border-t border-border">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Appearance"
                onClick={toggleTheme}
                className="h-auto py-1.5 px-3 text-[13px] font-medium hover:bg-white/50"
                style={{ color: '#565c65' }}
              >
                {theme === "dark" ? (
                  <HugeiconsIcon icon={Sun01Icon} size={16} />
                ) : (
                  <HugeiconsIcon icon={Moon02Icon} size={16} />
                )}
                <span>Appearance</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Settings"
                className="h-auto py-1.5 px-3 text-[13px] font-medium hover:bg-white/50"
                style={{ color: '#565c65' }}
              >
                <Link href="/settings">
                  <HugeiconsIcon icon={Settings02Icon} size={16} />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Profile"
                className="h-auto py-1.5 px-3 text-[13px] font-medium hover:bg-white/50"
                style={{ color: '#565c65' }}
              >
                <Link href="/profile">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* User */}
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip={profile?.full_name || "User"}
                    className="h-auto py-1.5 px-3 text-[13px] font-medium hover:bg-white/50"
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-medium text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' }}
                    >
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </div>
                    <span className="flex-1 text-left font-medium truncate" style={{ color: '#565c65' }}>
                      {profile?.full_name || "User"}
                    </span>
                    <MoreHorizontal className="w-3.5 h-3.5 group-data-[collapsible=icon]:hidden" style={{ color: '#565c65' }} />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56 rounded-lg">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-500 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen" style={{ backgroundColor: '#ffffff' }}>
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
