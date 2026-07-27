do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_conversations'
      and column_name = 'user_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_conversations'
      and column_name = 'legacy_user_id'
  ) then
    alter table public.chat_conversations
      rename column user_id to legacy_user_id;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_messages'
      and column_name = 'user_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_messages'
      and column_name = 'legacy_user_id'
  ) then
    alter table public.chat_messages
      rename column user_id to legacy_user_id;
  end if;
end
$$;

alter table public.chat_conversations
  add column if not exists legacy_user_id text,
  add column if not exists auth_user_id uuid references auth.users (id) on delete cascade;

alter table public.chat_messages
  add column if not exists legacy_user_id text,
  add column if not exists auth_user_id uuid references auth.users (id) on delete cascade;

update public.chat_conversations c
set auth_user_id = u.id
from auth.users u
where c.auth_user_id is null
  and c.legacy_user_id is not null
  and c.legacy_user_id = u.id::text;

update public.chat_messages m
set auth_user_id = u.id
from auth.users u
where m.auth_user_id is null
  and m.legacy_user_id is not null
  and m.legacy_user_id = u.id::text;

update public.chat_messages m
set auth_user_id = c.auth_user_id
from public.chat_conversations c
where m.auth_user_id is null
  and m.conversation_id = c.id
  and c.auth_user_id is not null;

alter table public.chat_conversations
  drop constraint if exists chat_conversations_owner_present;

alter table public.chat_conversations
  add constraint chat_conversations_owner_present
  check (auth_user_id is not null or legacy_user_id is not null);

alter table public.chat_messages
  drop constraint if exists chat_messages_owner_present;

alter table public.chat_messages
  add constraint chat_messages_owner_present
  check (auth_user_id is not null or legacy_user_id is not null);

create or replace function public.sync_chat_message_owner_from_conversation()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
declare
  conversation_owner record;
begin
  select
    c.auth_user_id,
    c.legacy_user_id
    into conversation_owner
  from public.chat_conversations c
  where c.id = new.conversation_id;

  if not found then
    raise exception 'Conversation % not found for chat message owner sync', new.conversation_id;
  end if;

  if new.auth_user_id is null then
    new.auth_user_id = conversation_owner.auth_user_id;
  end if;

  if new.legacy_user_id is null then
    new.legacy_user_id = conversation_owner.legacy_user_id;
  end if;

  if conversation_owner.auth_user_id is not null
    and new.auth_user_id is distinct from conversation_owner.auth_user_id then
    raise exception 'Chat message owner must match conversation owner';
  end if;

  if coalesce(new.legacy_user_id, '') is distinct from coalesce(conversation_owner.legacy_user_id, '') then
    raise exception 'Chat message legacy owner must match conversation owner';
  end if;

  return new;
end;
$$;

drop trigger if exists chat_messages_sync_owner on public.chat_messages;
create trigger chat_messages_sync_owner
before insert or update on public.chat_messages
for each row
execute function public.sync_chat_message_owner_from_conversation();

create index if not exists chat_conversations_auth_user_idx
  on public.chat_conversations (auth_user_id)
  where auth_user_id is not null;

create index if not exists chat_conversations_auth_user_updated_idx
  on public.chat_conversations (auth_user_id, updated_at desc)
  where auth_user_id is not null;

create index if not exists chat_conversations_auth_user_surface_idx
  on public.chat_conversations (auth_user_id, surface)
  where auth_user_id is not null;

create index if not exists chat_conversations_auth_user_status_idx
  on public.chat_conversations (auth_user_id, status)
  where auth_user_id is not null;

create index if not exists chat_conversations_auth_user_pinned_idx
  on public.chat_conversations (auth_user_id, pinned)
  where auth_user_id is not null;

create index if not exists chat_messages_auth_user_idx
  on public.chat_messages (auth_user_id)
  where auth_user_id is not null;

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
drop policy if exists "chat_messages_update_own" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
drop policy if exists "chat_messages_select_own" on public.chat_messages;
drop policy if exists "chat_conversations_delete_own" on public.chat_conversations;
drop policy if exists "chat_conversations_update_own" on public.chat_conversations;
drop policy if exists "chat_conversations_insert_own" on public.chat_conversations;
drop policy if exists "chat_conversations_select_own" on public.chat_conversations;

create policy "chat_conversations_select_own"
on public.chat_conversations
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "chat_conversations_insert_own"
on public.chat_conversations
for insert
to authenticated
with check (auth_user_id = auth.uid());

create policy "chat_conversations_update_own"
on public.chat_conversations
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "chat_conversations_delete_own"
on public.chat_conversations
for delete
to authenticated
using (auth_user_id = auth.uid());

create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.auth_user_id = auth.uid()
  )
);

create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.auth_user_id = auth.uid()
  )
);

create policy "chat_messages_update_own"
on public.chat_messages
for update
to authenticated
using (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.auth_user_id = auth.uid()
  )
)
with check (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.auth_user_id = auth.uid()
  )
);

create policy "chat_messages_delete_own"
on public.chat_messages
for delete
to authenticated
using (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.auth_user_id = auth.uid()
  )
);
