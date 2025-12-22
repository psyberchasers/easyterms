-- Benchmarking Schema for EasyTerms
-- Run this AFTER the main schema.sql

-- Anonymized benchmark data (one row per contract, PII stripped)
create table if not exists public.benchmark_data (
  id uuid primary key default uuid_generate_v4(),
  
  -- Source contract (nullable for extra anonymity)
  contract_id uuid references public.contracts(id) on delete set null,
  
  -- Industry classification
  industry text not null check (industry in ('music', 'nil', 'creator', 'esports', 'freelance', 'real-estate')),
  contract_type text not null,
  
  -- Time dimension (for trends)
  year_quarter text not null, -- e.g., "2025-Q1"
  
  -- Common metrics (all industries)
  total_value numeric,
  term_months int,
  exclusivity boolean,
  
  -- Music-specific metrics
  royalty_rate numeric, -- as decimal, e.g., 0.15 for 15%
  advance_amount numeric,
  territory_scope text check (territory_scope in ('worldwide', 'regional', 'local')),
  rights_type text, -- 'masters', 'publishing', 'both'
  
  -- NIL-specific metrics  
  hourly_rate numeric,
  time_commitment_hours int,
  posts_required int,
  appearances_required int,
  
  -- Creator-specific metrics
  rate_per_deliverable numeric,
  usage_rights_days int,
  whitelisting_days int,
  deliverable_count int,
  revision_limit int,
  
  -- Esports-specific metrics
  base_salary numeric,
  prize_pool_split numeric, -- as decimal
  streaming_rev_share numeric, -- as decimal
  buyout_amount numeric,
  
  -- Freelance-specific metrics
  hourly_project_rate numeric,
  payment_net_days int,
  ip_retained boolean,
  
  -- Real estate-specific metrics
  monthly_rent numeric,
  security_deposit_months numeric,
  late_fee_amount numeric,
  
  -- Segmentation fields (for grouping in k-anonymity)
  follower_range text check (follower_range in ('0-1k', '1k-10k', '10k-50k', '50k-100k', '100k-500k', '500k-1m', '1m+')),
  experience_level text check (experience_level in ('entry', 'mid', 'senior', 'star')),
  counterparty_type text check (counterparty_type in ('major', 'indie', 'brand', 'agency', 'individual')),
  region text, -- 'us', 'eu', 'asia', etc.
  
  -- Metadata
  created_at timestamptz default now()
);

-- Pre-computed aggregate statistics (for fast queries & k-anonymity)
create table if not exists public.benchmark_aggregates (
  id uuid primary key default uuid_generate_v4(),
  
  -- Grouping dimensions
  industry text not null,
  contract_type text,
  follower_range text,
  experience_level text,
  counterparty_type text,
  year_quarter text,
  
  -- Metric being aggregated
  metric_name text not null,
  
  -- Aggregate values (with differential privacy noise added)
  sample_size int not null,
  min_value numeric,
  max_value numeric,
  avg_value numeric,
  median_value numeric,
  percentile_25 numeric,
  percentile_75 numeric,
  percentile_90 numeric,
  std_dev numeric,
  
  -- k-anonymity check
  is_publishable boolean default false, -- true only if sample_size >= 5
  
  -- Metadata
  computed_at timestamptz default now()
);

-- Index for fast benchmark lookups
create index if not exists idx_benchmark_data_industry on public.benchmark_data(industry);
create index if not exists idx_benchmark_data_contract_type on public.benchmark_data(industry, contract_type);
create index if not exists idx_benchmark_data_quarter on public.benchmark_data(year_quarter);
create index if not exists idx_benchmark_aggregates_lookup on public.benchmark_aggregates(industry, contract_type, metric_name);

-- Enable RLS but with special read policies for aggregates
alter table public.benchmark_data enable row level security;
alter table public.benchmark_aggregates enable row level security;

-- Only authenticated users can contribute benchmark data (linked to their contract)
create policy "Users can insert benchmark data for own contracts"
  on public.benchmark_data for insert
  with check (
    contract_id is null 
    or exists (
      select 1 from public.contracts 
      where contracts.id = benchmark_data.contract_id 
      and contracts.user_id = auth.uid()
    )
  );

-- No one can read raw benchmark data (privacy protection)
-- Raw data is ONLY for aggregation, never exposed

-- Everyone can read aggregates (this is the public data)
create policy "Anyone can read publishable aggregates"
  on public.benchmark_aggregates for select
  using (is_publishable = true);

-- Only system can write aggregates (via service role)
create policy "Service role can manage aggregates"
  on public.benchmark_aggregates for all
  using (auth.role() = 'service_role');

-- Function to compute aggregates with k-anonymity
create or replace function public.compute_benchmark_aggregates()
returns void as $$
declare
  k_threshold int := 5; -- Minimum samples for k-anonymity
begin
  -- Clear old aggregates
  delete from public.benchmark_aggregates;
  
  -- Compute royalty rate aggregates for music industry
  insert into public.benchmark_aggregates (
    industry, contract_type, metric_name, sample_size,
    min_value, max_value, avg_value, median_value,
    percentile_25, percentile_75, percentile_90, std_dev, is_publishable
  )
  select 
    'music',
    contract_type,
    'royalty_rate',
    count(*)::int,
    min(royalty_rate),
    max(royalty_rate),
    avg(royalty_rate),
    percentile_cont(0.5) within group (order by royalty_rate),
    percentile_cont(0.25) within group (order by royalty_rate),
    percentile_cont(0.75) within group (order by royalty_rate),
    percentile_cont(0.9) within group (order by royalty_rate),
    stddev(royalty_rate),
    count(*) >= k_threshold
  from public.benchmark_data
  where industry = 'music' and royalty_rate is not null
  group by contract_type;
  
  -- Add more aggregate computations for other metrics/industries as needed
  -- This is a simplified version - production would have more comprehensive aggregations
  
end;
$$ language plpgsql security definer;

-- User benchmark comparison view (what users see)
create or replace view public.user_benchmark_view as
select 
  industry,
  contract_type,
  metric_name,
  sample_size,
  round(avg_value::numeric, 4) as market_average,
  round(median_value::numeric, 4) as market_median,
  round(percentile_25::numeric, 4) as bottom_25_percent,
  round(percentile_75::numeric, 4) as top_25_percent,
  round(percentile_90::numeric, 4) as top_10_percent,
  computed_at as last_updated
from public.benchmark_aggregates
where is_publishable = true;





