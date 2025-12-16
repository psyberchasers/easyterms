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
  CheckCircle2,
  Clock,
  Loader2,
  FolderOpen,
  RefreshCw,
  Plus,
  Calendar,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loader during initial data fetch (but not subsequent refreshes)
  if (initialLoad && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your contracts...</p>
        </div>
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
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-muted-foreground">
              Manage and analyze your music contracts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/compare">
              <Button variant="outline" size="sm">
                <Scale className="w-4 h-4 mr-2" />
                Compare
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => fetchContracts(false)} disabled={loading}>
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
                <Button variant="outline" size="sm" onClick={() => fetchContracts(false)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Quick Stats */}
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Overview</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Contracts</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-green-500">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-amber-500">{stats.negotiating}</p>
                  <p className="text-xs text-muted-foreground">Negotiating</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats.starred}</p>
                  <p className="text-xs text-muted-foreground">Starred</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Risk Distribution</span>
              </div>
              {riskTotal > 0 ? (
                <div className="space-y-3">
                  {/* Visual Bar */}
                  <div className="h-3 rounded-full overflow-hidden flex bg-muted">
                    <div 
                      className="bg-red-500 transition-all" 
                      style={{ width: `${riskPercentages.high}%` }} 
                    />
                    <div 
                      className="bg-amber-500 transition-all" 
                      style={{ width: `${riskPercentages.medium}%` }} 
                    />
                    <div 
                      className="bg-green-500 transition-all" 
                      style={{ width: `${riskPercentages.low}%` }} 
                    />
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">High</span>
                      <span className="font-medium">{stats.highRisk}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Medium</span>
                      <span className="font-medium">{stats.mediumRisk}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Low</span>
                      <span className="font-medium">{stats.lowRisk}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No risk data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Quick Actions</span>
              </div>
              <div className="space-y-2">
                <Link href="/analyze" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Analysis
                  </Button>
                </Link>
                <Link href="/compare" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Scale className="w-4 h-4 mr-2" />
                    Compare Contracts
                  </Button>
                </Link>
                <Link href="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Calendar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "starred" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("starred")}
            >
              <Star className="w-4 h-4 mr-1" />
              Starred
            </Button>
            <Button
              variant={filter === "high-risk" ? "default" : "outline"}
              size="sm"
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
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Analyze Contract
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
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
                className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-2 px-4 py-2.5 items-center border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
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


