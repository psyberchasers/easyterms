"use client";

import { ArrowUp, BookOpen, Upload, FileText, AlertTriangle, CheckCircle2, X, Paperclip } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiCloudIcon, CloudUploadIcon, AttachmentIcon } from "@hugeicons-pro/core-stroke-rounded";
import {
  AnimatePresence,
  motion,
  MotionConfig,
} from "motion/react";
import { JSX, useMemo, useCallback, useEffect } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import React from "react";

import { cn } from "@/lib/utils";
import { ContractAnalysis } from "@/types/contract";
import { createClient } from "@/lib/supabase/client";

// Contract type for attached contracts
interface AttachableContract {
  id: string;
  title: string;
  overall_risk: "high" | "medium" | "low" | null;
  contract_type: string | null;
  analysis: ContractAnalysis | null;
}

// Animation constants
const ANIMATION_DURATION = 0.1;

// Component for animated placeholder text
const AnimatedPlaceholder = ({
  isDeepMindMode,
}: {
  isDeepMindMode: boolean;
}) => (
  <AnimatePresence mode="wait">
    <motion.p
      key={isDeepMindMode ? "search" : "ask"}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: ANIMATION_DURATION }}
      className="text-foreground/20 pointer-events-none absolute"
    >
      {isDeepMindMode ? "Deep analysis mode..." : "Ask about your contracts..."}
    </motion.p>
  </AnimatePresence>
);

// Message type definition
interface ChatMessage {
  id: number;
  message: string;
  isFromUser: boolean;
  type?: "text" | "file" | "analysis";
  fileName?: string;
  analysis?: ContractAnalysis;
}

// Analysis Result Component
const AnalysisResult = ({ analysis, fileName }: { analysis: ContractAnalysis; fileName: string }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 border-red-400/30 bg-red-500/10";
      case "medium": return "text-amber-400 border-amber-400/30 bg-amber-500/10";
      case "low": return "text-emerald-400 border-emerald-400/30 bg-emerald-500/10";
      default: return "text-muted-foreground border-border";
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="bg-purple-500/15 px-4 py-3 flex items-center gap-3 rounded-t-2xl">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {analysis.contractType && <span>{analysis.contractType}</span>}
            {analysis.contractType && analysis.overallRiskAssessment && <span>·</span>}
            {analysis.overallRiskAssessment && (
              <span>
                {analysis.overallRiskAssessment === "low" ? "Low Risk" :
                 analysis.overallRiskAssessment === "medium" ? "Medium Risk" :
                 analysis.overallRiskAssessment === "high" ? "High Risk" : "Analyzed"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-4 border-t border-border/50 rounded-b-2xl">
        <p className="text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Key Stats */}
      {(analysis.financialTerms?.royaltyRate || analysis.termLength) && (
        <div className="grid grid-cols-2 border-t border-border/50 w-full rounded-b-2xl">
          {analysis.financialTerms?.royaltyRate && (
            <div className="bg-background/50 p-4 border-r border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Royalty</p>
              <p className="text-sm font-semibold">{analysis.financialTerms.royaltyRate}</p>
            </div>
          )}
          {analysis.termLength && (
            <div className="bg-background/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Term</p>
              <p className="text-sm font-semibold">{analysis.termLength}</p>
            </div>
          )}
        </div>
      )}

      {/* Concerns */}
      {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
        <div className="bg-red-500/5 p-4 border-t border-border/50 rounded-b-2xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-400">{analysis.potentialConcerns.length} Concerns</span>
          </div>
          <ul className="space-y-1.5">
            {analysis.potentialConcerns.slice(0, 3).map((concern, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>{concern}</span>
              </li>
            ))}
            {analysis.potentialConcerns.length > 3 && (
              <li className="text-xs text-muted-foreground pl-3.5">
                +{analysis.potentialConcerns.length - 3} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-emerald-500/5 p-4 border-t border-border/50 rounded-b-2xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Recommendations</span>
          </div>
          <ul className="space-y-1.5">
            {analysis.recommendations.slice(0, 2).map((rec, i) => {
              const advice = typeof rec === 'object' ? rec.advice : rec;
              return (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{advice}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// Format chat message with basic markdown-like styling
const FormattedMessage = ({ content }: { content: string }) => {
  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, pIndex) => {
        // Check if it's a numbered list
        if (/^\d+\.\s/.test(paragraph)) {
          const items = paragraph.split(/\n(?=\d+\.\s)/);
          return (
            <ol key={pIndex} className="space-y-2">
              {items.map((item, iIndex) => {
                const match = item.match(/^(\d+)\.\s\*\*([^*]+)\*\*:?\s*([\s\S]*)/);
                if (match) {
                  return (
                    <li key={iIndex} className="text-sm">
                      <span className="font-semibold text-foreground">{match[2]}</span>
                      {match[3] && <span className="text-foreground/80">: {match[3]}</span>}
                    </li>
                  );
                }
                const simpleMatch = item.match(/^(\d+)\.\s*([\s\S]*)/);
                if (simpleMatch) {
                  return (
                    <li key={iIndex} className="text-sm text-foreground/80">
                      {simpleMatch[2]}
                    </li>
                  );
                }
                return <li key={iIndex} className="text-sm">{item}</li>;
              })}
            </ol>
          );
        }

        // Check if it's a bullet list
        if (/^[-•]\s/.test(paragraph)) {
          const items = paragraph.split(/\n(?=[-•]\s)/);
          return (
            <ul key={pIndex} className="space-y-1.5">
              {items.map((item, iIndex) => (
                <li key={iIndex} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <span>{item.replace(/^[-•]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          );
        }

        // Regular paragraph - handle inline bold
        const parts = paragraph.split(/\*\*([^*]+)\*\*/g);
        return (
          <p key={pIndex} className="text-sm leading-relaxed text-foreground/80">
            {parts.map((part, partIndex) =>
              partIndex % 2 === 1
                ? <strong key={partIndex} className="font-semibold text-foreground">{part}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
};

const ChatUI = () => {
  // Input and UI state
  const [userInput, setUserInput] = useState("");
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmit, setIsSubmit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat messages state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageElementsRef = useRef<HTMLDivElement[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState("Thinking...");

  // Animation state
  const [messageIndex, setMessageIndex] = useState(0);

  // Deep Mind state
  const [isDeepMindMode, setIsDeepMindMode] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Current contract analysis context
  const [currentAnalysis, setCurrentAnalysis] = useState<ContractAnalysis | null>(null);

  // Contract attachment state
  const [availableContracts, setAvailableContracts] = useState<AttachableContract[]>([]);
  const [attachedContracts, setAttachedContracts] = useState<AttachableContract[]>([]);
  const [showContractPicker, setShowContractPicker] = useState(false);
  const [contractSearch, setContractSearch] = useState("");
  const [showAtMention, setShowAtMention] = useState(false);
  const [atMentionIndex, setAtMentionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contractPickerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch user's contracts
  useEffect(() => {
    const fetchContracts = async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, overall_risk, contract_type, analysis")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setAvailableContracts(data as AttachableContract[]);
      }
    };

    fetchContracts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("chat-contracts")
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
  }, [supabase]);

  // Handle @ mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);

    // Check for @ trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Only show if @ is at start or after whitespace, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if ((charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) && !textAfterAt.includes(" ")) {
        setShowAtMention(true);
        setContractSearch(textAfterAt.toLowerCase());
        setAtMentionIndex(lastAtIndex);
        return;
      }
    }
    setShowAtMention(false);
    setAtMentionIndex(-1);
  };

  // Filter contracts for @ mention dropdown
  const filteredContracts = useMemo(() => {
    return availableContracts
      .filter(c => !attachedContracts.some(ac => ac.id === c.id))
      .filter(c => c.title.toLowerCase().includes(contractSearch));
  }, [availableContracts, attachedContracts, contractSearch]);

  // Add contract from @ mention
  const addContractFromMention = (contract: AttachableContract) => {
    setAttachedContracts(prev => [...prev, contract]);
    // Remove @ and search text from input
    const newInput = userInput.substring(0, atMentionIndex) + userInput.substring(textareaRef.current?.selectionStart || atMentionIndex);
    setUserInput(newInput);
    setShowAtMention(false);
    setAtMentionIndex(-1);
    textareaRef.current?.focus();
  };

  // Add contract from picker button
  const addContractFromPicker = (contract: AttachableContract) => {
    if (!attachedContracts.some(c => c.id === contract.id)) {
      setAttachedContracts(prev => [...prev, contract]);
    }
    setShowContractPicker(false);
  };

  // Remove attached contract
  const removeAttachedContract = (contractId: string) => {
    setAttachedContracts(prev => prev.filter(c => c.id !== contractId));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contractPickerRef.current && !contractPickerRef.current.contains(e.target as Node)) {
        setShowContractPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle file analysis
  const handleFileAnalysis = useCallback(async (file: File) => {
    // Add user message showing file upload
    const fileMessage: ChatMessage = {
      id: Date.now(),
      message: `Analyzing: ${file.name}`,
      isFromUser: true,
      type: "file",
      fileName: file.name,
    };
    setChatMessages((prev) => [...prev, fileMessage]);
    setMessageIndex((i) => i + 1);

    // Show thinking state
    setIsThinking(true);
    setThinkingMessage("Analyzing contract...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("industry", "music");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();

      // Store analysis for chat context
      setCurrentAnalysis(data.analysis);

      // Add analysis result message
      const analysisMessage: ChatMessage = {
        id: Date.now() + 1,
        message: "",
        isFromUser: false,
        type: "analysis",
        fileName: file.name,
        analysis: data.analysis,
      };
      setChatMessages((prev) => [...prev, analysisMessage]);
      setMessageIndex((i) => i + 1);
    } catch (err) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: `Failed to analyze contract: ${err instanceof Error ? err.message : "Unknown error"}`,
        isFromUser: false,
        type: "text",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      setThinkingMessage("Thinking...");
    }
  }, []);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".doc") || file.name.endsWith(".docx") || file.name.endsWith(".txt"))) {
      handleFileAnalysis(file);
    }
  }, [handleFileAnalysis]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileAnalysis(file);
    }
    // Reset input
    if (e.target) e.target.value = "";
  }, [handleFileAnalysis]);

  // Handle message submission
  const handleMessageSubmit = async () => {
    if (isSubmit) {
      setIsSubmit(false);
      return;
    }

    if (userInput.trim() === "") {
      return;
    }

    setIsSubmit(true);
    const currentInput = userInput;
    setUserInput("");
    setMessageIndex((currentIndex) =>
      currentIndex === 0 ? currentIndex + 1 : currentIndex + 2,
    );

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      message: currentInput,
      isFromUser: true,
      type: "text",
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Show thinking state
    setIsThinking(true);

    try {
      // Build chat history for context
      const history = chatMessages
        .filter((m) => m.type === "text")
        .slice(-6)
        .map((m) => ({
          role: m.isFromUser ? "user" : "assistant",
          content: m.message,
        }));

      // Build attached contracts context
      const attachedAnalyses = attachedContracts
        .filter(c => c.analysis)
        .map(c => ({
          id: c.id,
          title: c.title,
          analysis: c.analysis,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          analysis: currentAnalysis,
          history,
          attachedContracts: attachedAnalyses,
        }),
      });

      const data = await response.json();

      // Add bot response
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        message: data.response || "I'm sorry, I couldn't process that. Please try again.",
        isFromUser: false,
        type: "text",
      };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: "Sorry, I encountered an error. Please try again.",
        isFromUser: false,
        type: "text",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      setIsSubmit(false);
    }
  };

  // Auto-scroll to latest message when new messages are added
  useLayoutEffect(() => {
    // Smooth scroll to the bottom of messages
    requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    });
  }, [chatMessages]);

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <div
        className={cn(
          "bg-background flex h-full w-full items-center justify-center relative transition-colors",
          isDragging && "bg-purple-500/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-purple-500/50">
                <Upload className="w-12 h-12 text-purple-500" />
                <p className="text-lg font-medium text-foreground">Drop your contract here</p>
                <p className="text-sm text-muted-foreground">PDF, Word, or TXT files</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Chat Messages Container */}
        <motion.div className="no-scroll flex h-full max-w-3xl flex-1 flex-col overflow-y-auto scroll-smooth px-3 pt-4 pb-40">
          {chatMessages.length === 0 && (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <HugeiconsIcon icon={AiCloudIcon} size={120} className="text-muted-foreground/10" />
              <p className="text-sm text-muted-foreground/40">Drop a contract or click to upload</p>
            </div>
          )}
          {chatMessages.map((message, messageId) => (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              ref={(element) => {
                if (element) {
                  messageElementsRef.current[messageId] = element;
                }
              }}
              key={message.id}
              className={cn(
                "my-2 w-fit break-words rounded-2xl",
                message.isFromUser
                  ? "self-end bg-purple-500 text-white max-w-xs px-4 py-3"
                  : "self-start bg-muted max-w-md px-4 py-3",
                message.type === "analysis" && "max-w-xl !p-0"
              )}
            >
              {message.type === "analysis" && message.analysis ? (
                <AnalysisResult analysis={message.analysis} fileName={message.fileName || "Contract"} />
              ) : message.type === "file" ? (
                <div className="flex flex-col -mx-4 -my-3">
                  <div className="bg-purple-600 px-4 py-2 rounded-t-2xl flex items-center gap-2">
                    <HugeiconsIcon icon={CloudUploadIcon} size={12} className="text-purple-200/70" />
                    <span className="text-xs text-purple-200/70 font-medium">Upload initiated</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-sm text-white/90">{message.fileName}</span>
                  </div>
                </div>
              ) : !message.isFromUser ? (
                <FormattedMessage content={message.message} />
              ) : (
                message.message
              )}
            </motion.div>
          ))}
          {isThinking && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{ delay: 0.25 }}
              className="bg-muted/50 my-2 w-fit max-w-xs self-start rounded-2xl px-4 py-2"
            >
              <TextShimmer>{thinkingMessage}</TextShimmer>
            </motion.div>
          )}
          <div ref={messageEndRef} />
        </motion.div>

        {/* Input Container */}
        <div
          ref={inputContainerRef}
          className="fixed bottom-0 w-full max-w-3xl px-3 pb-4"
        >
          {/* Suggestion Pills */}
          {chatMessages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm rounded-full border border-dashed border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Contract
              </button>
              {[
                "What can you analyze?",
                "How does it work?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setUserInput(suggestion)}
                  className="px-4 py-2 text-sm rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="bg-muted rounded-2xl border border-border">
            <div className="bg-background outline-border relative rounded-2xl outline outline-border">
              {/* Attached Contracts Chips */}
              {attachedContracts.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                  {attachedContracts.map((contract) => {
                    const riskColor = contract.overall_risk === "high" ? "bg-red-500" :
                                     contract.overall_risk === "medium" ? "bg-amber-500" :
                                     contract.overall_risk === "low" ? "bg-emerald-500" : "bg-muted-foreground/50";
                    return (
                      <motion.div
                        key={contract.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${riskColor}`} />
                        <span className="text-purple-400 font-medium max-w-[150px] truncate">{contract.title}</span>
                        <button
                          onClick={() => removeAttachedContract(contract.id)}
                          className="p-0.5 hover:bg-purple-500/20 rounded transition-colors"
                        >
                          <X className="w-3 h-3 text-purple-400/70" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Text Input Area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  autoFocus
                  placeholder=""
                  className="field-sizing-content pr-15 max-h-52 w-full resize-none rounded-none !bg-transparent p-4 !text-base leading-[1.2] shadow-none focus-visible:outline-0 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleMessageSubmit();
                    }
                    // Close @ mention on Escape
                    if (e.key === "Escape" && showAtMention) {
                      setShowAtMention(false);
                    }
                  }}
                  onChange={handleInputChange}
                />
                {!userInput && (
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-full p-4">
                    <AnimatedPlaceholder isDeepMindMode={isDeepMindMode} />
                  </div>
                )}

                {/* @ Mention Dropdown */}
                <AnimatePresence>
                  {showAtMention && filteredContracts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-4 bottom-full mb-2 w-72 max-h-48 overflow-y-auto bg-background border border-border rounded-xl shadow-lg z-50"
                    >
                      <div className="p-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2 py-1.5">
                          Reference a contract
                        </p>
                        {filteredContracts.slice(0, 5).map((contract) => {
                          const riskColor = contract.overall_risk === "high" ? "bg-red-500" :
                                           contract.overall_risk === "medium" ? "bg-amber-500" :
                                           contract.overall_risk === "low" ? "bg-emerald-500" : "bg-muted-foreground/50";
                          return (
                            <button
                              key={contract.id}
                              onClick={() => addContractFromMention(contract)}
                              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <span className={`w-2 h-2 rounded-full ${riskColor} shrink-0`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{contract.title}</p>
                                {contract.contract_type && (
                                  <p className="text-[11px] text-muted-foreground truncate">{contract.contract_type}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => handleMessageSubmit()}
                className="hover:bg-muted hover:border-border absolute right-2 top-2 flex size-10 items-center justify-center rounded-xl border border-transparent p-2"
              >
                {!isSubmit ? (
                  <ArrowUp className="size-5" />
                ) : (
                  <div className="size-3.5 rounded-[4px] bg-current"></div>
                )}
              </button>
            </div>
            <div className="flex h-10 items-center justify-between px-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:bg-background/50 hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-100 active:scale-95"
                >
                  <Upload className="size-4" />
                  <span className="text-xs font-medium">Upload</span>
                </button>
                <div className="relative" ref={contractPickerRef}>
                  <button
                    onClick={() => setShowContractPicker(!showContractPicker)}
                    className={cn(
                      "text-muted-foreground hover:bg-background/50 hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-100 active:scale-95",
                      showContractPicker && "bg-background/50 text-foreground"
                    )}
                  >
                    <Paperclip className="size-4" />
                    <span className="text-xs font-medium">Attach</span>
                    {attachedContracts.length > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-purple-500 text-white text-[10px] font-bold">
                        {attachedContracts.length}
                      </span>
                    )}
                  </button>

                  {/* Contract Picker Dropdown */}
                  <AnimatePresence>
                    {showContractPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 bottom-full mb-2 w-80 max-h-64 overflow-y-auto bg-background border border-border rounded-xl shadow-lg z-50"
                      >
                        <div className="p-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2 py-1.5">
                            Your Contracts
                          </p>
                          {availableContracts.length === 0 ? (
                            <p className="text-sm text-muted-foreground px-2 py-3">
                              No contracts yet. Upload one to get started.
                            </p>
                          ) : (
                            availableContracts.map((contract) => {
                              const isAttached = attachedContracts.some(c => c.id === contract.id);
                              const riskColor = contract.overall_risk === "high" ? "bg-red-500" :
                                               contract.overall_risk === "medium" ? "bg-amber-500" :
                                               contract.overall_risk === "low" ? "bg-emerald-500" : "bg-muted-foreground/50";
                              return (
                                <button
                                  key={contract.id}
                                  onClick={() => addContractFromPicker(contract)}
                                  disabled={isAttached}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left",
                                    isAttached ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                                  )}
                                >
                                  <span className={`w-2 h-2 rounded-full ${riskColor} shrink-0`} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{contract.title}</p>
                                    {contract.contract_type && (
                                      <p className="text-[11px] text-muted-foreground truncate">{contract.contract_type}</p>
                                    )}
                                  </div>
                                  {isAttached && (
                                    <span className="text-[10px] text-purple-400 font-medium">Added</span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-muted-foreground/50 pr-2 text-xs">
                Powered by EasyTerms
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

function TextShimmerComponent({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements,
  );

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className,
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);

export { ChatUI };
