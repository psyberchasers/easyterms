-- ContractLens Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nldypkdhuxjkvmpzbplk/sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'team')),
  contracts_this_month int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contracts table
create table if not exists public.contracts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  file_name text,
  file_url text,
  file_type text,
  extracted_text text,
  analysis jsonb,
  contract_type text,
  status text default 'active' check (status in ('active', 'expired', 'terminated', 'negotiating')),
  overall_risk text check (overall_risk in ('high', 'medium', 'low')),
  is_starred boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contract versions for tracking negotiations
create table if not exists public.contract_versions (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  version_number int not null,
  file_url text,
  extracted_text text,
  analysis jsonb,
  changes_summary text,
  created_at timestamptz default now()
);

-- Key dates for calendar/alerts
create table if not exists public.contract_dates (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  date_type text not null check (date_type in ('option_period', 'termination_window', 'renewal', 'expiration', 'payment')),
  date date not null,
  description text,
  alert_days_before int default 30,
  alert_sent boolean default false,
  created_at timestamptz default now()
);

-- Comparisons
create table if not exists public.comparisons (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text,
  contract_ids uuid[] not null,
  diff_summary jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.contract_dates enable row level security;
alter table public.comparisons enable row level security;

-- Profiles policies
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Contracts policies
create policy "Users can view own contracts" 
  on public.contracts for select 
  using (auth.uid() = user_id);

create policy "Users can insert own contracts" 
  on public.contracts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own contracts" 
  on public.contracts for update 
  using (auth.uid() = user_id);

create policy "Users can delete own contracts" 
  on public.contracts for delete 
  using (auth.uid() = user_id);

-- Contract versions policies
create policy "Users can view own contract versions" 
  on public.contract_versions for select 
  using (
    exists (
      select 1 from public.contracts 
      where contracts.id = contract_versions.contract_id 
      and contracts.user_id = auth.uid()
    )
  );

create policy "Users can insert own contract versions"
  on public.contract_versions for insert
  with check (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_versions.contract_id
      and contracts.user_id = auth.uid()
    )
  );

create policy "Users can delete own contract versions"
  on public.contract_versions for delete
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_versions.contract_id
      and contracts.user_id = auth.uid()
    )
  );

create policy "Users can update own contract versions"
  on public.contract_versions for update
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_versions.contract_id
      and contracts.user_id = auth.uid()
    )
  );

-- Contract dates policies
create policy "Users can view own contract dates" 
  on public.contract_dates for select 
  using (
    exists (
      select 1 from public.contracts 
      where contracts.id = contract_dates.contract_id 
      and contracts.user_id = auth.uid()
    )
  );

create policy "Users can manage own contract dates" 
  on public.contract_dates for all 
  using (
    exists (
      select 1 from public.contracts 
      where contracts.id = contract_dates.contract_id 
      and contracts.user_id = auth.uid()
    )
  );

-- Comparisons policies
create policy "Users can view own comparisons" 
  on public.comparisons for select 
  using (auth.uid() = user_id);

create policy "Users can manage own comparisons" 
  on public.comparisons for all 
  using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_contracts_updated_at
  before update on public.contracts
  for each row execute procedure public.update_updated_at();

-- Create storage bucket for contract files
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own contract files"
  on storage.objects for insert
  with check (
    bucket_id = 'contracts' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own contract files"
  on storage.objects for select
  using (
    bucket_id = 'contracts' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own contract files"
  on storage.objects for delete
  using (
    bucket_id = 'contracts' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );




