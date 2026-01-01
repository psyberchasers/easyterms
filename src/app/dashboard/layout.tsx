"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Upload,
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  ChevronUp,
  Search,
  BarChart3,
  LucideIcon,
  DollarSign,
  Sun,
  Moon,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RepeatOffIcon } from "@hugeicons-pro/core-solid-rounded";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";
import { useTheme } from "@/components/providers/ThemeProvider";

type NavItem = {
  title: string;
  href: string;
  isActive: boolean;
} & (
  | { icon: LucideIcon; isHugeicon?: false }
  | { icon: typeof RepeatOffIcon; isHugeicon: true }
);

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  const navigation: { title: string; items: NavItem[] }[] = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          isActive: pathname === "/dashboard",
        },
        {
          title: "Contracts",
          icon: FileText,
          href: "/dashboard",
          isActive: pathname === "/dashboard" || pathname?.startsWith("/dashboard/contracts"),
        },
      ],
    },
    {
      title: "Actions",
      items: [
        {
          title: "New Analysis",
          icon: Upload,
          href: "/analyze",
          isActive: pathname === "/analyze",
        },
        {
          title: "Compare",
          icon: RepeatOffIcon,
          href: "/compare",
          isActive: pathname === "/compare",
          isHugeicon: true,
        },
        {
          title: "Finances",
          icon: DollarSign,
          href: "/dashboard/finances",
          isActive: pathname === "/dashboard/finances",
        },
        {
          title: "Calendar",
          icon: Calendar,
          href: "/calendar",
          isActive: pathname === "/calendar",
        },
      ],
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="border-r border-border">
        {/* Header */}
        <SidebarHeader className="border-b border-border">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-sm">E</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">EasyTerms</span>
              <span className="text-[10px] text-muted-foreground">Contract Analysis</span>
            </div>
          </div>
        </SidebarHeader>

        {/* Search */}
        <div className="px-4 py-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-muted/30 border border-border hover:border-muted-foreground/30 transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span>Search contracts...</span>
            <kbd className="ml-auto text-[10px] text-muted-foreground/50 border border-border px-1.5 py-0.5">
              /
            </kbd>
          </button>
        </div>

        <SidebarContent>
          {navigation.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-4">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const LucideIconComponent = item.icon as LucideIcon;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.isActive}
                          className={cn(
                            "mx-2 rounded-none",
                            item.isActive && "bg-muted border-l-2 border-l-primary"
                          )}
                        >
                          <Link href={item.href}>
                            {item.isHugeicon ? (
                              <HugeiconsIcon icon={item.icon as typeof RepeatOffIcon} size={16} />
                            ) : (
                              <LucideIconComponent className="w-4 h-4" />
                            )}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarSeparator />

          {/* Recent Contracts - placeholder */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-4">
              Recent
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-2">
                <p className="text-[10px] text-muted-foreground">
                  Your recent contracts will appear here
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="mx-2 rounded-none">
                    <div className="w-6 h-6 bg-muted flex items-center justify-center text-xs font-medium text-foreground">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {profile?.full_name || "User"}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {user?.email}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto w-4 h-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56 rounded-none"
                >
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-400 cursor-pointer"
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

      <SidebarInset className="bg-background overflow-auto">
        {/* Top bar - Clean minimal style */}
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border bg-background px-4">
          <SidebarTrigger className="h-8 w-8 border border-border hover:bg-muted" />

          {/* Page Title */}
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Dashboard</span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="h-8 w-48 pl-8 pr-3 text-sm bg-muted/30 border border-border placeholder:text-muted-foreground/50 focus:outline-none focus:border-muted-foreground/30"
            />
          </div>

          {/* Actions */}
          <Link href="/analyze">
            <button className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted transition-colors">
              <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </Link>

          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
