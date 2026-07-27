create extension if not exists pgcrypto;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null check (
    surface in ('flagship', 'writing-studio', 'sheet', 'research', 'book-agent')
  ),
  title text not null default 'New chat',
  status text not null default 'active' check (
    status in ('active', 'archived', 'deleted')
  ),
  pinned boolean not null default false,
  temporary boolean not null default false,
  model_handle text,
  context_ref jsonb,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  message_count integer not null default 0 check (message_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (
    role in ('system', 'user', 'assistant', 'tool')
  ),
  content text not null default '',
  content_format text not null default 'plain' check (
    content_format in ('markdown', 'plain')
  ),
  status text not null default 'completed' check (
    status in ('streaming', 'completed', 'stopped', 'error')
  ),
  model_handle text,
  parent_message_id uuid references public.chat_messages (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_idx
  on public.chat_conversations (user_id);
create index if not exists chat_conversations_user_updated_idx
  on public.chat_conversations (user_id, updated_at desc);
create index if not exists chat_conversations_user_surface_idx
  on public.chat_conversations (user_id, surface);
create index if not exists chat_conversations_user_status_idx
  on public.chat_conversations (user_id, status);
create index if not exists chat_conversations_user_pinned_idx
  on public.chat_conversations (user_id, pinned);

create index if not exists chat_messages_conversation_idx
  on public.chat_messages (conversation_id);
create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at);
create index if not exists chat_messages_user_idx
  on public.chat_messages (user_id);

create or replace function public.sync_chat_conversation_stats(target_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  last_row record;
  total_count integer;
begin
  select count(*)::integer
    into total_count
  from public.chat_messages
  where conversation_id = target_conversation_id;

  select
    content,
    model_handle,
    coalesce(updated_at, created_at) as effective_message_at
    into last_row
  from public.chat_messages
  where conversation_id = target_conversation_id
  order by created_at desc, updated_at desc, id desc
  limit 1;

  update public.chat_conversations
  set
    message_count = coalesce(total_count, 0),
    last_message_preview = case
      when last_row.content is null then null
      when btrim(regexp_replace(last_row.content, '\s+', ' ', 'g')) = '' then null
      else left(regexp_replace(last_row.content, '\s+', ' ', 'g'), 240)
    end,
    last_message_at = coalesce(last_row.effective_message_at, created_at),
    model_handle = coalesce(last_row.model_handle, model_handle)
  where id = target_conversation_id;
end;
$$;

create or replace function public.sync_chat_conversation_stats_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_chat_conversation_stats(old.conversation_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and new.conversation_id is distinct from old.conversation_id then
    perform public.sync_chat_conversation_stats(old.conversation_id);
  end if;

  perform public.sync_chat_conversation_stats(new.conversation_id);
  return new;
end;
$$;

drop trigger if exists chat_conversations_set_updated_at on public.chat_conversations;
create trigger chat_conversations_set_updated_at
before update on public.chat_conversations
for each row
execute function public.set_row_updated_at();

drop trigger if exists chat_messages_set_updated_at on public.chat_messages;
create trigger chat_messages_set_updated_at
before update on public.chat_messages
for each row
execute function public.set_row_updated_at();

drop trigger if exists chat_messages_sync_conversation_stats on public.chat_messages;
create trigger chat_messages_sync_conversation_stats
after insert or update or delete on public.chat_messages
for each row
execute function public.sync_chat_conversation_stats_trigger();

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_conversations_select_own" on public.chat_conversations;
create policy "chat_conversations_select_own"
on public.chat_conversations
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "chat_conversations_insert_own" on public.chat_conversations;
create policy "chat_conversations_insert_own"
on public.chat_conversations
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "chat_conversations_update_own" on public.chat_conversations;
create policy "chat_conversations_update_own"
on public.chat_conversations
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "chat_conversations_delete_own" on public.chat_conversations;
create policy "chat_conversations_delete_own"
on public.chat_conversations
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own"
on public.chat_messages
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
on public.chat_messages
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
);
