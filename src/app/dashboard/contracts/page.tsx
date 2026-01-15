"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Contract } from "@/types/database";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, StarOff, Trash2, Plus, Check, Share2, User } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContractsIcon, PlusSignIcon, PlayIcon, FilterIcon, ViewIcon } from "@hugeicons-pro/core-stroke-rounded";
import { FolderShared02Icon } from "@hugeicons-pro/core-bulk-rounded";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ContractQuickView } from "@/components/ContractQuickView";

// Shared contract type
interface SharedContract {
  id: string;
  contract_id: string;
  permission: "view" | "comment" | "sign";
  status: "pending" | "viewed" | "signed" | "declined";
  message: string | null;
  created_at: string;
  contract: Contract | null;
  owner: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function ContractsPage() {
  const { user, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sharedContracts, setSharedContracts] = useState<SharedContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my");
  const [filter, setFilter] = useState<"all" | "high-risk" | "medium-risk" | "low-risk">("all");
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [contractShares, setContractShares] = useState<Record<string, number>>({});
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

    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contracts:", error);
      } else {
        setContracts(data as Contract[] || []);

        // Fetch shares count for each contract
        if (data && data.length > 0) {
          const contractIds = data.map((c: Contract) => c.id);
          const { data: shares } = await supabase
            .from("contract_shares")
            .select("contract_id")
            .in("contract_id", contractIds);

          if (shares) {
            const shareMap: Record<string, number> = {};
            shares.forEach((s: { contract_id: string }) => {
              shareMap[s.contract_id] = (shareMap[s.contract_id] || 0) + 1;
            });
            setContractShares(shareMap);
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
      if (isInitial) setInitialLoad(false);
    }
  }, [user, supabase]);

  // Fetch shared contracts
  const fetchSharedContracts = useCallback(async () => {
    if (!user) return;

    try {
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
          contract:contracts (*)
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

        // Transform data
        const transformed = data.map((s: any) => ({
          ...s,
          contract: Array.isArray(s.contract) ? s.contract[0] : s.contract,
          owner: ownerProfiles[s.owner_id] || null,
        }));
        setSharedContracts(transformed);
      }
    } catch (err) {
      console.error("Error fetching shared contracts:", err);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && !authLoading && initialLoad) {
      fetchContracts(true);
      fetchSharedContracts();
    }
  }, [user, authLoading, router, fetchContracts, fetchSharedContracts, initialLoad]);

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

  const handleDeleteConfirm = async () => {
    if (!deleteModal.contract) return;

    await supabase.from("contracts").delete().eq("id", deleteModal.contract.id);
    setContracts((prev) => prev.filter((c) => c.id !== deleteModal.contract?.id));
  };

  // Get contracts based on active tab
  const activeContracts = activeTab === "my" ? contracts : sharedContracts.map(s => s.contract).filter(Boolean) as Contract[];

  const filteredContracts = activeContracts.filter((contract) => {
    if (filter === "high-risk") return contract.overall_risk === "high";
    if (filter === "medium-risk") return contract.overall_risk === "medium";
    if (filter === "low-risk") return contract.overall_risk === "low";
    return true;
  });

  // Get shared info for a contract (when viewing shared tab)
  const getSharedInfo = (contractId: string) => {
    return sharedContracts.find(s => s.contract_id === contractId);
  };

  // Get initials from name
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  const getPartyName = (contract: Contract) => {
    const analysis = contract.analysis as { parties?: Record<string, string | string[]> } | null;
    if (!analysis?.parties) return "—";
    const parties = analysis.parties;
    return parties.label || parties.artist || parties.company || parties.client || "—";
  };

  const getCategory = (contract: Contract) => {
    const analysis = contract.analysis as { industry?: string; category?: string } | null;
    return analysis?.industry || analysis?.category || "—";
  };

  const toggleSelectContract = (contractId: string) => {
    setSelectedContracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedContracts.size === filteredContracts.length) {
      setSelectedContracts(new Set());
    } else {
      setSelectedContracts(new Set(filteredContracts.map((c) => c.id)));
    }
  };

  const isAllSelected = filteredContracts.length > 0 && selectedContracts.size === filteredContracts.length;
  const isSomeSelected = selectedContracts.size > 0 && selectedContracts.size < filteredContracts.length;

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <MusicLoader />
      </div>
    );
  }

  // Empty state
  if (contracts.length === 0 && !loading) {
    return (
      <div className="h-full flex bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mb-6">
            <HugeiconsIcon icon={ContractsIcon} size={24} className="text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Oops! There's no contract here...
          </h1>

          <p className="text-center max-w-md mb-8 text-muted-foreground">
            Looks like there's nothing to see here! Go ahead and add some new data to kick things off.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/analyze">
              <Button className="rounded-full px-5 bg-foreground text-background hover:bg-foreground/90">
                <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
                Add Contract
              </Button>
            </Link>

            <Button
              variant="outline"
              className="rounded-full px-5 border-border text-muted-foreground"
            >
              <HugeiconsIcon icon={PlayIcon} size={16} className="mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full bg-background">
      {/* Tab Switcher */}
      <motion.div
        className="flex items-center gap-1 px-4 pt-3 pb-0 w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => { setActiveTab("my"); setFilter("all"); }}
          className={cn(
            "px-4 py-2 rounded-t-lg text-[13px] font-medium transition-colors border-b-2",
            activeTab === "my"
              ? "bg-muted/50 text-foreground border-purple-500"
              : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/30"
          )}
        >
          My Contracts
          <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
            {contracts.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab("shared"); setFilter("all"); }}
          className={cn(
            "px-4 py-2 rounded-t-lg text-[13px] font-medium transition-colors border-b-2 flex items-center gap-2",
            activeTab === "shared"
              ? "bg-muted/50 text-foreground border-purple-500"
              : "text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/30"
          )}
        >
          <HugeiconsIcon icon={FolderShared02Icon} size={14} />
          Shared with Me
          {sharedContracts.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400">
              {sharedContracts.length}
            </span>
          )}
        </button>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        className="flex items-center justify-between px-4 py-3 border-b border-border w-full"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="flex items-center gap-3">
          {/* Filter buttons */}
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors text-muted-foreground",
              filter === "all" ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            All ({activeContracts.length})
          </button>
          <button
            onClick={() => setFilter("high-risk")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors text-muted-foreground",
              filter === "high-risk" ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            High Risk
          </button>
          <button
            onClick={() => setFilter("medium-risk")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors text-muted-foreground",
              filter === "medium-risk" ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            Medium Risk
          </button>
          <button
            onClick={() => setFilter("low-risk")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors text-muted-foreground",
              filter === "low-risk" ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            Low Risk
          </button>
          <span className="text-[12px] font-medium ml-2 text-muted-foreground/60">{filteredContracts.length} Results</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search contracts"
            data-rounded="true"
            className="px-4 py-1.5 text-[12px] border border-border rounded-lg w-52 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </div>
      </motion.div>

      {/* Table */}
      <div className="flex-1 overflow-auto w-full">
        {/* Table Header */}
        <motion.div
          className="grid px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b border-border sticky top-0 w-full bg-muted/50 text-muted-foreground/50"
          style={{
            gridTemplateColumns: '40px 1fr 200px 120px 150px 120px 100px 50px 50px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-center">
            <button
              onClick={toggleSelectAll}
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                isAllSelected
                  ? "bg-purple-500 border-purple-500"
                  : isSomeSelected
                  ? "bg-purple-500/50 border-purple-500"
                  : "border-muted-foreground/30 hover:border-muted-foreground/50"
              )}
            >
              {(isAllSelected || isSomeSelected) && (
                <Check className="w-3 h-3 text-white" />
              )}
            </button>
          </div>
          <div>Contract</div>
          <div>Type</div>
          <div>Category</div>
          <div>Party</div>
          <div>Uploaded</div>
          <div>Risk</div>
          <div className="text-center">
            <Star className="w-3 h-3 inline" />
          </div>
          <div></div>
        </motion.div>

        {/* Table Body */}
        <div>
          {filteredContracts.map((contract, index) => {
            const isSelected = selectedContracts.has(contract.id);
            return (
            <motion.div
              key={contract.id}
              className={cn(
                "grid px-4 py-3 items-center border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group",
                isSelected && "bg-purple-500/5"
              )}
              style={{ gridTemplateColumns: '40px 1fr 200px 120px 150px 120px 100px 50px 50px' }}
              onClick={() => router.push(activeTab === "shared" ? `/dashboard/shared/${contract.id}` : `/dashboard/contracts/${contract.id}`)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleSelectContract(contract.id)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-purple-500 border-purple-500"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              </div>

              {/* Contract Name */}
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate text-foreground">
                      {contract.title}
                    </span>
                    {activeTab === "my" && contractShares[contract.id] && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 flex items-center gap-1 shrink-0">
                        <Share2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  {activeTab === "shared" && (() => {
                    const sharedInfo = getSharedInfo(contract.id);
                    if (!sharedInfo?.owner) return null;
                    const ownerName = sharedInfo.owner.full_name || sharedInfo.owner.email;
                    return (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Shared by {ownerName}
                      </p>
                    );
                  })()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickView({ open: true, contract });
                  }}
                  className="shrink-0 p-1.5 rounded-md border border-transparent hover:border-border hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                  title="Quick View"
                >
                  <HugeiconsIcon icon={ViewIcon} size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Type */}
              <div>
                <span className="text-[13px] text-muted-foreground">
                  {contract.contract_type || "—"}
                </span>
              </div>

              {/* Category */}
              <div>
                <span className="text-[13px] text-muted-foreground capitalize">
                  {getCategory(contract)}
                </span>
              </div>

              {/* Party */}
              <div>
                <span className="text-[13px] text-muted-foreground">
                  {getPartyName(contract)}
                </span>
              </div>

              {/* Uploaded Date */}
              <div>
                <span className="text-[13px] text-muted-foreground/70">
                  {new Date(contract.created_at).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                </span>
              </div>

              {/* Risk */}
              <div>
                {contract.overall_risk && (
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                    style={{
                      backgroundColor: contract.overall_risk === 'high' ? 'rgba(239, 68, 68, 0.1)' :
                                       contract.overall_risk === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: contract.overall_risk === 'high' ? '#dc2626' :
                             contract.overall_risk === 'medium' ? '#d97706' : '#16a34a'
                    }}
                  >
                    {contract.overall_risk === "high" ? "High" :
                     contract.overall_risk === "medium" ? "Medium" : "Low"}
                  </span>
                )}
              </div>

              {/* Starred */}
              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleStar(contract.id, contract.is_starred)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  {contract.is_starred ? (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <Star className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-lg w-44">
                    <DropdownMenuItem asChild>
                      <Link href={`/contract/${contract.id}`}>
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStar(contract.id, contract.is_starred)}>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteModal({ open: true, contract })}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          );
          })}
        </div>

        {/* Empty filtered state */}
        {filteredContracts.length === 0 && activeContracts.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px]" style={{ color: '#565c65' }}>
              No contracts match this filter
            </p>
          </div>
        )}

        {/* Empty shared state */}
        {activeTab === "shared" && sharedContracts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
              <HugeiconsIcon icon={FolderShared02Icon} size={32} className="text-purple-400/50" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">No shared contracts yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              When someone shares a contract with you, it will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, contract: open ? deleteModal.contract : null })}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.contract?.title || ""}
        versionCount={0}
      />

      {/* Contract Quick View Drawer */}
      <ContractQuickView
        contract={quickView.contract}
        open={quickView.open}
        onOpenChange={(open) => setQuickView({ open, contract: open ? quickView.contract : null })}
        onToggleStar={toggleStar}
        versionCount={0}
      />
    </div>
  );
}
