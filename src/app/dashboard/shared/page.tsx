"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader2,
  Share2,
  Eye,
  MessageCircle,
  PenTool,
  Clock,
  CheckCircle2,
} from "lucide-react";
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
          contract:contracts (
            id,
            title,
            overall_risk,
            contract_type
          ),
          owner:profiles!owner_id (
            full_name,
            email
          )
        `)
        .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Transform data to handle Supabase array format
        const transformed = data.map((s: any) => ({
          ...s,
          contract: Array.isArray(s.contract) ? s.contract[0] : s.contract,
          owner: Array.isArray(s.owner) ? s.owner[0] : s.owner,
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

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "view":
        return <Eye className="w-3.5 h-3.5" />;
      case "comment":
        return <MessageCircle className="w-3.5 h-3.5" />;
      case "sign":
        return <PenTool className="w-3.5 h-3.5" />;
      default:
        return <Eye className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            New
          </span>
        );
      case "viewed":
        return (
          <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
            <Eye className="w-3 h-3" />
            Viewed
          </span>
        );
      case "signed":
        return (
          <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Signed
          </span>
        );
      default:
        return null;
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-muted-foreground/30";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Shared with me</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Contracts that others have shared with you
        </p>
      </div>

      {shares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Share2 className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-medium text-foreground mb-2">No shared contracts</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            When someone shares a contract with you, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {shares.map((share) => (
            <Link
              key={share.id}
              href={`/shared/${share.id}`}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors group"
            >
              {/* Risk indicator */}
              <div className={cn(
                "w-1.5 h-12 rounded-full shrink-0",
                getRiskColor(share.contract?.overall_risk ?? null)
              )} />

              {/* Contract info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {share.contract?.title || "Untitled Contract"}
                  </h3>
                  {getStatusBadge(share.status)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    From {share.owner?.full_name || share.owner?.email || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(share.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {share.message && (
                  <p className="text-xs text-muted-foreground/70 mt-1 truncate italic">
                    "{share.message}"
                  </p>
                )}
              </div>

              {/* Permission badge */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full shrink-0">
                {getPermissionIcon(share.permission)}
                <span className="capitalize">{share.permission}</span>
              </div>

              {/* Arrow */}
              <FileText className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
