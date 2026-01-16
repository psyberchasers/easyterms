"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ContractsIcon,
  File01Icon,
  Folder01Icon,
  Task01Icon,
  InboxIcon,
  UserGroupIcon,
  GridViewIcon,
  ChartHistogramIcon,
  Settings02Icon,
  FileUploadIcon,
  Home01Icon,
  ArrowUp02Icon,
  ArrowDown02Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import { Link2, Trash2, Command, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { contractTemplates } from "@/config/contract-templates";
import { Contract } from "@/types/database";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  status?: { label: string; color: string };
  timestamp?: string;
  href: string;
}

const filterTabs = [
  { id: "all", label: "All", icon: null },
  { id: "contracts", label: "Contracts", icon: ContractsIcon },
  { id: "templates", label: "Templates", icon: GridViewIcon },
];

// Risk level to status mapping
const getRiskStatus = (risk: string | null) => {
  if (risk === "high") return { label: "High Risk", color: "#ef4444" };
  if (risk === "medium") return { label: "Medium Risk", color: "#f59e0b" };
  if (risk === "low") return { label: "Low Risk", color: "#22c55e" };
  return undefined;
};

const quickActions = [
  { id: "upload", label: "Upload Contract", icon: FileUploadIcon, href: "/dashboard/upload" },
  { id: "home", label: "Go to Dashboard", icon: Home01Icon, href: "/dashboard" },
  { id: "contracts", label: "View Contracts", icon: ContractsIcon, href: "/dashboard/contracts" },
  { id: "settings", label: "Settings", icon: Settings02Icon, href: "/settings" },
];

const RECENT_CONTRACTS_KEY = "command-menu-recent-contracts";
const MAX_RECENT = 5;

// Store minimal contract data for localStorage
interface RecentContract {
  id: string;
  title: string;
  overall_risk: string | null;
  created_at: string;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<SearchResult[]>([]);
  const [recentContracts, setRecentContracts] = useState<SearchResult[]>([]);
  const supabase = createClient();

  // Convert templates to SearchResults - memoized to prevent infinite loops
  const templates: SearchResult[] = useMemo(() =>
    contractTemplates.map((template) => ({
      id: template.id,
      title: template.name,
      category: "Templates",
      icon: <HugeiconsIcon icon={GridViewIcon} size={20} style={{ color: '#565c65' }} />,
      timestamp: template.description.slice(0, 50) + "...",
      href: `/dashboard/templates?template=${template.id}`,
    })), []);

  // Load recent contracts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_CONTRACTS_KEY);
      if (stored) {
        const recentData: RecentContract[] = JSON.parse(stored);
        const recentResults: SearchResult[] = recentData.map((contract) => ({
          id: contract.id,
          title: contract.title,
          category: "Contracts",
          icon: <HugeiconsIcon icon={ContractsIcon} size={20} style={{ color: '#565c65' }} />,
          status: getRiskStatus(contract.overall_risk),
          timestamp: new Date(contract.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          href: `/dashboard/contracts/${contract.id}`,
        }));
        setRecentContracts(recentResults);
      }
    } catch (err) {
      console.error("Error loading recent contracts:", err);
    }
  }, []);

  // Save contract to recent when selected
  const saveToRecent = useCallback((contract: SearchResult) => {
    try {
      const stored = localStorage.getItem(RECENT_CONTRACTS_KEY);
      let recentData: RecentContract[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to move to front)
      recentData = recentData.filter(c => c.id !== contract.id);

      // Add to front
      recentData.unshift({
        id: contract.id,
        title: contract.title,
        overall_risk: contract.status?.label.includes("High") ? "high" :
                      contract.status?.label.includes("Medium") ? "medium" :
                      contract.status?.label.includes("Low") ? "low" : null,
        created_at: new Date().toISOString(),
      });

      // Keep only last MAX_RECENT
      recentData = recentData.slice(0, MAX_RECENT);

      localStorage.setItem(RECENT_CONTRACTS_KEY, JSON.stringify(recentData));

      // Update state
      const recentResults: SearchResult[] = recentData.map((c) => ({
        id: c.id,
        title: c.title,
        category: "Contracts",
        icon: <HugeiconsIcon icon={ContractsIcon} size={20} style={{ color: '#565c65' }} />,
        status: getRiskStatus(c.overall_risk),
        timestamp: new Date(c.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        href: `/dashboard/contracts/${c.id}`,
      }));
      setRecentContracts(recentResults);
    } catch (err) {
      console.error("Error saving recent contract:", err);
    }
  }, []);

  // Fetch contracts when menu opens
  useEffect(() => {
    if (!open) return;

    const fetchContracts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("id, title, contract_type, overall_risk, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error fetching contracts:", error);
          return;
        }

        const contractResults: SearchResult[] = (data || []).map((contract: Contract) => ({
          id: contract.id,
          title: contract.title,
          category: "Contracts",
          icon: <HugeiconsIcon icon={ContractsIcon} size={20} style={{ color: '#565c65' }} />,
          status: getRiskStatus(contract.overall_risk),
          timestamp: new Date(contract.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          href: `/dashboard/contracts/${contract.id}`,
        }));

        setContracts(contractResults);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [open, supabase]);

  // Filter results based on search and active filter
  useEffect(() => {
    if (!search) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    // Combine contracts and templates for searching
    let allItems = [...contracts, ...templates];

    // Filter by search term
    let filtered = allItems.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
    );

    // Filter by category tab
    if (activeFilter !== "all") {
      filtered = filtered.filter(r =>
        r.category.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    setResults(filtered);
    setSelectedIndex(0);
  }, [search, activeFilter, contracts, templates]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // When searching, use results; otherwise use recent contracts
    const displayedItems = search ? results : recentContracts;
    const totalItems = displayedItems.length + (search ? 0 : quickActions.length);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % Math.max(totalItems, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < displayedItems.length) {
        const selectedContract = displayedItems[selectedIndex];
        if (selectedContract.category === "Contracts") {
          saveToRecent(selectedContract);
        }
        router.push(selectedContract.href);
        onOpenChange(false);
      } else if (!search) {
        const actionIndex = selectedIndex - displayedItems.length;
        if (actionIndex < quickActions.length) {
          router.push(quickActions[actionIndex].href);
          onOpenChange(false);
        }
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }, [search, results, recentContracts, selectedIndex, router, onOpenChange, saveToRecent]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
      setActiveFilter("all");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = (href: string, contract?: SearchResult) => {
    // Save to recent if it's a contract
    if (contract && contract.category === "Contracts") {
      saveToRecent(contract);
    }
    router.push(href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden [&>button]:hidden"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e6e7',
          borderRadius: '12px',
          width: '900px',
          maxWidth: '90vw',
        }}
        onKeyDown={handleKeyDown}
      >
        <VisuallyHidden>
          <DialogTitle>Command Menu</DialogTitle>
        </VisuallyHidden>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Command className="w-4 h-4" style={{ color: '#a6aab1' }} />
          <input
            type="text"
            placeholder="Search anything or enter a command"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[15px] placeholder:text-[#a6aab1] focus:outline-none"
            style={{ color: '#0e1011' }}
            autoFocus
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap",
                activeFilter === tab.id
                  ? "bg-[#f0f0f0] text-[#1a1a1a]"
                  : "text-[#565c65] hover:bg-[#f8f8f8]"
              )}
            >
              {tab.icon && <HugeiconsIcon icon={tab.icon} size={14} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto">
          {/* Recent Results Label */}
          <div className="px-4 py-2">
            <span className="text-[12px] font-medium" style={{ color: '#808184' }}>
              {search ? "Results:" : "Recent results:"}
            </span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="px-4 py-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: '#808184' }} />
            </div>
          )}

          {/* Recent contracts when not searching */}
          {!search && !loading && recentContracts.length > 0 && (
            <div>
              {recentContracts.map((result, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <div
                    key={result.id}
                    onClick={() => handleSelect(result.href, result)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      isSelected ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#f5f5f5' }}
                    >
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate" style={{ color: '#0e1011' }}>
                        {result.title}
                      </p>
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: '#75797b' }}>
                        <span>{result.category}</span>
                        {result.status && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: result.status.color }}
                              />
                              {result.status.label}
                            </span>
                          </>
                        )}
                        {result.timestamp && (
                          <>
                            <span>·</span>
                            <span>{result.timestamp}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className="w-6 h-6 rounded border flex items-center justify-center text-[11px] font-medium shrink-0"
                      style={{ borderColor: '#e5e6e7', color: '#808184' }}
                    >
                      {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No recent contracts when not searching */}
          {!search && !loading && recentContracts.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-[13px]" style={{ color: '#808184' }}>
                No recent contracts
              </p>
            </div>
          )}

          {/* Show results when searching */}
          {search && results.length > 0 && (
            <div>
                {results.map((result, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleSelect(result.href, result)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        isSelected ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#f5f5f5' }}
                      >
                        {result.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate" style={{ color: '#0e1011' }}>
                          {result.title}
                        </p>
                        <div className="flex items-center gap-2 text-[12px]" style={{ color: '#75797b' }}>
                          <span>{result.category}</span>
                          {result.status && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: result.status.color }}
                                />
                                {result.status.label}
                              </span>
                            </>
                          )}
                          {result.timestamp && (
                            <>
                              <span>·</span>
                              <span>{result.timestamp}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions (show on selected) */}
                      {isSelected && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white" style={{ borderColor: '#e5e6e7' }}>
                            <Link2 className="w-4 h-4" style={{ color: '#565c65' }} />
                          </button>
                          <button className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-white" style={{ borderColor: '#e5e6e7' }}>
                            <Trash2 className="w-4 h-4" style={{ color: '#565c65' }} />
                          </button>
                        </div>
                      )}

                      {/* Index number */}
                      <div
                        className="w-6 h-6 rounded border flex items-center justify-center text-[11px] font-medium shrink-0"
                        style={{ borderColor: '#e5e6e7', color: '#808184' }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Quick Actions */}
          {search === "" && !loading && (
            <>
              <div className="px-4 py-2">
                <span className="text-[12px] font-medium" style={{ color: '#808184' }}>
                  Quick actions:
                </span>
              </div>
              <div>
                {quickActions.map((action, index) => {
                  const actualIndex = recentContracts.length + index;
                  const isSelected = selectedIndex === actualIndex;
                  return (
                    <div
                      key={action.id}
                      onClick={() => handleSelect(action.href)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        isSelected ? "bg-[#f5f5f5]" : "hover:bg-[#fafafa]"
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#f5f5f5' }}
                      >
                        <HugeiconsIcon icon={action.icon} size={20} style={{ color: '#565c65' }} />
                      </div>
                      <span className="text-[14px] font-medium" style={{ color: '#0e1011' }}>
                        {action.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* No results */}
          {results.length === 0 && search !== "" && (
            <div className="py-12 text-center">
              <p className="text-[14px]" style={{ color: '#808184' }}>
                No results found for "{search}"
              </p>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div
          className="flex items-center gap-6 px-4 py-3"
          style={{ backgroundColor: '#f9fbfc' }}
        >
          <div className="flex items-center gap-2 text-[12px]" style={{ color: '#747983' }}>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border flex items-center justify-center" style={{ backgroundColor: '#fff', borderColor: '#e5e6e7' }}>
                <HugeiconsIcon icon={ArrowUp02Icon} size={12} />
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border flex items-center justify-center" style={{ backgroundColor: '#fff', borderColor: '#e5e6e7' }}>
                <HugeiconsIcon icon={ArrowDown02Icon} size={12} />
              </kbd>
            </div>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: '#747983' }}>
            <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ backgroundColor: '#fff', borderColor: '#e5e6e7' }}>RETURN</kbd>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: '#747983' }}>
            <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ backgroundColor: '#fff', borderColor: '#e5e6e7' }}>TAB</kbd>
            <span>Actions</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: '#747983' }}>
            <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ backgroundColor: '#fff', borderColor: '#e5e6e7' }}>/</kbd>
            <span>Guide</span>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: '#747983' }}>
            <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ backgroundColor: '#fff', borderColor: '#e5e6e7' }}>ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
