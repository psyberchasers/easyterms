"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Send,
  Loader2,
  Trash2,
  UserCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  clause_reference: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface ContractCommentsProps {
  contractId: string;
  isOwner?: boolean;
  canComment?: boolean;
  className?: string;
}

export function ContractComments({
  contractId,
  isOwner = false,
  canComment = true,
  className,
}: ContractCommentsProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState("");
  const initialLoadRef = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`);
      const data = await response.json();
      if (response.ok && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  // Initial fetch and subscribe to changes
  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contract_comments",
          filter: `contract_id=eq.${contractId}`,
        },
        () => {
          // Refetch to get the full comment with user data
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contractId, supabase, fetchComments]);

  // Scroll to bottom when new comments arrive (not on initial load)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (commentsEndRef.current && comments.length > 0) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length]);

  // Send comment
  const handleSend = async () => {
    if (!newComment.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send comment");
      }

      setNewComment("");
      // Refetch comments to show the new one immediately
      fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send comment");
    } finally {
      setSending(false);
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/contracts/${contractId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Discussion</span>
        <span className="text-xs text-muted-foreground">
          ({comments.length})
        </span>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
            {canComment && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Start the conversation
              </p>
            )}
          </div>
        ) : (
          comments.map((comment) => {
            const isOwnComment = comment.user_id === user?.id;
            const userName = comment.user?.full_name || comment.user?.email || "Unknown";
            const initials = getInitials(comment.user?.full_name ?? null, comment.user?.email ?? null);

            return (
              <div
                key={comment.id}
                className={cn(
                  "flex gap-3 group",
                  isOwnComment && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                    isOwnComment
                      ? "bg-purple-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {comment.user?.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Comment Content */}
                <div
                  className={cn(
                    "flex-1 max-w-[80%]",
                    isOwnComment && "text-right"
                  )}
                >
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-2",
                      isOwnComment
                        ? "bg-purple-500 text-white rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2 mt-1",
                      isOwnComment ? "justify-end" : "justify-start"
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {userName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {(isOwnComment || isOwner) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Area */}
      {canComment ? (
        <div className="shrink-0 border-t border-border">
          <div className="p-4 pt-6">
            {error && (
              <p className="text-xs text-red-500 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-3 py-2 text-sm bg-muted border-0 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 placeholder:text-muted-foreground/60"
                style={{ minHeight: "40px", maxHeight: "120px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "40px";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={handleSend}
                disabled={!newComment.trim() || sending}
                className="w-10 h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        <div className="shrink-0 p-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            You don't have permission to comment
          </p>
        </div>
      )}
    </div>
  );
}
