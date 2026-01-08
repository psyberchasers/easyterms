-- Contract Comments
-- Run this in Supabase SQL Editor

-- ============================================
-- CONTRACT COMMENTS
-- ============================================
create table if not exists public.contract_comments (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references public.contracts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  -- Optional: reference to a specific clause/section
  clause_reference text,
  -- For threaded replies
  parent_id uuid references public.contract_comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for contract_comments
alter table public.contract_comments enable row level security;

-- Contract owner can view all comments on their contracts
create policy "Owners can view comments on their contracts"
  on public.contract_comments for select
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_comments.contract_id
      and contracts.user_id = auth.uid()
    )
  );

-- Shared users with comment/sign permission can view comments
create policy "Shared users can view comments"
  on public.contract_comments for select
  using (
    exists (
      select 1 from public.contract_shares
      where contract_shares.contract_id = contract_comments.contract_id
      and (
        contract_shares.shared_with_user_id = auth.uid()
        or contract_shares.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
      and contract_shares.permission in ('comment', 'sign')
    )
  );

-- Users can view their own comments
create policy "Users can view own comments"
  on public.contract_comments for select
  using (auth.uid() = user_id);

-- Contract owner can add comments
create policy "Owners can add comments"
  on public.contract_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.contracts
      where contracts.id = contract_id
      and contracts.user_id = auth.uid()
    )
  );

-- Shared users with comment/sign permission can add comments
create policy "Shared users can add comments"
  on public.contract_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.contract_shares
      where contract_shares.contract_id = contract_id
      and (
        contract_shares.shared_with_user_id = auth.uid()
        or contract_shares.shared_with_email = (select email from public.profiles where id = auth.uid())
      )
      and contract_shares.permission in ('comment', 'sign')
    )
  );

-- Users can update their own comments
create policy "Users can update own comments"
  on public.contract_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete own comments"
  on public.contract_comments for delete
  using (auth.uid() = user_id);

-- Contract owner can delete any comment on their contracts
create policy "Owners can delete comments on their contracts"
  on public.contract_comments for delete
  using (
    exists (
      select 1 from public.contracts
      where contracts.id = contract_comments.contract_id
      and contracts.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTION: Notify on new comment
-- ============================================
create or replace function public.handle_new_comment()
returns trigger as $$
declare
  contract_owner_id uuid;
  commenter_name text;
  contract_title text;
  recipient_id uuid;
begin
  -- Get contract owner and title
  select user_id, title into contract_owner_id, contract_title
  from public.contracts
  where id = new.contract_id;

  -- Get commenter name
  select full_name into commenter_name
  from public.profiles
  where id = new.user_id;

  -- If commenter is NOT the owner, notify the owner
  if new.user_id != contract_owner_id then
    insert into public.notifications (user_id, type, title, message, contract_id, from_user_id)
    values (
      contract_owner_id,
      'comment_added',
      'New comment on your contract',
      coalesce(commenter_name, 'Someone') || ' commented on "' || coalesce(contract_title, 'your contract') || '"',
      new.contract_id,
      new.user_id
    );
  end if;

  -- Notify other participants (shared users who have commented)
  for recipient_id in
    select distinct cc.user_id
    from public.contract_comments cc
    where cc.contract_id = new.contract_id
    and cc.user_id != new.user_id
    and cc.user_id != contract_owner_id
  loop
    insert into public.notifications (user_id, type, title, message, contract_id, from_user_id)
    values (
      recipient_id,
      'comment_added',
      'New comment on shared contract',
      coalesce(commenter_name, 'Someone') || ' replied on "' || coalesce(contract_title, 'a contract') || '"',
      new.contract_id,
      new.user_id
    );
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new comments
create trigger on_comment_created
  after insert on public.contract_comments
  for each row execute procedure public.handle_new_comment();

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_contract_comments_contract_id on public.contract_comments(contract_id);
create index if not exists idx_contract_comments_user_id on public.contract_comments(user_id);
create index if not exists idx_contract_comments_parent_id on public.contract_comments(parent_id);
create index if not exists idx_contract_comments_created_at on public.contract_comments(contract_id, created_at);
