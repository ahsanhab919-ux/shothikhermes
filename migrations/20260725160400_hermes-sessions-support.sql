-- Hermes Sessions Table
-- Migration: 20260725160400_hermes-sessions-support.sql
-- Adds session support to the Hermes backend infrastructure

-- Hermes Sessions
create table if not exists public.hermes_sessions (
  id text primary key,
  "workspaceId" text not null references public.hermes_workspaces(id) on delete cascade,
  "userId" text not null,
  title text not null,
  description text,
  status text not null check (status in ('active', 'paused', 'archived', 'expired')),
  settings jsonb not null default '{}',
  metadata jsonb not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "lastActiveAt" timestamptz not null default now(),
  "expiresAt" timestamptz
);

-- Create indexes for performance
create index if not exists idx_hermes_sessions_workspace_id on public.hermes_sessions("workspaceId");
create index if not exists idx_hermes_sessions_user_id on public.hermes_sessions("userId");
create index if not exists idx_hermes_sessions_status on public.hermes_sessions(status);
create index if not exists idx_hermes_sessions_last_active_at on public.hermes_sessions("lastActiveAt");
create index if not exists idx_hermes_sessions_expires_at on public.hermes_sessions("expiresAt");

-- Enable RLS (Row Level Security) for multi-tenant safety
alter table public.hermes_sessions enable row level security;

-- RLS policies for sessions (users can only access sessions in their workspaces)
create policy "Users can view own sessions" on public.hermes_sessions
  for select using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_sessions."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can insert own sessions" on public.hermes_sessions
  for insert with check (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_sessions."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can update own sessions" on public.hermes_sessions
  for update using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_sessions."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

-- Grant necessary permissions to authenticated users
grant select, insert, update, delete on public.hermes_sessions to authenticated;

-- Update hermes_runs table to make sessionId reference the new sessions table
-- Note: We need to be careful with existing data, so we'll add the foreign key constraint conditionally

-- Add foreign key constraint for sessionId if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where table_name = 'hermes_runs' 
    and constraint_type = 'FOREIGN KEY' 
    and constraint_name = 'hermes_runs_sessionId_fkey'
  ) then
    alter table public.hermes_runs 
    add constraint hermes_runs_sessionId_fkey 
    foreign key ("sessionId") references public.hermes_sessions(id) on delete set null;
  end if;
end$$;

-- Comments for documentation
comment on table public.hermes_sessions is 'User sessions for organizing Hermes conversations and run sequences';
comment on column public.hermes_sessions."lastActiveAt" is 'Timestamp of last session activity for timeout management';
comment on column public.hermes_sessions."expiresAt" is 'Optional session expiration time for cleanup';