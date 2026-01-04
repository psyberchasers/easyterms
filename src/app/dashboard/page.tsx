"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Contract } from "@/types/database";
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
  Search,
  RefreshCw,
  Calendar,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RepeatOffIcon, FolderBlockIcon, AiSheetsIcon, Alert02Icon } from "@hugeicons-pro/core-solid-rounded";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ContractQuickView } from "@/components/ContractQuickView";

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "starred" | "high-risk">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [contractVersions, setContractVersions] = useState<Record<string, number[]>>({});
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; contract: Contract | null }>({
    open: false,
    contract: null,
  });
  const [quickView, setQuickView] = useState<{ open: boolean; contract: Contract | null }>({
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

        if (data && data.length > 0) {
          const contractIds = data.map((c: Contract) => c.id);
          const { data: versions } = await supabase
            .from("contract_versions")
            .select("contract_id, version_number")
            .in("contract_id", contractIds)
            .order("version_number", { ascending: true });

          if (versions) {
            const versionMap: Record<string, number[]> = {};
            versions.forEach((v: { contract_id: string; version_number: number }) => {
              if (!versionMap[v.contract_id]) {
                versionMap[v.contract_id] = [];
              }
              versionMap[v.contract_id].push(v.version_number + 1);
            });
            setContractVersions(versionMap);
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
    setContractVersions((prev) => {
      const newVersions = { ...prev };
      delete newVersions[deleteModal.contract!.id];
      return newVersions;
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

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <MusicLoader />
      </div>
    );
  }

  return (
    <div>
      {/* Top Section with White Background */}
      <div className="bg-white px-6 pt-6 pb-4">
        {/* Welcome & Stats */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-normal mb-1 flex items-center gap-2">
              Welcome back <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-xl font-medium">{profile?.full_name?.split(" ")[0] || "there"}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and analyze your music contracts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/compare">
              <Button variant="outline" size="sm" className="rounded-lg">
                <HugeiconsIcon icon={RepeatOffIcon} size={16} className="mr-2" />
                Compare
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => fetchContracts(false)} disabled={loading}>
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
                <HugeiconsIcon icon={Alert02Icon} size={20} className="text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-red-400">Failed to load contracts</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => fetchContracts(false)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats Row */}
        <div className="flex flex-wrap items-center gap-6 py-4">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground ml-1">contracts</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-light text-green-500">{stats.active}</span>
            <span className="text-xs text-muted-foreground ml-1">active</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-lg font-light text-foreground">{stats.starred}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Link href="/analyze">
              <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-transparent hover:bg-muted rounded-lg">
                <HugeiconsIcon icon={AiSheetsIcon} size={12} className="mr-1" />
                New
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground rounded-lg">
                <Calendar className="w-3 h-3 mr-1" />
                Calendar
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-3 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              style={{ borderRadius: '8px', backgroundColor: filter === "all" ? '#FFEF00' : undefined }}
              className="h-8 px-4 text-sm border"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{ borderRadius: '8px', backgroundColor: filter === "starred" ? '#FFEF00' : undefined }}
              className="h-8 px-4 text-sm border"
              onClick={() => setFilter("starred")}
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Starred
            </Button>
            <Button
              variant="outline"
              size="sm"
              style={{ borderRadius: '8px', backgroundColor: filter === "high-risk" ? '#FFEF00' : undefined }}
              className="h-8 px-4 text-sm border"
              onClick={() => setFilter("high-risk")}
            >
              <HugeiconsIcon icon={Alert02Icon} size={14} className="mr-1.5" />
              High Risk
            </Button>

            {/* View Toggle */}
            <div className="flex border border-border overflow-hidden h-8" style={{ borderRadius: '8px' }}>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "w-8 h-full flex items-center justify-center transition-colors",
                  viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "w-8 h-full flex items-center justify-center border-l border-border transition-colors",
                  viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search - Right Side */}
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 z-10" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-rounded="true"
              className="w-full h-9 pl-11 pr-4 text-sm bg-white border border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content with dotted background */}
      <div className="p-6">
        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
        <div className="border-2 border-dashed border-border bg-muted/10">
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto border border-border flex items-center justify-center mb-6 bg-muted/30">
              <HugeiconsIcon icon={FolderBlockIcon} className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {contracts.length === 0 ? "No contracts yet" : "No matching contracts"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {contracts.length === 0
                ? "Upload your first contract to get started"
                : "Try adjusting your search or filters"}
            </p>
            {contracts.length === 0 && (
              <Link href="/analyze">
                <Button className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <HugeiconsIcon icon={AiSheetsIcon} size={16} className="mr-2" />
                  New Analysis
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid/Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => {
            const statusLabel = contract.status === "active"
              ? "Active"
              : contract.status === "negotiating"
                ? "Negotiating"
                : "Draft";

            return (
              <div
                key={contract.id}
                className={cn(
                  "bg-background border rounded-xl overflow-hidden hover:shadow-sm transition-all group cursor-pointer",
                  contract.overall_risk === "high" ? "border-red-300" :
                  contract.overall_risk === "medium" ? "border-amber-300" :
                  "border-green-300"
                )}
                onClick={() => setQuickView({ open: true, contract })}
              >
                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center shrink-0",
                      contract.overall_risk === "high" ? "bg-red-500/10" :
                      contract.overall_risk === "medium" ? "bg-amber-500/10" :
                      "bg-primary/10"
                    )}>
                      <FileText className={cn(
                        "w-5 h-5",
                        contract.overall_risk === "high" ? "text-red-500" :
                        contract.overall_risk === "medium" ? "text-amber-500" :
                        "text-primary"
                      )} />
                    </div>

                    {/* Title & Status */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{contract.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {contract.contract_type || "Contract"}
                      </p>
                    </div>

                    {/* Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(contract.id, contract.is_starred);
                      }}
                      className="shrink-0 p-1 hover:bg-muted rounded transition-colors"
                    >
                      {contract.is_starred ? (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <Star className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {(contract.analysis as { summary?: string })?.summary || "Contract uploaded for analysis"}
                  </p>
                </div>

                {/* Tags */}
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-lg",
                    contract.status === "active" ? "bg-green-500/10 text-green-600" :
                    contract.status === "negotiating" ? "bg-amber-500/10 text-amber-600" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {statusLabel}
                  </span>
                  {contract.overall_risk && (
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-lg",
                      contract.overall_risk === "high" ? "bg-red-500/10 text-red-600" :
                      contract.overall_risk === "medium" ? "bg-amber-500/10 text-amber-600" :
                      "bg-green-500/10 text-green-600"
                    )}>
                      {contract.overall_risk === "high" ? "High Risk" : contract.overall_risk === "medium" ? "Medium" : "Low Risk"}
                    </span>
                  )}
                  {contractVersions[contract.id]?.length > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                      {contractVersions[contract.id].length + 1} versions
                    </span>
                  )}
                </div>

                {/* Action Footer */}
                <Link
                  href={`/contract/${contract.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-sm text-muted-foreground">View contract</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View - Table Style */
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white border-b border-border text-xs font-medium text-muted-foreground">
            <div className="col-span-3">Contract</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-1 text-center">Starred</div>
            <div className="col-span-1"></div>
          </div>

          {/* Group contracts by date */}
          {(() => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);

            const groups: { label: string; contracts: Contract[] }[] = [];
            const todayContracts: Contract[] = [];
            const yesterdayContracts: Contract[] = [];
            const lastWeekContracts: Contract[] = [];
            const olderContracts: Contract[] = [];

            filteredContracts.forEach((contract) => {
              const date = new Date(contract.created_at);
              if (date.toDateString() === today.toDateString()) {
                todayContracts.push(contract);
              } else if (date.toDateString() === yesterday.toDateString()) {
                yesterdayContracts.push(contract);
              } else if (date > lastWeek) {
                lastWeekContracts.push(contract);
              } else {
                olderContracts.push(contract);
              }
            });

            if (todayContracts.length > 0) groups.push({ label: "Today", contracts: todayContracts });
            if (yesterdayContracts.length > 0) groups.push({ label: "Yesterday", contracts: yesterdayContracts });
            if (lastWeekContracts.length > 0) groups.push({ label: "Last Week", contracts: lastWeekContracts });
            if (olderContracts.length > 0) groups.push({ label: "Older", contracts: olderContracts });

            return groups.map((group, groupIndex) => (
              <div key={group.label}>
                {/* Group Label */}
                <div className="px-4 py-2 bg-neutral-50 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</span>
                </div>

                {/* Contracts in group */}
                {group.contracts.map((contract, i) => {
                  return (
                    <div
                      key={contract.id}
                      className={cn(
                        "grid grid-cols-12 gap-4 px-4 py-4 items-center bg-white hover:bg-neutral-50 transition-colors cursor-pointer",
                        i < group.contracts.length - 1 && "border-b border-border/50"
                      )}
                      onClick={() => setQuickView({ open: true, contract })}
                    >
                      {/* Contract Name */}
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-foreground truncate">{contract.title}</p>
                      </div>

                      {/* Type */}
                      <div className="col-span-3">
                        <span className="text-sm text-muted-foreground">
                          {contract.contract_type || "Contract"}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(contract.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {/* Risk */}
                      <div className="col-span-2">
                        {contract.overall_risk && (
                          <span className={cn(
                            "text-xs font-semibold px-2 py-1 rounded",
                            contract.overall_risk === "high" ? "bg-red-100 text-red-600" :
                            contract.overall_risk === "medium" ? "bg-amber-100 text-amber-600" :
                            "bg-green-100 text-green-600"
                          )}>
                            {contract.overall_risk === "high" ? "High" : contract.overall_risk === "medium" ? "Medium" : "Low"}
                          </span>
                        )}
                      </div>

                      {/* Starred */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(contract.id, contract.is_starred);
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          {contract.is_starred ? (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          ) : (
                            <Star className="w-4 h-4 text-muted-foreground/40" />
                          )}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
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
                                e.stopPropagation();
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
                  );
                })}
              </div>
            ));
          })()}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, contract: open ? deleteModal.contract : null })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.contract?.title || ""}
        versionCount={deleteModal.contract ? contractVersions[deleteModal.contract.id]?.length || 0 : 0}
      />

      {/* Contract Quick View Drawer */}
      <ContractQuickView
        contract={quickView.contract}
        open={quickView.open}
        onOpenChange={(open) => setQuickView({ open, contract: open ? quickView.contract : null })}
        onToggleStar={toggleStar}
        versionCount={quickView.contract ? contractVersions[quickView.contract.id]?.length || 0 : 0}
      />
    </div>
  </div>
  );
}
