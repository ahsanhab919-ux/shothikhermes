drop policy if exists "chat_messages_delete_own" on public.chat_messages;
drop policy if exists "chat_messages_update_own" on public.chat_messages;
drop policy if exists "chat_messages_insert_own" on public.chat_messages;
drop policy if exists "chat_messages_select_own" on public.chat_messages;
drop policy if exists "chat_conversations_delete_own" on public.chat_conversations;
drop policy if exists "chat_conversations_update_own" on public.chat_conversations;
drop policy if exists "chat_conversations_insert_own" on public.chat_conversations;
drop policy if exists "chat_conversations_select_own" on public.chat_conversations;

alter table public.chat_messages
  drop constraint if exists chat_messages_user_id_fkey;

alter table public.chat_conversations
  drop constraint if exists chat_conversations_user_id_fkey;

alter table public.chat_conversations
  alter column user_id type text using user_id::text;

alter table public.chat_messages
  alter column user_id type text using user_id::text;

create policy "chat_conversations_select_own"
on public.chat_conversations
for select
to authenticated
using (user_id = auth.uid()::text);

create policy "chat_conversations_insert_own"
on public.chat_conversations
for insert
to authenticated
with check (user_id = auth.uid()::text);

create policy "chat_conversations_update_own"
on public.chat_conversations
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy "chat_conversations_delete_own"
on public.chat_conversations
for delete
to authenticated
using (user_id = auth.uid()::text);

create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using (
  user_id = auth.uid()::text
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()::text
  )
);

create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check (
  user_id = auth.uid()::text
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()::text
  )
);

create policy "chat_messages_update_own"
on public.chat_messages
for update
to authenticated
using (
  user_id = auth.uid()::text
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()::text
  )
)
with check (
  user_id = auth.uid()::text
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()::text
  )
);

create policy "chat_messages_delete_own"
on public.chat_messages
for delete
to authenticated
using (
  user_id = auth.uid()::text
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()::text
  )
);
