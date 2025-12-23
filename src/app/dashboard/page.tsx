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
  Scale,
  FileText,
  Star,
  StarOff,
  MoreVertical,
  Trash2,
  Eye,
  Search,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  Plus,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MusicLoader } from "@/components/MusicLoader";

export default function DashboardPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "starred" | "high-risk">("all");
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

  const deleteContract = async (contractId: string) => {
    if (!confirm("Are you sure you want to delete this contract?")) return;

    await supabase.from("contracts").delete().eq("id", contractId);
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
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
                <Scale className="w-4 h-4 mr-2" />
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
              <Button variant="outline" size="sm" className="h-7 text-xs border-[#262626] bg-transparent hover:bg-[#1a1a1a] rounded-none">
                <Plus className="w-3 h-3 mr-1" />
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
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {contracts.length === 0 ? "No contracts yet" : "No matching contracts"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {contracts.length === 0
                  ? "Upload your first contract to get started"
                  : "Try adjusting your search or filters"}
              </p>
              {contracts.length === 0 && (
                <Link href="/analyze">
                  <Button className="rounded-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Analyze Contract
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_180px_100px_100px_80px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
              <div>Contract</div>
              <div>Type</div>
              <div>Risk</div>
              <div>Date</div>
              <div className="text-right">Actions</div>
            </div>
            {/* Table Rows */}
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="grid grid-cols-[1fr_180px_100px_100px_80px] gap-2 px-4 py-2.5 items-center border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate text-sm">{contract.title}</span>
                  {contract.is_starred && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground truncate block">
                    {contract.contract_type || "—"}
                  </span>
                </div>
                <div>{getRiskBadge(contract.overall_risk)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(contract.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/contract/${contract.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleStar(contract.id, contract.is_starred)}
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
                        <Link href={`/compare?contracts=${contract.id}`}>
                          <Scale className="w-4 h-4 mr-2" />
                          Compare
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteContract(contract.id)}
                        className="text-red-400"
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
        )}
      </main>
    </div>
  );
}


