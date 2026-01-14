"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Upload,
  GitCompare,
  MessageSquare,
  Home,
  Settings,
  CreditCard,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiSearch02Icon } from "@hugeicons-pro/core-stroke-rounded";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface SearchCommandProps {
  className?: string;
}

const SearchCommand = ({ className }: SearchCommandProps) => {
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();

  const commandGroups = [
    {
      heading: "Navigation",
      icon: ArrowRight,
      items: [
        { label: "Home", icon: Home, href: "/dashboard" },
        { label: "Contracts", icon: FileText, href: "/dashboard/contracts" },
        { label: "Upload Contract", icon: Upload, href: "/dashboard/upload-contract" },
        { label: "Compare", icon: GitCompare, href: "/dashboard/compare" },
        { label: "Chat", icon: MessageSquare, href: "/dashboard/chat" },
      ],
    },
    {
      heading: "Settings",
      icon: Settings,
      items: [
        { label: "Billing", icon: CreditCard, href: "/settings/billing", shortcut: "⌘B" },
        { label: "Settings", icon: Settings, href: "/settings", shortcut: "⌘S" },
      ],
    },
  ];

  const handleSelect = (href: string) => {
    setIsActive(false);
    setInput("");
    router.push(href);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable);

      // Press ⌘K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k" && !isActive) {
        e.preventDefault();
        setIsActive(true);
      }

      // Press Esc to close
      if (e.key === "Escape" && isActive) {
        e.preventDefault();
        setIsActive(false);
        setInput("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  return (
    <>
      <MotionConfig
        transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.1 }}
      >
        <div className="relative">
          <motion.button
            layoutId="search-wrapper"
            onClick={() => setIsActive(true)}
            className="group relative flex h-8 w-8 sm:w-auto sm:px-3 items-center justify-center sm:justify-start gap-2 border border-border hover:bg-muted transition-colors rounded-md text-[13px] font-semibold text-muted-foreground"
          >
            <motion.span layoutId="search-icon">
              <HugeiconsIcon icon={AiSearch02Icon} size={14} />
            </motion.span>
            <span className="hidden sm:inline">Search</span>
          </motion.button>

          <AnimatePresence>
            {isActive && (
              <motion.div
                layoutId="search-wrapper"
                className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 w-[90vw] max-w-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Command
                  value={input}
                  onValueChange={setInput}
                  className="bg-card rounded-xl border border-border shadow-2xl"
                >
                  {/* Search input */}
                  <div className="flex items-center border-b border-border px-3">
                    <motion.span layoutId="search-icon">
                      <HugeiconsIcon icon={AiSearch02Icon} size={16} className="text-muted-foreground" />
                    </motion.span>
                    <CommandInput
                      autoFocus
                      placeholder="Search..."
                      className="border-0 focus:ring-0"
                    />
                    <kbd className="hidden sm:flex items-center justify-center rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      ESC
                    </kbd>
                  </div>

                  {/* Results */}
                  <CommandList className="max-h-[300px] overflow-y-auto p-2">
                    <CommandEmpty>No results found.</CommandEmpty>
                    {commandGroups.map((group, groupIndex) => (
                      <React.Fragment key={groupIndex}>
                        {groupIndex > 0 && <CommandSeparator className="my-2" />}
                        <CommandGroup heading={group.heading}>
                          {group.items.map((item, itemIndex) => (
                            <CommandItem
                              key={itemIndex}
                              onSelect={() => handleSelect(item.href)}
                              className="cursor-pointer rounded-lg px-3 py-2 data-[selected=true]:bg-muted"
                            >
                              <item.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span>{item.label}</span>
                              {"shortcut" in item && item.shortcut && (
                                <CommandShortcut>
                                  {item.shortcut}
                                </CommandShortcut>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </React.Fragment>
                    ))}
                  </CommandList>
                </Command>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>

      {/* Backdrop */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsActive(false)}
            className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export { SearchCommand };
