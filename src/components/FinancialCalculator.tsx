"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Target,
  Calculator,
  Music,
  Radio,
  Tv,
  Download,
  BarChart3,
  Info,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialCalculatorProps {
  contractData?: {
    royaltyRate?: string;
    advanceAmount?: string;
    termLength?: string;
  };
}

// Platform payout rates (average per stream in USD)
const PLATFORM_RATES = {
  spotify: 0.004,
  appleMusic: 0.007,
  amazonMusic: 0.004,
  youtube: 0.002,
  tidal: 0.012,
  deezer: 0.003,
};

// Sync licensing averages
const SYNC_RATES = {
  majorFilm: { low: 50000, high: 300000, avg: 100000 },
  tvShow: { low: 5000, high: 50000, avg: 15000 },
  commercial: { low: 10000, high: 200000, avg: 50000 },
  videogame: { low: 5000, high: 100000, avg: 25000 },
  indie: { low: 500, high: 5000, avg: 2000 },
};

export function FinancialCalculator({ contractData }: FinancialCalculatorProps) {
  // Parse contract data
  const parsedRoyalty = useMemo(() => {
    const match = contractData?.royaltyRate?.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) / 100 : 0.15; // Default 15%
  }, [contractData?.royaltyRate]);

  const parsedAdvance = useMemo(() => {
    const match = contractData?.advanceAmount?.match(/\$?([\d,]+)/);
    return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
  }, [contractData?.advanceAmount]);

  // Calculator state - using strings to handle input properly
  const [royaltyRateStr, setRoyaltyRateStr] = useState(String(parsedRoyalty * 100));
  const [advanceAmountStr, setAdvanceAmountStr] = useState(parsedAdvance > 0 ? String(parsedAdvance) : "");
  const [monthlyStreamsStr, setMonthlyStreamsStr] = useState("100000");
  const [selectedPlatform, setSelectedPlatform] = useState<keyof typeof PLATFORM_RATES>("spotify");
  
  // Parse string values for calculations
  const royaltyRate = parseFloat(royaltyRateStr) || 0;
  const advanceAmount = parseFloat(advanceAmountStr) || 0;
  const monthlyStreams = parseInt(monthlyStreamsStr) || 0;

  // Calculations
  const calculations = useMemo(() => {
    const platformRate = PLATFORM_RATES[selectedPlatform];
    const artistRoyaltyRate = royaltyRate / 100;

    // Per-stream earnings after label cut
    const artistPerStream = platformRate * artistRoyaltyRate;

    // Monthly and yearly projections
    const grossMonthly = monthlyStreams * platformRate;
    const artistMonthly = grossMonthly * artistRoyaltyRate;
    const artistYearly = artistMonthly * 12;

    // Streams needed to recoup
    const streamsToRecoup = advanceAmount > 0 
      ? Math.ceil(advanceAmount / artistPerStream)
      : 0;

    // Time to recoup at current rate
    const monthsToRecoup = advanceAmount > 0 && artistMonthly > 0
      ? Math.ceil(advanceAmount / artistMonthly)
      : 0;

    // Break-even analysis
    const yearsToRecoup = monthsToRecoup / 12;

    return {
      platformRate,
      artistPerStream,
      grossMonthly,
      artistMonthly,
      artistYearly,
      streamsToRecoup,
      monthsToRecoup,
      yearsToRecoup,
    };
  }, [royaltyRate, advanceAmount, monthlyStreams, selectedPlatform]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="streaming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="recoup" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Recoupment
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Tv className="w-4 h-4" />
            Sync
          </TabsTrigger>
        </TabsList>

        {/* Streaming Calculator */}
        <TabsContent value="streaming" className="space-y-4 pt-4">
          {/* Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Royalty Rate</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={royaltyRateStr}
                  onChange={(e) => setRoyaltyRateStr(e.target.value)}
                  className="pr-8"
                  min={0}
                  max={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Monthly Streams</Label>
              <Input
                type="number"
                value={monthlyStreamsStr}
                onChange={(e) => setMonthlyStreamsStr(e.target.value)}
                min={0}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Platform</Label>
              <Select
                value={selectedPlatform}
                onValueChange={(value) => setSelectedPlatform(value as keyof typeof PLATFORM_RATES)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="appleMusic">Apple Music</SelectItem>
                  <SelectItem value="amazonMusic">Amazon</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tidal">Tidal</SelectItem>
                  <SelectItem value="deezer">Deezer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardContent className="p-3">
                <div className="text-[10px] text-green-400/70 mb-0.5">Per Stream</div>
                <div className="text-lg font-bold text-green-400">
                  ${calculations.artistPerStream.toFixed(4)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardContent className="p-3">
                <div className="text-[10px] text-blue-400/70 mb-0.5">Monthly</div>
                <div className="text-lg font-bold text-blue-400">
                  {formatCurrency(calculations.artistMonthly)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardContent className="p-3">
                <div className="text-[10px] text-purple-400/70 mb-0.5">Yearly</div>
                <div className="text-lg font-bold text-purple-400">
                  {formatCurrency(calculations.artistYearly)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <div className="text-[10px] text-muted-foreground mb-0.5">Label Gets</div>
                <div className="text-lg font-bold text-muted-foreground">
                  {formatCurrency(calculations.grossMonthly - calculations.artistMonthly)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Platform Comparison</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(PLATFORM_RATES).map(([platform, rate]) => {
                  const earnings = monthlyStreams * rate * (royaltyRate / 100);
                  const maxEarnings = monthlyStreams * 0.012 * (royaltyRate / 100); // Tidal max
                  const percentage = (earnings / maxEarnings) * 100;

                  return (
                    <div key={platform} className="flex items-center gap-2">
                      <div className="w-24 text-xs capitalize">{platform.replace("Music", " Music")}</div>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            platform === selectedPlatform ? "bg-primary" : "bg-muted-foreground/50"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-xs font-mono">
                        {formatCurrency(earnings)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recoupment Calculator */}
        <TabsContent value="recoup" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Advance Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={advanceAmountStr}
                  onChange={(e) => setAdvanceAmountStr(e.target.value)}
                  className="pl-7"
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Royalty Rate</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={royaltyRateStr}
                  onChange={(e) => setRoyaltyRateStr(e.target.value)}
                  className="pr-8"
                  min={0}
                  max={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          {advanceAmount > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                  <CardContent className="p-3">
                    <div className="text-[10px] text-amber-400/70 mb-0.5 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Streams to Recoup
                    </div>
                    <div className="text-lg font-bold text-amber-400">
                      {formatNumber(calculations.streamsToRecoup)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      on {selectedPlatform}
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  "bg-gradient-to-br border",
                  calculations.yearsToRecoup <= 2 
                    ? "from-green-500/10 to-transparent border-green-500/20"
                    : calculations.yearsToRecoup <= 5
                    ? "from-amber-500/10 to-transparent border-amber-500/20"
                    : "from-red-500/10 to-transparent border-red-500/20"
                )}>
                  <CardContent className="p-3">
                    <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Time to Recoup
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      calculations.yearsToRecoup <= 2 
                        ? "text-green-400"
                        : calculations.yearsToRecoup <= 5
                        ? "text-amber-400"
                        : "text-red-400"
                    )}>
                      {calculations.yearsToRecoup.toFixed(1)}y
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      @ {formatNumber(monthlyStreams)}/mo
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                  <CardContent className="p-3">
                    <div className="text-[10px] text-purple-400/70 mb-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Monthly Progress
                    </div>
                    <div className="text-lg font-bold text-purple-400">
                      {((calculations.artistMonthly / advanceAmount) * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      paid back/mo
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Bar */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium">Recoupment</span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(calculations.artistYearly)} / {formatCurrency(advanceAmount)} /yr
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (calculations.artistYearly / advanceAmount) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>$0</span>
                    <span>{formatCurrency(advanceAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calculator className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Enter an advance to see recoupment analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sync Licensing */}
        <TabsContent value="sync" className="space-y-4 pt-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-200/80">
              Sync licensing fees vary widely based on usage, media type, and your negotiating power.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(SYNC_RATES).map(([type, rates]) => {
              const artistCut = (royaltyRate / 100);
              
              return (
                <Card key={type} className="bg-card/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      {type === "majorFilm" && <Radio className="w-3.5 h-3.5 text-primary" />}
                      {type === "tvShow" && <Tv className="w-3.5 h-3.5 text-primary" />}
                      {type === "commercial" && <DollarSign className="w-3.5 h-3.5 text-primary" />}
                      {type === "videogame" && <Music className="w-3.5 h-3.5 text-primary" />}
                      {type === "indie" && <Music className="w-3.5 h-3.5 text-primary" />}
                      <span className="font-medium text-xs capitalize">
                        {type.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Range</span>
                        <span>{formatCurrency(rates.low)}-{formatCurrency(rates.high)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg</span>
                        <span className="font-medium">{formatCurrency(rates.avg)}</span>
                      </div>
                      <div className="flex justify-between pt-1 mt-1 border-t border-border/30">
                        <span className="text-green-400">You</span>
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(rates.avg * artistCut)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
            <span className="text-sm">💡</span>
            <p className="text-xs text-muted-foreground">
              If your contract doesn't specify sync splits, your royalty rate ({royaltyRate}%) applies. 
              Consider negotiating 50/50—it's industry standard.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

