-- Chat History Tables
-- Adds persistent chat conversations and messages

-- Chat conversations table
create table if not exists public.chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  content text not null,
  is_from_user boolean not null,
  message_type text default 'text' check (message_type in ('text', 'file', 'analysis')),
  file_name text,
  analysis jsonb,
  attached_contract_ids uuid[],
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_chat_conversations_user_id on public.chat_conversations(user_id);
create index if not exists idx_chat_conversations_updated_at on public.chat_conversations(updated_at desc);
create index if not exists idx_chat_messages_conversation_id on public.chat_messages(conversation_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

-- Enable Row Level Security
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- Chat conversations policies
create policy "Users can view own conversations"
  on public.chat_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.chat_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.chat_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.chat_conversations for delete
  using (auth.uid() = user_id);

-- Chat messages policies (through conversation ownership)
create policy "Users can view messages in own conversations"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_conversations
      where id = conversation_id and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in own conversations"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.chat_conversations
      where id = conversation_id and user_id = auth.uid()
    )
  );

create policy "Users can delete messages in own conversations"
  on public.chat_messages for delete
  using (
    exists (
      select 1 from public.chat_conversations
      where id = conversation_id and user_id = auth.uid()
    )
  );

-- Function to update conversation updated_at when new message is added
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update public.chat_conversations
  set updated_at = now()
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql;

-- Trigger to auto-update conversation timestamp
drop trigger if exists on_chat_message_insert on public.chat_messages;
create trigger on_chat_message_insert
  after insert on public.chat_messages
  for each row
  execute function update_conversation_timestamp();
