"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Music,
  Target,
  Tv,
  Calculator,
  Info,
  TrendingUp,
  DollarSign,
  Radio,
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
    return match ? parseFloat(match[1]) / 100 : 0.15;
  }, [contractData?.royaltyRate]);

  const parsedAdvance = useMemo(() => {
    const match = contractData?.advanceAmount?.match(/\$?([\d,]+)/);
    return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
  }, [contractData?.advanceAmount]);

  const [royaltyRateStr, setRoyaltyRateStr] = useState(String(parsedRoyalty * 100));
  const [advanceAmountStr, setAdvanceAmountStr] = useState(parsedAdvance > 0 ? String(parsedAdvance) : "");
  const [monthlyStreamsStr, setMonthlyStreamsStr] = useState("100000");
  const [selectedPlatform, setSelectedPlatform] = useState<keyof typeof PLATFORM_RATES>("spotify");
  const [financeTab, setFinanceTab] = useState("recoup");
  
  const royaltyRate = parseFloat(royaltyRateStr) || 0;
  const advanceAmount = parseFloat(advanceAmountStr) || 0;
  const monthlyStreams = parseInt(monthlyStreamsStr) || 0;

  const calculations = useMemo(() => {
    const platformRate = PLATFORM_RATES[selectedPlatform];
    const artistRoyaltyRate = royaltyRate / 100;
    const artistPerStream = platformRate * artistRoyaltyRate;
    const grossMonthly = monthlyStreams * platformRate;
    const artistMonthly = grossMonthly * artistRoyaltyRate;
    const artistYearly = artistMonthly * 12;
    const streamsToRecoup = advanceAmount > 0 ? Math.ceil(advanceAmount / artistPerStream) : 0;
    const monthsToRecoup = advanceAmount > 0 && artistMonthly > 0 ? Math.ceil(advanceAmount / artistMonthly) : 0;
    const yearsToRecoup = monthsToRecoup / 12;
    const labelMonthly = grossMonthly - artistMonthly;

    return { platformRate, artistPerStream, grossMonthly, artistMonthly, artistYearly, streamsToRecoup, monthsToRecoup, yearsToRecoup, labelMonthly };
  }, [royaltyRate, advanceAmount, monthlyStreams, selectedPlatform]);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
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
    <div className="space-y-4">
      <Tabs value={financeTab} onValueChange={setFinanceTab} className="w-full">
        <div className="flex gap-4 border-b border-[#262626]">
          {[
            { id: "recoup", label: "Recoupment" },
            { id: "streaming", label: "Streaming" },
            { id: "sync", label: "Sync" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFinanceTab(tab.id)}
              className={cn(
                "relative pb-2 text-xs transition-colors",
                financeTab === tab.id ? "text-white" : "text-[#525252] hover:text-[#878787]"
              )}
            >
              {tab.label}
              {financeTab === tab.id && (
                <motion.div
                  layoutId="finance-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Streaming Calculator */}
        <TabsContent value="streaming" className="space-y-4 pt-4">
          {/* Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-[#525252]">Royalty Rate</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={royaltyRateStr}
                  onChange={(e) => setRoyaltyRateStr(e.target.value)}
                  className="pr-6 bg-black border-[#262626] text-white h-8 text-xs"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] text-xs">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-[#525252]">Monthly Streams</Label>
              <Input
                type="number"
                value={monthlyStreamsStr}
                onChange={(e) => setMonthlyStreamsStr(e.target.value)}
                className="bg-black border-[#262626] text-white h-8 text-xs"
                min={0}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-[#525252]">Platform</Label>
              <Select value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as keyof typeof PLATFORM_RATES)}>
                <SelectTrigger className="bg-black border-[#262626] text-white h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-[#262626] text-white">
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

          {/* Results - Big numbers with colored dots */}
          <div className="grid grid-cols-2 gap-6 py-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="text-xs text-[#878787]">Per Stream</span>
              </div>
              <p className="text-3xl font-light text-white font-mono">
                $<NumberFlow value={calculations.artistPerStream} format={{ minimumFractionDigits: 4, maximumFractionDigits: 4 }} />
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-xs text-[#878787]">Monthly</span>
              </div>
              <p className="text-3xl font-light text-white font-mono">
                $<NumberFlow value={calculations.artistMonthly} format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} />
              </p>
            </div>
          </div>
          
          {/* Secondary Stats */}
          <div className="grid grid-cols-2 gap-2 pb-4 border-b border-[#262626]">
            <div className="border border-[#262626] p-3">
              <p className="text-[10px] text-[#525252] mb-0.5">Yearly</p>
              <p className="text-lg font-light text-white">
                $<NumberFlow value={calculations.artistYearly} format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} />
              </p>
            </div>
            <div className="border border-[#262626] p-3 bg-[#0a0a0a]">
              <p className="text-[10px] text-[#525252] mb-0.5">Label Gets</p>
              <p className="text-lg font-light text-[#525252]">
                $<NumberFlow value={calculations.labelMonthly} format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} />
              </p>
            </div>
          </div>

          {/* Platform Comparison */}
          <div className="border border-[#262626] p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-[#525252] uppercase tracking-wider">Platform Comparison</span>
              <div className="h-px flex-1 bg-[#262626]" />
            </div>
            <div className="space-y-2">
              {Object.entries(PLATFORM_RATES).map(([platform, rate]) => {
                const earnings = monthlyStreams * rate * (royaltyRate / 100);
                const maxEarnings = monthlyStreams * 0.012 * (royaltyRate / 100);
                const percentage = (earnings / maxEarnings) * 100;

                return (
                  <div key={platform} className="flex items-center gap-2">
                    <div className="w-20 text-[10px] text-[#878787] capitalize">{platform.replace("Music", " Music")}</div>
                    <div className="flex-1 h-1 bg-[#1a1a1a] overflow-hidden">
                      <div
                        className={cn("h-full", platform === selectedPlatform ? "bg-white" : "bg-[#404040]")}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-14 text-right text-[10px] text-white">{formatCurrency(earnings)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Recoupment Calculator */}
        <TabsContent value="recoup" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-[#525252]">Advance Amount</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#525252] text-xs">$</span>
                <Input
                  type="number"
                  value={advanceAmountStr}
                  onChange={(e) => setAdvanceAmountStr(e.target.value)}
                  className="pl-5 bg-black border-[#262626] text-white h-8 text-xs"
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-[#525252]">Royalty Rate</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={royaltyRateStr}
                  onChange={(e) => setRoyaltyRateStr(e.target.value)}
                  className="pr-6 bg-black border-[#262626] text-white h-8 text-xs"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] text-xs">%</span>
              </div>
            </div>
          </div>

          {advanceAmount > 0 ? (
            <>
              {/* Big Stats with colored dots */}
              <div className="grid grid-cols-2 gap-6 py-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span className="text-xs text-[#878787]">Streams to Recoup</span>
                  </div>
                  <p className="text-3xl font-light text-white font-mono">
                    <NumberFlow value={calculations.streamsToRecoup} format={{ notation: "compact", maximumFractionDigits: 1 }} />
                  </p>
                  <p className="text-[10px] text-[#525252] mt-1">on {selectedPlatform}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      calculations.yearsToRecoup <= 2 ? "bg-green-400" :
                      calculations.yearsToRecoup <= 5 ? "bg-yellow-400" : "bg-red-400"
                    )}></span>
                    <span className="text-xs text-[#878787]">Time to Recoup</span>
                  </div>
                  <p className={cn(
                    "text-3xl font-light font-mono",
                    calculations.yearsToRecoup <= 2 ? "text-green-400" :
                    calculations.yearsToRecoup <= 5 ? "text-yellow-400" : "text-red-400"
                  )}>
                    <NumberFlow value={calculations.yearsToRecoup} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> years
                  </p>
                  <p className="text-[10px] text-[#525252] mt-1">@ {formatNumber(monthlyStreams)}/mo</p>
                </div>
              </div>

              {/* Monthly Progress */}
              <div className="border border-[#262626] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-[#525252]" />
                  <span className="text-[10px] text-[#525252]">Monthly Progress</span>
                </div>
                <p className="text-lg font-light text-white">
                  <NumberFlow value={(calculations.artistMonthly / advanceAmount) * 100} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />%
                </p>
                <p className="text-[9px] text-[#404040]">of advance paid back per month</p>
              </div>

              {/* Progress Bar */}
              <div className="border border-[#262626] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#878787]">Recoupment Progress</span>
                  <span className="text-[10px] text-[#525252]">{formatCurrency(calculations.artistYearly)} / {formatCurrency(advanceAmount)} /yr</span>
                </div>
                <div className="h-1 bg-[#1a1a1a] overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${Math.min(100, (calculations.artistYearly / advanceAmount) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-[#404040] mt-1">
                  <span>$0</span>
                  <span>{formatCurrency(advanceAmount)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-[#262626] flex flex-col items-center justify-center py-10">
              <Calculator className="w-6 h-6 text-[#525252] mb-2" />
              <p className="text-xs text-[#878787]">Enter an advance to see recoupment analysis</p>
            </div>
          )}
        </TabsContent>

        {/* Sync Licensing */}
        <TabsContent value="sync" className="space-y-4 pt-4">
          <div className="flex items-start gap-2 p-3 border border-[#262626] bg-[#0a0a0a]">
            <Info className="w-3.5 h-3.5 text-[#878787] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[#878787]">
              Sync licensing fees vary widely based on usage, media type, and your negotiating power.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(SYNC_RATES).map(([type, rates]) => {
              const artistCut = royaltyRate / 100;
              const typeIcons: Record<string, React.ReactNode> = {
                majorFilm: <Radio className="w-3 h-3" />,
                tvShow: <Tv className="w-3 h-3" />,
                commercial: <DollarSign className="w-3 h-3" />,
                videogame: <Music className="w-3 h-3" />,
                indie: <Music className="w-3 h-3" />,
              };
              
              return (
                <div key={type} className="border border-[#262626] p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[#525252]">{typeIcons[type]}</span>
                    <span className="text-[10px] text-white capitalize">{type.replace(/([A-Z])/g, " $1").trim()}</span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-[#525252]">Range</span>
                      <span className="text-[#878787]">{formatCurrency(rates.low)} – {formatCurrency(rates.high)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#525252]">Average</span>
                      <span className="text-white">{formatCurrency(rates.avg)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 mt-1.5 border-t border-[#262626]">
                      <span className="text-[#525252]">Your Cut</span>
                      <span className="text-white font-medium">{formatCurrency(rates.avg * artistCut)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 p-3 border border-[#262626]">
            <TrendingUp className="w-3 h-3 text-[#525252] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[#878787]">
              If your contract doesn&apos;t specify sync splits, your royalty rate ({royaltyRate}%) applies. Consider negotiating 50/50.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
