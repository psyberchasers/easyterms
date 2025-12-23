"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Contract } from "@/types/database";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Star,
  StarOff,
  MoreVertical,
  Trash2,
  Eye,
  Search,
  AlertTriangle,
  RefreshCw,
  Plus,
  Calendar,
  History,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RepeatOffIcon, FolderBlockIcon, AiSheetsIcon } from "@hugeicons-pro/core-solid-rounded";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "starred" | "high-risk">("all");
  const [versionCounts, setVersionCounts] = useState<Record<string, number>>({});
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; contract: Contract | null }>({
    open: false,
    contract: null,
  });
  const router = useRouter();
  const supabase = createClient();

  const fetchContracts = useCallback(async (isInitial = false) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "Request timed out. Please try again." } }), 8000)
      );

      const queryPromise = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error: fetchError } = await Promise.race([queryPromise, timeoutPromise]);

      if (fetchError) {
        console.error("Error fetching contracts:", fetchError);
        setError(fetchError.message);
      } else {
        setContracts(data as Contract[] || []);

        // Fetch version counts for all contracts
        if (data && data.length > 0) {
          const contractIds = data.map((c: Contract) => c.id);
          const { data: versions } = await supabase
            .from("contract_versions")
            .select("contract_id")
            .in("contract_id", contractIds);

          if (versions) {
            const counts: Record<string, number> = {};
            versions.forEach((v: { contract_id: string }) => {
              counts[v.contract_id] = (counts[v.contract_id] || 0) + 1;
            });
            setVersionCounts(counts);
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
      if (isInitial) setInitialLoad(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && !authLoading && initialLoad) {
      fetchContracts(true);
    }
  }, [user, authLoading, router, fetchContracts, initialLoad]);

  const toggleStar = async (contractId: string, currentStarred: boolean) => {
    await supabase
      .from("contracts")
      .update({ is_starred: !currentStarred })
      .eq("id", contractId);

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId ? { ...c, is_starred: !currentStarred } : c
      )
    );
  };

  const openDeleteModal = (contract: Contract) => {
    setDeleteModal({ open: true, contract });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.contract) return;

    await supabase.from("contracts").delete().eq("id", deleteModal.contract.id);
    setContracts((prev) => prev.filter((c) => c.id !== deleteModal.contract?.id));
    setVersionCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[deleteModal.contract!.id];
      return newCounts;
    });
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contract_type?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "starred") return matchesSearch && contract.is_starred;
    if (filter === "high-risk") return matchesSearch && contract.overall_risk === "high";
    return matchesSearch;
  });

  const stats = {
    total: contracts.length,
    highRisk: contracts.filter((c) => c.overall_risk === "high").length,
    mediumRisk: contracts.filter((c) => c.overall_risk === "medium").length,
    lowRisk: contracts.filter((c) => c.overall_risk === "low").length,
    active: contracts.filter((c) => c.status === "active").length,
    negotiating: contracts.filter((c) => c.status === "negotiating").length,
    starred: contracts.filter((c) => c.is_starred).length,
  };

  // Calculate risk distribution for chart
  const riskTotal = stats.highRisk + stats.mediumRisk + stats.lowRisk;
  const riskPercentages = {
    high: riskTotal > 0 ? Math.round((stats.highRisk / riskTotal) * 100) : 0,
    medium: riskTotal > 0 ? Math.round((stats.mediumRisk / riskTotal) * 100) : 0,
    low: riskTotal > 0 ? Math.round((stats.lowRisk / riskTotal) * 100) : 0,
  };

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium Risk</Badge>;
      case "low":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low Risk</Badge>;
      default:
        return null;
    }
  };

  // Only show full-page loader during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  // Show loader during initial data fetch (but not subsequent refreshes)
  if (initialLoad && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <MusicLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Welcome & Stats */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-normal mb-2">
              Welcome back, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "there"}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage and analyze your music contracts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/compare">
              <Button variant="outline" size="sm" className="rounded-none">
                <HugeiconsIcon icon={RepeatOffIcon} size={16} className="mr-2" />
                Compare
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="rounded-none" onClick={() => fetchContracts(false)} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-red-400">Failed to load contracts</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-none" onClick={() => fetchContracts(false)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats Row */}
        <div className="flex flex-wrap items-center gap-6 mb-8 py-4">
          {/* Stats */}
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-white">{stats.total}</span>
            <span className="text-xs text-[#525252] ml-1">contracts</span>
          </div>
          <div className="w-px h-6 bg-[#262626]" />
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-green-500">{stats.active}</span>
            <span className="text-xs text-[#525252] ml-1">active</span>
          </div>
          <div className="w-px h-6 bg-[#262626]" />
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-amber-500">{stats.negotiating}</span>
            <span className="text-xs text-[#525252] ml-1">negotiating</span>
          </div>
          <div className="w-px h-6 bg-[#262626]" />
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#525252]" />
            <span className="text-lg font-light text-white">{stats.starred}</span>
          </div>
          
          {/* Risk Bar - inline */}
          {riskTotal > 0 && (
            <>
              <div className="w-px h-6 bg-[#262626]" />
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#525252]">Risk</span>
                <div className="h-1.5 w-32 overflow-hidden flex bg-[#1a1a1a]">
                  <div className="bg-red-500" style={{ width: `${riskPercentages.high}%` }} />
                  <div className="bg-amber-500" style={{ width: `${riskPercentages.medium}%` }} />
                  <div className="bg-green-500" style={{ width: `${riskPercentages.low}%` }} />
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500" />
                    <span className="text-[#525252]">{stats.highRisk}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500" />
                    <span className="text-[#525252]">{stats.mediumRisk}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500" />
                    <span className="text-[#525252]">{stats.lowRisk}</span>
                  </span>
                </div>
              </div>
            </>
          )}
          
          {/* Spacer to push actions right */}
          <div className="flex-1" />
          
          {/* Quick Actions - inline */}
          <div className="flex items-center gap-2">
            <Link href="/analyze">
              <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-transparent hover:bg-[#1a1a1a] rounded-none">
                <HugeiconsIcon icon={AiSheetsIcon} size={12} className="mr-1" />
                New
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[#525252] hover:text-white rounded-none">
                <Calendar className="w-3 h-3 mr-1" />
                Calendar
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-none"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "starred" ? "default" : "outline"}
              size="sm"
              className="rounded-none"
              onClick={() => setFilter("starred")}
            >
              <Star className="w-4 h-4 mr-1" />
              Starred
            </Button>
            <Button
              variant={filter === "high-risk" ? "default" : "outline"}
              size="sm"
              className="rounded-none"
              onClick={() => setFilter("high-risk")}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              High Risk
            </Button>
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="border-2 border-dashed border-border bg-[#0a0a0a]">
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto border border-border flex items-center justify-center mb-6 bg-[#1a1a1a]">
                <HugeiconsIcon icon={FolderBlockIcon} className="w-8 h-8 text-[#525252]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {contracts.length === 0 ? "No contracts yet" : "No matching contracts"}
              </h3>
              <p className="text-[#525252] mb-6">
                {contracts.length === 0
                  ? "Upload your first contract to get started"
                  : "Try adjusting your search or filters"}
              </p>
              {contracts.length === 0 && (
                <Link href="/analyze">
                  <Button className="rounded-none bg-primary text-black hover:bg-primary/90">
                    <HugeiconsIcon icon={AiSheetsIcon} size={16} className="mr-2" />
                    New Analysis
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map((contract) => {
              const statusColor = contract.status === "active"
                ? "text-green-400"
                : contract.status === "negotiating"
                  ? "text-amber-400"
                  : "text-[#525252]";
              const statusLabel = contract.status === "active"
                ? "Active"
                : contract.status === "negotiating"
                  ? "Negotiating"
                  : "Draft";

              return (
                <Link
                  href={`/contract/${contract.id}`}
                  key={contract.id}
                  className="block border border-border hover:border-[#404040] bg-[#0a0a0a] hover:bg-[#111] transition-all"
                >
                  <div className="p-4 flex items-start gap-4">
                    {/* Left: Icon with status indicator */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 border border-border flex items-center justify-center bg-[#1a1a1a]">
                        <FileText className="w-5 h-5 text-[#525252]" />
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                        contract.overall_risk === "high" ? "bg-red-500/20" :
                        contract.overall_risk === "medium" ? "bg-amber-500/20" :
                        "bg-green-500/20"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          contract.overall_risk === "high" ? "bg-red-400" :
                          contract.overall_risk === "medium" ? "bg-amber-400" :
                          "bg-green-400"
                        )} />
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{contract.title}</h3>
                        {versionCounts[contract.id] > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-[#878787] px-1.5 py-0.5 border border-border bg-[#1a1a1a]">
                            <History className="w-2.5 h-2.5" />
                            v{versionCounts[contract.id] + 1}
                          </span>
                        )}
                        {contract.is_starred && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-[#878787] line-clamp-1 mb-3">
                        {(contract.analysis as { summary?: string })?.summary || "Contract uploaded for analysis"}
                      </p>

                      {/* Tags row */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 border border-border text-[#878787]">
                          {new Date(contract.created_at).getFullYear()}
                        </span>
                        {contract.contract_type && (
                          <span className="text-xs px-2 py-0.5 border border-border text-[#878787]">
                            {contract.contract_type}
                          </span>
                        )}
                        {contract.overall_risk && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 border",
                            contract.overall_risk === "high"
                              ? "border-red-500/30 text-red-400 bg-red-500/10"
                              : contract.overall_risk === "medium"
                                ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                : "border-green-500/30 text-green-400 bg-green-500/10"
                          )}>
                            {contract.overall_risk === "high" ? "High Risk" : contract.overall_risk === "medium" ? "Medium Risk" : "Low Risk"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right section: Status & Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Status badge */}
                      <div className={cn("flex items-center gap-1.5 text-sm", statusColor)}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          contract.status === "active" ? "bg-green-400" :
                          contract.status === "negotiating" ? "bg-amber-400" :
                          "bg-[#525252]"
                        )} />
                        {statusLabel}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                            <MoreVertical className="w-4 h-4 text-[#525252]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              toggleStar(contract.id, contract.is_starred);
                            }}
                          >
                            {contract.is_starred ? (
                              <>
                                <StarOff className="w-4 h-4 mr-2" />
                                Unstar
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4 mr-2" />
                                Star
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/compare?contracts=${contract.id}`} onClick={(e) => e.stopPropagation()}>
                              <HugeiconsIcon icon={RepeatOffIcon} size={16} className="mr-2" />
                              Compare
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              openDeleteModal(contract);
                            }}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, contract: open ? deleteModal.contract : null })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.contract?.title || ""}
        versionCount={deleteModal.contract ? versionCounts[deleteModal.contract.id] || 0 : 0}
      />
    </div>
  );
}


