"use no memo";
"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CircleDashed,
  Cog,
  SearchIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";

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

const Skiper92 = () => {
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState("");

  const commandGroups = [
    {
      heading: "Suggestions",
      icon: ArrowRight,
      items: [
        { label: "Calendar" },
        { label: "Search Emoji" },
        { label: "Calculator" },
        { label: "Documents" },
        { label: "Images" },
        { label: "Music" },
      ],
    },
    {
      heading: "Settings",
      icon: Cog,
      items: [
        { label: "Profile", shortcut: "⌘P" },
        { label: "Billing", shortcut: "⌘B" },
        { label: "Settings", shortcut: "⌘S" },
        { label: "Notifications", shortcut: "⌘N" },
        { label: "Messages", shortcut: "⌘M" },
        { label: "Security", shortcut: "⌘T" },
      ],
    },
    {
      heading: "Help",
      icon: CircleDashed,
      items: [{ label: "FAQ" }, { label: "Contact Support" }],
    },
    {
      heading: "Docs",
      icon: BookOpen,
      items: [{ label: "Documentation" }, { label: "Tutorials" }],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable);

      // Press F to open (only if not typing in an input)
      if ((e.key === "f" || e.key === "F") && !isActive && !isInputFocused) {
        e.preventDefault();
        setIsActive(true);
      }

      // Press Esc to close (only if active)
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
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      <div className="-mt-36 mb-36 grid content-start justify-items-center gap-6 text-center">
        <span className="after:to-foreground relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:content-['']">
          Press F or click in input
        </span>
      </div>
      <MotionConfig
        transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.1 }}
      >
        <div className="z-99 relative">
          <motion.button
            layoutId="wrapper"
            onClick={() => setIsActive((x) => !x)}
            className="group relative flex h-8 w-[192px] items-center"
          >
            <motion.div
              layoutId="border"
              className="group-hover:border-foreground/20 absolute inset-0 origin-top-left border transition-colors"
              style={{
                borderRadius: 6,
              }}
            ></motion.div>
            <div className="flex flex-1 items-center">
              <span className="flex size-8 items-center justify-center">
                <motion.span layoutId="icon">
                  <SearchIcon className="size-4 opacity-50" />
                </motion.span>
              </span>

              <span className="relative flex flex-1 items-center opacity-40">
                <motion.span
                  layoutId="center"
                  className="absolute grid h-8 w-[286px] flex-1 cursor-text items-center text-left text-sm"
                >
                  Find...
                </motion.span>
              </span>

              <motion.span
                layoutId="wordwrapper"
                transition={{ duration: 0.1 }}
                className="flex size-8 items-center justify-center"
              >
                <kbd className="size-5.5 flex items-center justify-center rounded-sm border text-xs">
                  F
                </kbd>
              </motion.span>
            </div>
          </motion.button>
          <AnimatePresence>
            {isActive ? (
              <motion.div
                layoutId="wrapper"
                className="absolute -left-4 -top-2 flex w-96 flex-col rounded-xl"
              >
                <Command
                  value={input}
                  onValueChange={setInput}
                  className="bg-muted rounded-lg shadow-md"
                >
                  {/* border */}
                  <motion.div
                    // layoutId="border"
                    style={{ borderRadius: 12 }}
                    className="absolute -inset-px origin-top-left border"
                  ></motion.div>

                  {/* serach inpnput */}
                  <label className="relative flex w-full items-center border-b">
                    <span className="flex size-12 items-center justify-center">
                      <motion.span layoutId="icon">
                        <SearchIcon className="size-4" />
                      </motion.span>
                    </span>

                    <motion.span
                      layoutId="center"
                      className="flex h-full flex-1 items-center text-left [&_[data-slot=command-input-wrapper]]:border-none [&_[data-slot=command-input-wrapper]]:px-0 [&_[data-slot=command-input-wrapper]_svg]:hidden"
                    >
                      <CommandInput
                        autoFocus
                        className=""
                        placeholder="Find..."
                      />
                    </motion.span>
                    <motion.span
                      layoutId="wordwrapper"
                      className="flex size-12 items-center justify-center pr-1"
                    >
                      <kbd className="flex items-center justify-center rounded-sm border px-1 py-0.5 text-xs tracking-tighter">
                        Esc
                      </kbd>
                    </motion.span>
                  </label>

                  {/* Bottom col */}
                  <motion.div
                    layoutId="none"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="relative overflow-x-clip md:overflow-y-clip"
                  >
                    <CommandList className="scroll-fade-y">
                      <CommandEmpty>No results found.</CommandEmpty>
                      {commandGroups.map((group, groupIndex) => (
                        <React.Fragment key={groupIndex}>
                          {groupIndex > 0 && <CommandSeparator />}
                          <CommandGroup heading={group.heading}>
                            {group.items.map((item, itemIndex) => (
                              <CommandItem
                                key={itemIndex}
                                className="data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground"
                              >
                                <group.icon className="size-4" />
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
                  </motion.div>
                </Command>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {isActive && (
            <motion.div
              onClick={() => setIsActive(false)}
              className="z-90 bg-muted/80 absolute left-0 top-0 h-screen w-screen"
            ></motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
};

export { Skiper92 };
