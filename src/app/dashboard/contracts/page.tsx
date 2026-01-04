"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Contract } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Star, StarOff, Trash2, Plus } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ContractsIcon, PlusSignIcon, PlayIcon, FilterIcon } from "@hugeicons-pro/core-stroke-rounded";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ContractQuickView } from "@/components/ContractQuickView";

export default function ContractsPage() {
  const { user, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState<"all" | "high-risk" | "medium-risk" | "low-risk">("all");
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
      }
    } catch (err) {
      console.error("Error:", err);
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

  const handleDeleteConfirm = async () => {
    if (!deleteModal.contract) return;

    await supabase.from("contracts").delete().eq("id", deleteModal.contract.id);
    setContracts((prev) => prev.filter((c) => c.id !== deleteModal.contract?.id));
  };

  const filteredContracts = contracts.filter((contract) => {
    if (filter === "high-risk") return contract.overall_risk === "high";
    if (filter === "medium-risk") return contract.overall_risk === "medium";
    if (filter === "low-risk") return contract.overall_risk === "low";
    return true;
  });

  const getPartyName = (contract: Contract) => {
    const analysis = contract.analysis as { parties?: Record<string, string | string[]> } | null;
    if (!analysis?.parties) return "—";
    const parties = analysis.parties;
    return parties.label || parties.artist || parties.company || parties.client || "—";
  };

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
      <div className="h-full flex" style={{ backgroundColor: '#fcfcfc' }}>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center mb-6"
            style={{ borderColor: '#e5e6e7' }}
          >
            <HugeiconsIcon icon={ContractsIcon} size={24} style={{ color: '#565c65' }} />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Oops! There's no contract here...
          </h1>

          <p className="text-center max-w-md mb-8" style={{ color: '#565c65' }}>
            Looks like there's nothing to see here! Go ahead and add some new data to kick things off.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/analyze">
              <Button
                className="rounded-full px-5"
                style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
                Add Contract
              </Button>
            </Link>

            <Button
              variant="outline"
              className="rounded-full px-5"
              style={{ borderColor: '#e5e6e7', color: '#565c65' }}
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
    <div className="h-full flex flex-col w-full" style={{ backgroundColor: '#ffffff' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e6e7] w-full">
        <div className="flex items-center gap-3">
          {/* Filter buttons */}
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
              filter === "all" ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]"
            )}
            style={{ color: '#565c65' }}
          >
            All ({contracts.length})
          </button>
          <button
            onClick={() => setFilter("high-risk")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
              filter === "high-risk" ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]"
            )}
            style={{ color: '#565c65' }}
          >
            High Risk
          </button>
          <button
            onClick={() => setFilter("medium-risk")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
              filter === "medium-risk" ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]"
            )}
            style={{ color: '#565c65' }}
          >
            Medium Risk
          </button>
          <button
            onClick={() => setFilter("low-risk")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
              filter === "low-risk" ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]"
            )}
            style={{ color: '#565c65' }}
          >
            Low Risk
          </button>
          <span className="text-[12px] ml-2" style={{ color: '#909090' }}>{filteredContracts.length} Results</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search contracts..."
            className="px-3 py-1.5 text-[12px] border rounded-md w-48"
            style={{ borderColor: '#e5e6e7', color: '#565c65' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto w-full">
        {/* Table Header */}
        <div
          className="grid px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider border-b border-[#e5e6e7] sticky top-0 w-full"
          style={{
            color: '#909090',
            backgroundColor: '#ffffff',
            gridTemplateColumns: '1fr 280px 200px 120px 100px 50px 50px'
          }}
        >
          <div>Contract</div>
          <div>Type</div>
          <div>Party</div>
          <div>Uploaded</div>
          <div>Risk</div>
          <div className="text-center">
            <Star className="w-3 h-3 inline" />
          </div>
          <div></div>
        </div>

        {/* Table Body */}
        <div>
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="grid px-4 py-3 items-center border-b hover:bg-[#fafafa] transition-colors cursor-pointer group"
              style={{ borderColor: '#f0f0f0', gridTemplateColumns: '1fr 280px 200px 120px 100px 50px 50px' }}
              onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
            >
              {/* Contract Name */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="text-[13px] font-medium truncate" style={{ color: '#1a1a1a' }}>
                  {contract.title}
                </span>
              </div>

              {/* Type */}
              <div>
                <span className="text-[13px]" style={{ color: '#565c65' }}>
                  {contract.contract_type || "—"}
                </span>
              </div>

              {/* Party */}
              <div>
                <span className="text-[13px]" style={{ color: '#565c65' }}>
                  {getPartyName(contract)}
                </span>
              </div>

              {/* Uploaded Date */}
              <div>
                <span className="text-[13px]" style={{ color: '#909090' }}>
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
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
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
                  className="p-1 rounded hover:bg-white/80 transition-colors"
                >
                  {contract.is_starred ? (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <Star className="w-4 h-4 text-gray-200 group-hover:text-gray-400" />
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" style={{ color: '#909090' }} />
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
            </div>
          ))}
        </div>

        {/* Empty filtered state */}
        {filteredContracts.length === 0 && contracts.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px]" style={{ color: '#565c65' }}>
              No contracts match this filter
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
