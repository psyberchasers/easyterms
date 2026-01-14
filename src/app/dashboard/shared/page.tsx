"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
  Eye,
  MessageCircle,
  PenTool,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  User,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderShared02Icon, FileAttachmentIcon } from "@hugeicons-pro/core-stroke-rounded";
import { MusicLoader } from "@/components/MusicLoader";

interface SharedContract {
  id: string;
  contract_id: string;
  permission: "view" | "comment" | "sign";
  status: "pending" | "viewed" | "signed" | "declined";
  message: string | null;
  created_at: string;
  contract: {
    id: string;
    title: string;
    overall_risk: string | null;
    contract_type: string | null;
  } | null;
  owner: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function SharedPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [shares, setShares] = useState<SharedContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchShares = async () => {
      const { data, error } = await supabase
        .from("contract_shares")
        .select(`
          id,
          contract_id,
          permission,
          status,
          message,
          created_at,
          owner_id,
          contract:contracts (
            id,
            title,
            overall_risk,
            contract_type
          )
        `)
        .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Fetch owner profiles separately
        const ownerIds = [...new Set(data.map((s: any) => s.owner_id).filter(Boolean))];
        let ownerProfiles: Record<string, { full_name: string | null; email: string | null }> = {};

        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", ownerIds);

          if (profiles) {
            ownerProfiles = profiles.reduce((acc: any, p: any) => {
              acc[p.id] = { full_name: p.full_name, email: p.email };
              return acc;
            }, {});
          }
        }

        // Transform data to handle Supabase array format
        const transformed = data.map((s: any) => ({
          ...s,
          contract: Array.isArray(s.contract) ? s.contract[0] : s.contract,
          owner: ownerProfiles[s.owner_id] || null,
        }));
        setShares(transformed);
      }
      setLoading(false);
    };

    fetchShares();
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)]">
        <MusicLoader />
      </div>
    );
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  const getPermissionConfig = (permission: string) => {
    switch (permission) {
      case "view":
        return { icon: Eye, label: "View", color: "text-blue-400" };
      case "comment":
        return { icon: MessageCircle, label: "Comment", color: "text-purple-400" };
      case "sign":
        return { icon: PenTool, label: "Sign", color: "text-green-400" };
      default:
        return { icon: Eye, label: "View", color: "text-blue-400" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Sparkles,
          label: "New",
          bgColor: "bg-purple-500/10",
          textColor: "text-purple-400",
          dotColor: "bg-purple-500",
        };
      case "viewed":
        return {
          icon: Eye,
          label: "Viewed",
          bgColor: "bg-blue-500/10",
          textColor: "text-blue-400",
          dotColor: "bg-blue-500",
        };
      case "signed":
        return {
          icon: CheckCircle2,
          label: "Signed",
          bgColor: "bg-green-500/10",
          textColor: "text-green-400",
          dotColor: "bg-green-500",
        };
      default:
        return null;
    }
  };

  const getRiskConfig = (risk: string | null) => {
    switch (risk) {
      case "high":
        return { color: "bg-red-500", label: "High Risk" };
      case "medium":
        return { color: "bg-amber-500", label: "Medium Risk" };
      case "low":
        return { color: "bg-emerald-500", label: "Low Risk" };
      default:
        return { color: "bg-muted-foreground/30", label: "" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <HugeiconsIcon icon={FolderShared02Icon} size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Shared with me</h1>
            <p className="text-sm text-muted-foreground">
              {shares.length} contract{shares.length !== 1 ? "s" : ""} shared with you
            </p>
          </div>
        </div>
      </div>

      {shares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-6">
            <HugeiconsIcon icon={FolderShared02Icon} size={40} className="text-purple-400/50" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No shared contracts yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            When someone shares a contract with you for review or signature, it will appear here.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {shares.map((share, index) => {
            const permission = getPermissionConfig(share.permission);
            const status = getStatusConfig(share.status);
            const risk = getRiskConfig(share.contract?.overall_risk ?? null);
            const PermissionIcon = permission.icon;

            return (
              <Link
                key={share.id}
                href={`/dashboard/shared/${share.contract_id}`}
                className="group block"
              >
                <div className={cn(
                  "flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors",
                  index !== shares.length - 1 && "border-b border-border"
                )}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {getInitials(share.owner?.full_name ?? null, share.owner?.email ?? null) === "?" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      getInitials(share.owner?.full_name ?? null, share.owner?.email ?? null)
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {share.contract?.title || "Untitled Contract"}
                      </h3>
                      {share.contract?.overall_risk && (
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", risk.color)} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {share.owner?.full_name || share.owner?.email ? (
                        <>From {share.owner?.full_name || share.owner?.email}</>
                      ) : null}
                      {share.message && `${share.owner?.full_name || share.owner?.email ? " · " : ""}"${share.message}"`}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status badge */}
                    {status && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium",
                        status.bgColor,
                        status.textColor
                      )}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </div>
                    )}

                    {/* Permission */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PermissionIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Time */}
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {formatDate(share.created_at)}
                    </span>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
