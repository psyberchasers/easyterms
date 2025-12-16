import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/benchmarks?industry=music&contractType=publishing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const contractType = searchParams.get("contractType");
    const metric = searchParams.get("metric");

    if (!industry) {
      return NextResponse.json(
        { error: "Industry parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Query the benchmark_aggregates table (only publishable data)
    let query = supabase
      .from("benchmark_aggregates")
      .select("*")
      .eq("industry", industry)
      .eq("is_publishable", true);

    if (contractType) {
      query = query.eq("contract_type", contractType);
    }

    if (metric) {
      query = query.eq("metric_name", metric);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching benchmarks:", error);
      return NextResponse.json(
        { error: "Failed to fetch benchmarks" },
        { status: 500 }
      );
    }

    // Transform to a more usable format
    const benchmarks: Record<string, {
      avg: number;
      median: number;
      p25: number;
      p75: number;
      p90: number;
      sampleSize: number;
    }> = {};

    for (const row of data || []) {
      benchmarks[row.metric_name] = {
        avg: row.avg_value,
        median: row.median_value,
        p25: row.percentile_25,
        p75: row.percentile_75,
        p90: row.percentile_90,
        sampleSize: row.sample_size,
      };
    }

    // If no real data yet, return empty with flag
    const hasRealData = Object.keys(benchmarks).length > 0;

    return NextResponse.json({
      industry,
      contractType: contractType || "all",
      benchmarks,
      hasRealData,
      // Include sample size across all metrics
      totalSampleSize: data?.reduce((sum, row) => Math.max(sum, row.sample_size || 0), 0) || 0,
    });
  } catch (err) {
    console.error("Benchmark API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/benchmarks/compute - Trigger aggregate computation (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (you might want to add admin check here)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Call the compute function (requires service role in production)
    const { error } = await supabase.rpc("compute_benchmark_aggregates");

    if (error) {
      console.error("Error computing aggregates:", error);
      return NextResponse.json(
        { error: "Failed to compute aggregates", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Benchmark aggregates recomputed",
    });
  } catch (err) {
    console.error("Compute aggregates error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

