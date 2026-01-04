"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { Link2, Trash2, Command } from "lucide-react";

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
  { id: "tasks", label: "Tasks", icon: Task01Icon },
  { id: "documents", label: "Documents", icon: File01Icon },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "contracts", label: "Contracts", icon: ContractsIcon },
  { id: "projects", label: "Projects", icon: Folder01Icon },
  { id: "templates", label: "Templates", icon: GridViewIcon },
];

// Mock recent results - in real app, this would come from API/state
const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Recording Agreement Draft",
    category: "Contracts",
    icon: <HugeiconsIcon icon={ContractsIcon} size={20} style={{ color: '#565c65' }} />,
    timestamp: "2:30 PM, January 3",
    href: "/dashboard/contracts",
  },
  {
    id: "2",
    title: "Publishing Deal Analysis",
    category: "Documents",
    icon: <HugeiconsIcon icon={File01Icon} size={20} style={{ color: '#565c65' }} />,
    timestamp: "11:45 AM, January 2",
    href: "/dashboard/documents",
  },
  {
    id: "3",
    title: "Artist Management Contract",
    category: "Contracts",
    icon: <HugeiconsIcon icon={ContractsIcon} size={20} style={{ color: '#565c65' }} />,
    status: { label: "High Risk", color: "#ef4444" },
    timestamp: "9:15 AM, December 28",
    href: "/dashboard/contracts",
  },
  {
    id: "4",
    title: "Q4 Royalty Reports",
    category: "Reports",
    icon: <HugeiconsIcon icon={ChartHistogramIcon} size={20} style={{ color: '#565c65' }} />,
    timestamp: "4:00 PM, December 20",
    href: "/dashboard",
  },
  {
    id: "5",
    title: "Distribution Agreement",
    category: "Contracts",
    icon: <HugeiconsIcon icon={ContractsIcon} size={20} style={{ color: '#565c65' }} />,
    status: { label: "Low Risk", color: "#22c55e" },
    timestamp: "1:20 PM, December 15",
    href: "/dashboard/contracts",
  },
];

const quickActions = [
  { id: "upload", label: "Upload Contract", icon: FileUploadIcon, href: "/dashboard/upload" },
  { id: "home", label: "Go to Dashboard", icon: Home01Icon, href: "/dashboard" },
  { id: "contracts", label: "View Contracts", icon: ContractsIcon, href: "/dashboard/contracts" },
  { id: "settings", label: "Settings", icon: Settings02Icon, href: "/settings" },
];

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>(mockResults);

  // Filter results based on search and active filter
  useEffect(() => {
    let filtered = mockResults;

    if (search) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeFilter !== "all") {
      filtered = filtered.filter(r =>
        r.category.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    setResults(filtered);
    setSelectedIndex(0);
  }, [search, activeFilter]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = results.length + quickActions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < results.length) {
        router.push(results[selectedIndex].href);
        onOpenChange(false);
      } else {
        const actionIndex = selectedIndex - results.length;
        router.push(quickActions[actionIndex].href);
        onOpenChange(false);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }, [results, selectedIndex, router, onOpenChange]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
      setActiveFilter("all");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = (href: string) => {
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
          {/* Recent Results */}
          {results.length > 0 && (
            <>
              <div className="px-4 py-2">
                <span className="text-[12px] font-medium" style={{ color: '#808184' }}>
                  Recent results:
                </span>
              </div>
              <div>
                {results.map((result, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleSelect(result.href)}
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
                          <button
                            className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                            style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
                          >
                            Select
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
            </>
          )}

          {/* Quick Actions */}
          {search === "" && (
            <>
              <div className="px-4 py-2">
                <span className="text-[12px] font-medium" style={{ color: '#808184' }}>
                  Quick actions:
                </span>
              </div>
              <div>
                {quickActions.map((action, index) => {
                  const actualIndex = results.length + index;
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
