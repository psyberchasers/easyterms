"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Bell,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractDate {
  id: string;
  contract_id: string;
  date_type: string;
  date: string;
  description: string;
  alert_days_before: number;
  alert_sent: boolean;
  contract?: {
    title: string;
    overall_risk: string;
  };
}

const DATE_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  option_period: { label: "Option Period", color: "bg-purple-500", icon: Clock },
  termination_window: { label: "Termination Window", color: "bg-red-500", icon: AlertTriangle },
  renewal: { label: "Renewal Date", color: "bg-blue-500", icon: Calendar },
  expiration: { label: "Expiration", color: "bg-amber-500", icon: AlertTriangle },
  payment: { label: "Payment Due", color: "bg-green-500", icon: FileText },
};

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [dates, setDates] = useState<ContractDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/calendar");
      return;
    }

    if (user) {
      fetchDates();
    }
  }, [user, authLoading]);

  const fetchDates = async () => {
    setLoading(true);
    
    // Fetch all contract dates with contract info
    const { data, error } = await supabase
      .from("contract_dates")
      .select(`
        *,
        contract:contracts(title, overall_risk)
      `)
      .order("date", { ascending: true });

    if (!error && data) {
      setDates(data as ContractDate[]);
    }
    
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    return dates.filter((d) => d.date === dateStr);
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

  // Get upcoming dates (next 30 days)
  const upcomingDates = dates.filter((d) => {
    const eventDate = new Date(d.date);
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  // Get overdue dates
  const overdueDates = dates.filter((d) => new Date(d.date) < today);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 pt-[80px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Contract Calendar</h1>
            <p className="text-muted-foreground">Track important deadlines and dates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the 1st */}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 bg-muted/20 rounded" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const events = getEventsForDay(day);
                  const isToday = isCurrentMonth && day === today.getDate();

                  return (
                    <div
                      key={day}
                      className={cn(
                        "h-20 p-1 rounded border border-border/50 bg-card/50 overflow-hidden",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      <div className={cn(
                        "text-xs font-medium mb-1",
                        isToday && "text-primary"
                      )}>
                        {day}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {events.slice(0, 2).map((event) => {
                          const config = DATE_TYPE_CONFIG[event.date_type] || DATE_TYPE_CONFIG.payment;
                          return (
                            <Link key={event.id} href={`/contract/${event.contract_id}`}>
                              <div className={cn(
                                "text-[10px] px-1 py-0.5 rounded truncate text-white",
                                config.color
                              )}>
                                {event.contract?.title || "Contract"}
                              </div>
                            </Link>
                          );
                        })}
                        {events.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{events.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Alerts */}
            {overdueDates.length > 0 && (
              <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Overdue ({overdueDates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {overdueDates.slice(0, 3).map((event) => (
                    <Link key={event.id} href={`/contract/${event.contract_id}`}>
                      <div className="p-2 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors">
                        <p className="text-sm font-medium truncate">{event.contract?.title}</p>
                        <p className="text-xs text-red-400">
                          {DATE_TYPE_CONFIG[event.date_type]?.label} - {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upcoming */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Upcoming (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming deadlines
                  </p>
                ) : (
                  upcomingDates.slice(0, 5).map((event) => {
                    const config = DATE_TYPE_CONFIG[event.date_type] || DATE_TYPE_CONFIG.payment;
                    const Icon = config.icon;
                    const daysUntil = Math.ceil(
                      (new Date(event.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <Link key={event.id} href={`/contract/${event.contract_id}`}>
                        <div className="p-2 rounded bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("w-2 h-2 rounded-full", config.color)} />
                            <p className="text-sm font-medium truncate flex-1">{event.contract?.title}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{config.label}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Event Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(DATE_TYPE_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded", config.color)} />
                    <span>{config.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}





