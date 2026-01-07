"use client";

import { ArrowUp, BookOpen, Upload, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiCloudIcon } from "@hugeicons-pro/core-stroke-rounded";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionValue,
} from "motion/react";
import { JSX, useMemo, useCallback } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import React from "react";

import { cn } from "@/lib/utils";
import { ContractAnalysis } from "@/types/contract";

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
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {analysis.contractType && (
              <p className="text-xs text-muted-foreground">{analysis.contractType}</p>
            )}
          </div>
        </div>
        <span className={cn("text-xs px-2.5 py-1 rounded-full border shrink-0 font-medium", getRiskColor(analysis.overallRiskAssessment || ""))}>
          {analysis.overallRiskAssessment === "low" ? "Low Risk" :
           analysis.overallRiskAssessment === "medium" ? "Medium Risk" :
           analysis.overallRiskAssessment === "high" ? "High Risk" : "Analyzed"}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm leading-relaxed">{analysis.summary}</p>

      {/* Key Stats */}
      {(analysis.financialTerms?.royaltyRate || analysis.termLength) && (
        <div className="grid grid-cols-2 gap-2">
          {analysis.financialTerms?.royaltyRate && (
            <div className="bg-background rounded-xl p-3 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Royalty</p>
              <p className="text-sm font-semibold">{analysis.financialTerms.royaltyRate}</p>
            </div>
          )}
          {analysis.termLength && (
            <div className="bg-background rounded-xl p-3 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Term</p>
              <p className="text-sm font-semibold">{analysis.termLength}</p>
            </div>
          )}
        </div>
      )}

      {/* Concerns */}
      {analysis.potentialConcerns && analysis.potentialConcerns.length > 0 && (
        <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
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
        <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
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
  const scrollMarginTop = useMotionValue(0);

  // Deep Mind state
  const [isDeepMindMode, setIsDeepMindMode] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Current contract analysis context
  const [currentAnalysis, setCurrentAnalysis] = useState<ContractAnalysis | null>(null);

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

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          analysis: currentAnalysis,
          history,
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
    const currentMessageCount = chatMessages.length;
    const calculatedScrollMargin =
      currentMessageCount > 0
        ? window.innerHeight -
          (messageElementsRef.current[currentMessageCount - 1]?.clientHeight ||
            0) -
          (inputContainerRef.current?.clientHeight || 0) -
          20
        : 0;

    scrollMarginTop.set(calculatedScrollMargin);

    // Smooth scroll to the latest message
    requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  }, [chatMessages, messageIndex, scrollMarginTop]);

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
        <motion.div className="no-scroll flex h-full max-w-3xl flex-1 flex-col overflow-scroll scroll-smooth px-3 py-6">
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
                "my-2 w-fit break-words rounded-2xl px-4 py-3",
                message.isFromUser
                  ? "self-end bg-purple-500 text-white max-w-xs"
                  : "self-start bg-muted max-w-md",
                message.type === "analysis" && "max-w-xl"
              )}
            >
              {message.type === "analysis" && message.analysis ? (
                <AnalysisResult analysis={message.analysis} fileName={message.fileName || "Contract"} />
              ) : message.type === "file" ? (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{message.fileName}</span>
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
          <motion.div
            ref={messageEndRef}
            style={{ marginTop: scrollMarginTop }}
          />
        </motion.div>

        {/* Input Container */}
        <div
          ref={inputContainerRef}
          className="rounded-t-4xl fixed bottom-2 w-full max-w-3xl gap-1 px-3 pb-3"
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
              {/* Text Input Area */}
              <div className="relative">
                <textarea
                  value={userInput}
                  autoFocus
                  placeholder=""
                  className="field-sizing-content pr-15 max-h-52 w-full resize-none rounded-none !bg-transparent p-4 !text-base leading-[1.2] shadow-none focus-visible:outline-0 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleMessageSubmit();
                    }
                  }}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                  }}
                />
                {!userInput && (
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-full p-4">
                    <AnimatedPlaceholder isDeepMindMode={isDeepMindMode} />
                  </div>
                )}
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground hover:bg-background/50 hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-100 active:scale-95"
              >
                <Upload className="size-4" />
                <span className="text-xs font-medium">Upload Contract</span>
              </button>
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
