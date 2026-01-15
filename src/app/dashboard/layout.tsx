"use client";

import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "sonner";
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
  Bell,
  CheckCheck,
  Share2,
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
  Share01Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import { MusicLoader } from "@/components/MusicLoader";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Home01Icon as Home01BulkIcon,
  ChatSearch01Icon,
  FileUploadIcon as FileUploadBulkIcon,
  DocumentAttachmentIcon,
  FolderShared02Icon,
  GitCompareIcon as GitCompareBulkIcon,
  LayoutGridIcon,
  ChatQuestion01Icon,
  Book01Icon,
  News01Icon,
  CreditCardIcon as CreditCardBulkIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { SearchCommand } from "@/components/SearchCommand";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface Notification {
  id: string;
  type: "contract_shared" | "signature_requested" | "contract_signed" | "comment_added";
  title: string;
  message: string | null;
  contract_id: string | null;
  from_user_id: string | null;
  read: boolean;
  created_at: string;
}

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
  theme: string;
  toggleTheme: () => void;
  notifications: Notification[];
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

function DashboardHeader({
  theme,
  toggleTheme,
  notifications,
  notificationsOpen,
  setNotificationsOpen,
  unreadCount,
  markAsRead,
  markAllAsRead,
  onNotificationClick,
}: DashboardHeaderProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();

  const isContractsPage = pathname.startsWith("/dashboard/contracts");
  const isUploadContractPage = pathname.startsWith("/dashboard/upload-contract");
  const isChatPage = pathname.startsWith("/dashboard/chat");
  const isTemplatesPage = pathname.startsWith("/dashboard/templates");
  const isComparePage = pathname.startsWith("/dashboard/compare");
  const isSharedPage = pathname.startsWith("/dashboard/shared");
  const isBillingPage = pathname.startsWith("/dashboard/billing");
  const isSettingsPage = pathname.startsWith("/dashboard/settings");
  const isRecipientPage = pathname.includes("/recipient");
  const isSenderPage = pathname.includes("/sender");

  // Build page title with breadcrumb for recipient/sender
  const getHeaderContent = () => {
    if (isChatPage) {
      return (
        <>
          <HugeiconsIcon icon={ChatSearch01Icon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Chat</span>
        </>
      );
    }
    if (isTemplatesPage) {
      return (
        <>
          <HugeiconsIcon icon={LayoutGridIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Templates</span>
        </>
      );
    }
    if (isUploadContractPage) {
      if (isRecipientPage) {
        return (
          <>
            <HugeiconsIcon icon={FileUploadBulkIcon} size={16} className="text-muted-foreground" />
            <Link href="/dashboard/upload-contract" className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">Upload Contract</Link>
            <span className="text-sm text-muted-foreground/60">/</span>
            <span className="text-sm font-semibold text-foreground">Recipient</span>
          </>
        );
      }
      if (isSenderPage) {
        return (
          <>
            <HugeiconsIcon icon={FileUploadBulkIcon} size={16} className="text-muted-foreground" />
            <Link href="/dashboard/upload-contract" className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">Upload Contract</Link>
            <span className="text-sm text-muted-foreground/60">/</span>
            <span className="text-sm font-semibold text-foreground">Sender</span>
          </>
        );
      }
      return (
        <>
          <HugeiconsIcon icon={FileUploadBulkIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Upload Contract</span>
        </>
      );
    }
    if (isContractsPage) {
      return (
        <>
          <HugeiconsIcon icon={DocumentAttachmentIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Contracts</span>
        </>
      );
    }
    if (isComparePage) {
      return (
        <>
          <HugeiconsIcon icon={GitCompareBulkIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Compare</span>
        </>
      );
    }
    if (isSharedPage) {
      return (
        <>
          <HugeiconsIcon icon={FolderShared02Icon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Shared</span>
        </>
      );
    }
    if (isBillingPage) {
      return (
        <>
          <HugeiconsIcon icon={CreditCardBulkIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Billing</span>
        </>
      );
    }
    if (isSettingsPage) {
      return (
        <>
          <HugeiconsIcon icon={Settings02Icon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Settings</span>
        </>
      );
    }
    return (
      <>
        <HugeiconsIcon icon={Home01BulkIcon} size={16} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Home</span>
      </>
    );
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-50 flex h-12 items-center gap-1.5 sm:gap-2 border-b border-border bg-background px-4 sm:px-4 transition-[left] duration-400 ease-[cubic-bezier(0.75,0,0.25,1)]",
        "left-0 md:left-[var(--sidebar-width-icon,3rem)]",
        !isCollapsed && "md:left-[var(--sidebar-width,16rem)]"
      )}
    >
      {/* Mobile: Show logo, Desktop: Show page title */}
      <div className="md:hidden">
        <Link href="/dashboard">
          <img src="/darkModeS.svg" alt="EasyTerms" className="h-6" />
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-2">
        {getHeaderContent()}
      </div>
      <div className="flex-1" />

      {/* Actions */}
      <div className="hidden md:block">
        <SidebarToggleButton />
      </div>

      {/* Chat icon - mobile only */}
      <Link href="/dashboard/chat" className="md:hidden">
        <button className="h-8 w-8 flex items-center justify-center border border-border hover:bg-muted transition-colors rounded-md">
          <HugeiconsIcon icon={ChatSparkIcon} size={14} className="text-muted-foreground" />
        </button>
      </Link>

      {/* Notifications Bell */}
      <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="relative h-8 w-8 flex items-center justify-center border border-border hover:bg-muted transition-colors rounded-md">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-card border-border p-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-3 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0",
                    !notification.read && "bg-purple-500/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      notification.type === "contract_shared" && "bg-purple-500/10",
                      notification.type === "signature_requested" && "bg-blue-500/10",
                      notification.type === "contract_signed" && "bg-green-500/10",
                      notification.type === "comment_added" && "bg-yellow-500/10"
                    )}>
                      <Share2 className={cn(
                        "w-4 h-4",
                        notification.type === "contract_shared" && "text-purple-500",
                        notification.type === "signature_requested" && "text-blue-500",
                        notification.type === "contract_signed" && "text-green-500",
                        notification.type === "comment_added" && "text-yellow-500"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(notification.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search Command */}
      <SearchCommand />

      {/* Upload - icon only on mobile */}
      <Link href="/dashboard/upload-contract?new=true">
        <button className="h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center sm:justify-start gap-2 transition-colors rounded-md text-[13px] font-semibold text-white bg-purple-500 hover:bg-purple-600">
          <HugeiconsIcon icon={FileUploadIcon} size={14} />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </Link>

      {/* Theme toggle - hidden on mobile */}
      <button
        onClick={toggleTheme}
        className="hidden sm:flex h-8 w-8 items-center justify-center border border-border hover:bg-muted transition-colors rounded-md"
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
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarContracts, setSidebarContracts] = useState<SidebarContract[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const supabase = createClient();

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  }, [user, supabase]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.contract_id) {
      router.push(`/dashboard/contracts/${notification.contract_id}`);
    }
    setNotificationsOpen(false);
  };

  // Fetch notifications on mount and subscribe to changes
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel("dashboard-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchNotifications]);

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


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  const mainNav = [
    { title: "Home", icon: Home01BulkIcon, href: "/dashboard" },
    { title: "Chat", icon: ChatSearch01Icon, href: "/dashboard/chat" },
    { title: "Contracts", icon: DocumentAttachmentIcon, href: "/dashboard/contracts" },
    { title: "Shared", icon: FolderShared02Icon, href: "/dashboard/shared" },
    { title: "Compare", icon: GitCompareBulkIcon, href: "/dashboard/compare" },
    { title: "Templates", icon: LayoutGridIcon, href: "/dashboard/templates" },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" className="border-border hidden md:flex">
        {/* Header - matches h-12 (48px) of main header with border-b */}
        <motion.div
          className="flex items-center px-3 h-12 border-b border-sidebar-border group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <img
              src={theme === "dark" ? "/darkModeS.svg" : "/lightModeS.svg"}
              alt="EasyTerms"
              className="h-7 w-auto ml-1"
            />
          </Link>
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
                          <HugeiconsIcon
                            icon={item.icon}
                            size={16}
                            className={cn(
                              "transition-colors duration-200",
                              isActive ? "text-purple-400" : "text-muted-foreground"
                            )}
                          />
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

          {/* Additional Info Section - hidden when collapsed */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="group-data-[collapsible=icon]:hidden"
          >
            <SidebarGroup className="p-0 pb-4">
              <SidebarGroupLabel
                className="h-auto py-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/70"
              >
                Additional Info
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="FAQ"
                      className="h-auto py-1.5 px-3 text-[12px] font-normal text-sidebar-foreground/80"
                    >
                      <Link href="/faq">
                        <HugeiconsIcon icon={ChatQuestion01Icon} size={16} className="text-muted-foreground" />
                        <span>FAQ</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Resources"
                      className="h-auto py-1.5 px-3 text-[12px] font-normal text-sidebar-foreground/80"
                    >
                      <Link href="/resources">
                        <HugeiconsIcon icon={Book01Icon} size={16} className="text-muted-foreground" />
                        <span>Resources</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Blog"
                      className="h-auto py-1.5 px-3 text-[12px] font-normal text-sidebar-foreground/80"
                    >
                      <Link href="/blog">
                        <HugeiconsIcon icon={News01Icon} size={16} className="text-muted-foreground" />
                        <span>Blog</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
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
                    <Link href="/dashboard/billing">
                      <HugeiconsIcon icon={CreditCardIcon} size={16} className="mr-2" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
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
          theme={theme}
          toggleTheme={toggleTheme}
          notifications={notifications}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
        />

        {/* Main content - offset for fixed header and footer */}
        <main className="flex-1 overflow-auto pt-12 pb-12">
          {children}
        </main>

        {/* Dashboard Footer - Fixed at bottom */}
        <footer className="fixed bottom-0 left-0 right-0 border-t border-border px-6 py-3 bg-background z-40 md:ml-[var(--sidebar-width)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              EasyTerms provides informational analysis only and is not a substitute for professional legal advice.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </SidebarInset>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />
    </SidebarProvider>
  );
}
