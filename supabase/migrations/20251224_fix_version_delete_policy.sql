-- Fix missing RLS policies for contract_versions table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can delete own contract versions" on public.contract_versions;
drop policy if exists "Users can update own contract versions" on public.contract_versions;

-- Add DELETE policy for contract_versions (this was missing!)
create policy "Users can delete own contract versions"
  on public.contract_versions for delete
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_versions.contract_id
      and contracts.user_id = auth.uid()
    )
  );

-- Add UPDATE policy for contract_versions (also missing)
create policy "Users can update own contract versions"
  on public.contract_versions for update
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_versions.contract_id
      and contracts.user_id = auth.uid()
    )
  );
