"use client";

import { ArrowUp, Upload, FileText, AlertTriangle, CheckCircle2, X, PanelLeft } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiCloudIcon, CloudUploadIcon, AttachmentIcon, PanelRightIcon } from "@hugeicons-pro/core-stroke-rounded";
import { AiEditingIcon, Chat01Icon, Delete02Icon, TransactionHistoryIcon, Upload04Icon, Link02Icon, AtIcon } from "@hugeicons-pro/core-bulk-rounded";
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

// Conversation types
interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface StoredMessage {
  id: string;
  content: string;
  is_from_user: boolean;
  message_type: string;
  file_name: string | null;
  analysis: ContractAnalysis | null;
  attached_contract_ids: string[] | null;
  created_at: string;
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

// Helper to render text with inline bold
const renderWithBold = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-foreground">{part}</strong>
      : part
  );
};

// Format chat message with basic markdown-like styling
const FormattedMessage = ({ content }: { content: string }) => {
  // Split by newlines to process line by line
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let lastWasListItem = false;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      elements.push(
        <p key={elements.length} className="text-sm leading-relaxed text-foreground/80">
          {renderWithBold(text)}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={elements.length} className="space-y-2">
            {currentList.items.map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                <span>{renderWithBold(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={elements.length} className="space-y-2">
            {currentList.items.map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-purple-400 font-medium w-5 shrink-0">{i + 1}.</span>
                <span>{renderWithBold(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Empty line - only flush if not in a list (to keep list items together)
    if (!trimmedLine) {
      if (!lastWasListItem) {
        flushList();
        flushParagraph();
      }
      lastWasListItem = false;
      continue;
    }

    // Headers (### or ##)
    const headerMatch = trimmedLine.match(/^#{1,3}\s+(.+)$/);
    if (headerMatch) {
      flushList();
      flushParagraph();
      elements.push(
        <p key={elements.length} className="text-sm font-semibold text-foreground mt-2">
          {renderWithBold(headerMatch[1])}
        </p>
      );
      lastWasListItem = false;
      continue;
    }

    // Bullet list item (- or •)
    const bulletMatch = trimmedLine.match(/^[-•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (currentList?.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      lastWasListItem = true;
      continue;
    }

    // Numbered list item
    const numberedMatch = trimmedLine.match(/^\d+\.\s*(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      if (currentList?.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[1]);
      lastWasListItem = true;
      continue;
    }

    // Regular text - add to current paragraph
    flushList();
    currentParagraph.push(trimmedLine);
    lastWasListItem = false;
  }

  // Flush remaining content
  flushList();
  flushParagraph();

  return <div className="space-y-3">{elements}</div>;
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

  // Sidebar and conversation state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Close sidebar on mobile by default
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Disable page-level scrolling - only chat messages should scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    fetchConversations();
  }, []);

  // Load conversation messages when switching
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        // Convert stored messages to ChatMessage format
        const messages: ChatMessage[] = (data.messages || []).map((m: StoredMessage, idx: number) => ({
          id: idx,
          message: m.content,
          isFromUser: m.is_from_user,
          type: m.message_type as "text" | "file" | "analysis",
          fileName: m.file_name || undefined,
          analysis: m.analysis || undefined,
        }));
        setChatMessages(messages);
        setCurrentConversationId(conversationId);
        setMessageIndex(messages.length);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  // Create new conversation
  const createNewConversation = useCallback(async (title?: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "New Chat" }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => [data.conversation, ...prev]);
        setCurrentConversationId(data.conversation.id);
        setChatMessages([]);
        setMessageIndex(0);
        setCurrentAnalysis(null);
        setAttachedContracts([]);
        return data.conversation.id;
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
    return null;
  }, []);

  // Save message to database
  const saveMessage = useCallback(async (
    conversationId: string,
    content: string,
    isFromUser: boolean,
    messageType: string = "text",
    fileName?: string,
    analysis?: ContractAnalysis,
    attachedContractIds?: string[]
  ) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          isFromUser,
          messageType,
          fileName,
          analysis,
          attachedContractIds,
        }),
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  }, []);

  // Generate and update conversation title based on first message using AI
  const generateTitle = useCallback(async (conversationId: string, firstMessage: string) => {
    try {
      // Use AI to generate a concise title
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a very short title (3-5 words max) for a conversation that starts with: "${firstMessage}". Reply with ONLY the title, no quotes or punctuation.`,
          history: [],
        }),
      });

      const data = await response.json();
      let title = data.response?.trim() || firstMessage.substring(0, 30);

      // Clean up the title - remove quotes and limit length
      title = title.replace(/^["']|["']$/g, '').substring(0, 40);

      await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      );
    } catch (err) {
      console.error("Failed to generate title:", err);
      // Fallback to simple truncation
      const fallbackTitle = firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title: fallbackTitle } : c)
      );
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setChatMessages([]);
          setMessageIndex(0);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, [currentConversationId]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setChatMessages([]);
    setMessageIndex(0);
    setCurrentAnalysis(null);
    setAttachedContracts([]);
  }, []);

  // Handle file analysis
  const handleFileAnalysis = useCallback(async (file: File) => {
    // Create conversation if needed
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation(`Analysis: ${file.name}`);
    }

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

    // Save user message
    if (convId) {
      saveMessage(convId, `Analyzing: ${file.name}`, true, "file", file.name);
    }

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

      // Save analysis message
      if (convId) {
        saveMessage(convId, data.analysis.summary || "", false, "analysis", file.name, data.analysis);
      }
    } catch (err) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: `Failed to analyze contract: ${err instanceof Error ? err.message : "Unknown error"}`,
        isFromUser: false,
        type: "text",
      };
      setChatMessages((prev) => [...prev, errorMessage]);

      // Save error message
      if (convId) {
        saveMessage(convId, `Failed to analyze contract: ${err instanceof Error ? err.message : "Unknown error"}`, false, "text");
      }
    } finally {
      setIsThinking(false);
      setThinkingMessage("Thinking...");
    }
  }, [currentConversationId, createNewConversation, saveMessage]);

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

    // Create conversation if needed
    let convId = currentConversationId;
    const isFirstMessage = chatMessages.length === 0;
    if (!convId) {
      convId = await createNewConversation();
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      message: currentInput,
      isFromUser: true,
      type: "text",
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Save user message
    const attachedIds = attachedContracts.map(c => c.id);
    if (convId) {
      saveMessage(convId, currentInput, true, "text", undefined, undefined, attachedIds.length > 0 ? attachedIds : undefined);
      // Generate title from first message
      if (isFirstMessage) {
        generateTitle(convId, currentInput);
      }
    }

    // Scroll to bottom immediately after sending
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);

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
      const responseText = data.response || "I'm sorry, I couldn't process that. Please try again.";

      // Add bot response
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        message: responseText,
        isFromUser: false,
        type: "text",
      };
      setChatMessages((prev) => [...prev, botMessage]);

      // Save bot response
      if (convId) {
        saveMessage(convId, responseText, false, "text");
      }
    } catch (err) {
      const errorText = "Sorry, I encountered an error. Please try again.";
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        message: errorText,
        isFromUser: false,
        type: "text",
      };
      setChatMessages((prev) => [...prev, errorMessage]);

      // Save error message
      if (convId) {
        saveMessage(convId, errorText, false, "text");
      }
    } finally {
      setIsThinking(false);
      setIsSubmit(false);
    }
  };

  // Auto-scroll to latest message when new messages are added or thinking
  useLayoutEffect(() => {
    // Delay scroll slightly to ensure DOM is updated
    const scrollToBottom = () => {
      messageEndRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    };

    // Immediate scroll attempt
    scrollToBottom();

    // Delayed scroll to catch animations
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [chatMessages, isThinking]);

  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <div className="flex h-full w-full overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {isSidebarOpen && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Collapsible Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div
              initial={isMobile ? { x: -280, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0, opacity: 1 } : { width: 280, opacity: 1 }}
              exit={isMobile ? { x: -280, opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn(
                "h-full bg-background border-r border-border flex flex-col overflow-hidden",
                isMobile ? "fixed left-0 top-0 z-50 w-[280px] border-t border-border" : "relative"
              )}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between py-3 pl-4 pr-1 border-b border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <HugeiconsIcon icon={TransactionHistoryIcon} size={16} />
                  <span className="text-xs font-semibold">Chat History</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={PanelRightIcon} size={14} />
                </button>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto p-2">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <HugeiconsIcon icon={Chat01Icon} size={32} className="text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Start a new chat to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                          currentConversationId === conv.id
                            ? "bg-purple-500/10 text-foreground"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => {
                          loadConversation(conv.id);
                          if (isMobile) setIsSidebarOpen(false);
                        }}
                      >
                        <span className="flex-1 text-sm truncate">
                          {conv.title || "New Chat"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div
          className={cn(
            "flex-1 bg-background flex h-full w-full flex-col relative transition-colors overflow-hidden",
            isDragging && "bg-purple-500/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Sidebar toggle when closed */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

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

          {/* Chat Messages Container - mb accounts for fixed input height */}
          <motion.div className={cn("flex-1 w-full max-w-3xl mx-auto overflow-y-auto scroll-smooth px-3", attachedContracts.length > 0 ? "mb-[340px] md:mb-52" : "mb-80 md:mb-44")}>
          <div className="min-h-full flex flex-col justify-end pt-4">
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
                  : "self-start bg-muted max-w-2xl px-4 py-3",
                message.type === "analysis" && "max-w-2xl !p-0"
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
              className="bg-muted/50 my-2 w-fit max-w-xs self-start rounded-2xl px-4 py-2"
            >
              <TextShimmer>{thinkingMessage}</TextShimmer>
            </motion.div>
          )}
          <div ref={messageEndRef} />
          </div>
        </motion.div>

        {/* Input Container - positioned above footer */}
        <div
          ref={inputContainerRef}
          className={cn(
            "absolute left-0 right-0 flex justify-center px-3 pb-2 md:pb-4 bg-gradient-to-t from-background from-85% to-transparent",
            attachedContracts.length > 0 ? "pt-6" : "pt-0"
          )}
          style={{ bottom: isMobile ? (isKeyboardOpen ? '160px' : '180px') : '48px' }}
        >
          <div className="w-full max-w-3xl">
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
                  className="field-sizing-content pr-15 max-h-52 w-full resize-none rounded-none !bg-transparent pt-5 pb-0 px-4 md:p-4 !text-base leading-[1.2] shadow-none focus-visible:outline-0 focus-visible:ring-0 min-h-[44px] md:min-h-0"
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
                  onFocus={() => setIsKeyboardOpen(true)}
                  onBlur={() => {
                    setIsKeyboardOpen(false);
                    // Fix iOS keyboard not resetting scroll position
                    window.scrollTo(0, 0);
                  }}
                  onChange={handleInputChange}
                />
                {!userInput && (
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-full pt-5 pb-0 px-4 md:p-4">
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
                  onClick={startNewChat}
                  className="text-muted-foreground hover:bg-background/50 hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-100 active:scale-95"
                >
                  <HugeiconsIcon icon={AiEditingIcon} size={16} />
                  <span className="text-xs font-medium">New</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:bg-background/50 hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-100 active:scale-95"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={16} />
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
                    <HugeiconsIcon icon={Link02Icon} size={16} />
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
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground">
                  <HugeiconsIcon icon={AtIcon} size={16} />
                  <span className="text-xs font-medium">to mention</span>
                </div>
              </div>
              <p className="text-muted-foreground/50 pr-2 text-xs hidden md:block">
                Powered by EasyTerms
              </p>
            </div>
          </div>
          <p className="text-muted-foreground/50 text-xs text-center mt-2 md:hidden">
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
