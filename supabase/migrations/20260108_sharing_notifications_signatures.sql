-- Contract Sharing, Notifications & Signatures
-- Run this in Supabase SQL Editor

-- Enable pg_net extension for HTTP calls from triggers
create extension if not exists pg_net with schema extensions;

-- ============================================
-- CONTRACT SHARES
-- ============================================
create table if not exists public.contract_shares (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  shared_with_email text not null,
  shared_with_user_id uuid references public.profiles(id) on delete set null,
  permission text default 'view' check (permission in ('view', 'comment', 'sign')),
  status text default 'pending' check (status in ('pending', 'viewed', 'signed', 'declined')),
  message text,
  created_at timestamptz default now()
);

-- RLS for contract_shares
alter table public.contract_shares enable row level security;

-- Owner can do everything with their shares
create policy "Owners can manage their shares"
  on public.contract_shares for all
  using (auth.uid() = owner_id);

-- Recipients can view shares sent to them
create policy "Recipients can view their shares"
  on public.contract_shares for select
  using (
    shared_with_user_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  );

-- Recipients can update status (viewed, signed, declined)
create policy "Recipients can update share status"
  on public.contract_shares for update
  using (
    shared_with_user_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  )
  with check (
    shared_with_user_id = auth.uid()
    or shared_with_email = (select email from public.profiles where id = auth.uid())
  );

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('contract_shared', 'signature_requested', 'contract_signed', 'comment_added')),
  title text not null,
  message text,
  contract_id uuid references public.contracts(id) on delete cascade,
  from_user_id uuid references public.profiles(id) on delete set null,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS for notifications
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- ============================================
-- SIGNATURES
-- ============================================
create table if not exists public.contract_signatures (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  share_id uuid references public.contract_shares(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  signature_data text not null,
  signature_type text check (signature_type in ('drawn', 'typed')),
  signer_name text not null,
  signer_email text not null,
  ip_address text,
  user_agent text,
  document_hash text,
  signed_at timestamptz default now()
);

-- RLS for signatures
alter table public.contract_signatures enable row level security;

-- Contract owner can view all signatures on their contracts
create policy "Owners can view signatures on their contracts"
  on public.contract_signatures for select
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_signatures.contract_id
      and contracts.user_id = auth.uid()
    )
  );

-- Users can view their own signatures
create policy "Users can view own signatures"
  on public.contract_signatures for select
  using (auth.uid() = user_id);

-- Users can insert their own signatures
create policy "Users can sign contracts"
  on public.contract_signatures for insert
  with check (auth.uid() = user_id);

-- ============================================
-- UPDATE CONTRACTS RLS FOR SHARED ACCESS
-- ============================================
-- Allow shared users to view contracts shared with them
create policy "Shared users can view shared contracts"
  on public.contracts for select
  using (
    exists (
      select 1 from public.contract_shares
      where contract_shares.contract_id = contracts.id
      and (
        contract_shares.shared_with_user_id = auth.uid()
        or contract_shares.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
    )
  );

-- ============================================
-- FUNCTION: Auto-link shares when user signs up
-- ============================================
create or replace function public.link_pending_shares()
returns trigger as $$
begin
  -- Update any shares that were sent to this email
  update public.contract_shares
  set shared_with_user_id = new.id
  where shared_with_email = new.email
  and shared_with_user_id is null;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to link shares when profile is created
create trigger on_profile_created_link_shares
  after insert on public.profiles
  for each row execute procedure public.link_pending_shares();

-- ============================================
-- FUNCTION: Create notification when contract shared
-- ============================================
create or replace function public.handle_contract_shared()
returns trigger as $$
declare
  recipient_user_id uuid;
  owner_name text;
  contract_title text;
begin
  -- Check if recipient has an account
  select id into recipient_user_id
  from public.profiles
  where email = new.shared_with_email;

  -- Update the share with user_id if found
  if recipient_user_id is not null then
    new.shared_with_user_id := recipient_user_id;

    -- Get owner name and contract title for notification
    select full_name into owner_name from public.profiles where id = new.owner_id;
    select title into contract_title from public.contracts where id = new.contract_id;

    -- Create in-app notification
    insert into public.notifications (user_id, type, title, message, contract_id, from_user_id)
    values (
      recipient_user_id,
      'contract_shared',
      'Contract shared with you',
      coalesce(owner_name, 'Someone') || ' shared "' || coalesce(contract_title, 'a contract') || '" with you',
      new.contract_id,
      new.owner_id
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger fires before insert to set user_id and create notification
create trigger on_contract_share_created
  before insert on public.contract_shares
  for each row execute procedure public.handle_contract_shared();

-- ============================================
-- FUNCTION: Call Edge Function to send email
-- ============================================
create or replace function public.trigger_share_email()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://nldypkdhuxjkvmpzbplk.supabase.co/functions/v1/send-share-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZHlwa2RodXhqa3ZtcHpicGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MjA5OTUsImV4cCI6MjA1MDI5Njk5NX0.bkH-NxcQBqcN6x_1FuUfMPhfOGI-xT8W9RgSZJnNJN4"}'::jsonb,
    body := jsonb_build_object(
      'share_id', new.id,
      'contract_id', new.contract_id,
      'recipient_email', new.shared_with_email,
      'owner_id', new.owner_id,
      'message', new.message
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to send email after share is created
create trigger on_contract_share_send_email
  after insert on public.contract_shares
  for each row execute procedure public.trigger_share_email();

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_contract_shares_contract_id on public.contract_shares(contract_id);
create index if not exists idx_contract_shares_owner_id on public.contract_shares(owner_id);
create index if not exists idx_contract_shares_shared_with_email on public.contract_shares(shared_with_email);
create index if not exists idx_contract_shares_shared_with_user_id on public.contract_shares(shared_with_user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_contract_signatures_contract_id on public.contract_signatures(contract_id);
