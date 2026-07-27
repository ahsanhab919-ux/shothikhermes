-- Hermes Backend Infrastructure Tables
-- Migration: 20260725080000_hermes-backend-infrastructure.sql

-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- Hermes Workspaces
create table if not exists public.hermes_workspaces (
  id text primary key,
  "userId" text not null,
  title text not null,
  description text,
  settings jsonb not null default '{}',
  metadata jsonb not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Hermes Runs
create table if not exists public.hermes_runs (
  id text primary key,
  "workspaceId" text not null references public.hermes_workspaces(id) on delete cascade,
  "userId" text not null,
  domain text not null check (domain in ('slides', 'sheets', 'research', 'writing', 'books', 'ai-detector', 'plagiarism', 'publish')),
  status text not null check (status in ('created', 'planning', 'running', 'paused', 'resumed', 'completed', 'failed', 'cancelled')),
  config jsonb not null default '{}',
  metadata jsonb not null default '{}',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "completedAt" timestamptz
);

-- Hermes Artifacts
create table if not exists public.hermes_artifacts (
  id text primary key,
  "workspaceId" text not null references public.hermes_workspaces(id) on delete cascade,
  "runId" text not null references public.hermes_runs(id) on delete cascade,
  "userId" text not null,
  domain text not null check (domain in ('slides', 'sheets', 'research', 'writing', 'books', 'ai-detector', 'plagiarism', 'publish')),
  status text not null check (status in ('initializing', 'generating', 'ready', 'updating', 'versioned', 'archived')),
  title text not null,
  description text,
  content jsonb not null default '{}',
  metadata jsonb not null default '{}',
  version integer not null default 1,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Hermes Events (for persistence and replay)
create table if not exists public.hermes_events (
  "eventId" uuid primary key default uuid_generate_v4(),
  "runId" text not null references public.hermes_runs(id) on delete cascade,
  "workspaceId" text not null references public.hermes_workspaces(id) on delete cascade,
  "artifactId" text references public.hermes_artifacts(id) on delete cascade,
  domain text not null,
  "eventType" text not null,
  timestamp timestamptz not null default now(),
  sequence bigserial,
  payload jsonb not null default '{}',
  metadata jsonb not null default '{}'
);

-- Hermes Tool Calls (for debugging and audit)
create table if not exists public.hermes_tool_calls (
  id text primary key,
  "runId" text not null references public.hermes_runs(id) on delete cascade,
  "toolName" text not null,
  input jsonb not null default '{}',
  result jsonb,
  error text,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  "startedAt" timestamptz not null default now(),
  "completedAt" timestamptz
);

-- Create indexes for performance
create index if not exists idx_hermes_workspaces_user_id on public.hermes_workspaces("userId");
create index if not exists idx_hermes_workspaces_updated_at on public.hermes_workspaces("updatedAt");

create index if not exists idx_hermes_runs_workspace_id on public.hermes_runs("workspaceId");
create index if not exists idx_hermes_runs_user_id on public.hermes_runs("userId");
create index if not exists idx_hermes_runs_domain on public.hermes_runs(domain);
create index if not exists idx_hermes_runs_status on public.hermes_runs(status);
create index if not exists idx_hermes_runs_created_at on public.hermes_runs("createdAt");

create index if not exists idx_hermes_artifacts_workspace_id on public.hermes_artifacts("workspaceId");
create index if not exists idx_hermes_artifacts_run_id on public.hermes_artifacts("runId");
create index if not exists idx_hermes_artifacts_user_id on public.hermes_artifacts("userId");
create index if not exists idx_hermes_artifacts_domain on public.hermes_artifacts(domain);
create index if not exists idx_hermes_artifacts_status on public.hermes_artifacts(status);

create index if not exists idx_hermes_events_run_id on public.hermes_events("runId");
create index if not exists idx_hermes_events_workspace_id on public.hermes_events("workspaceId");
create index if not exists idx_hermes_events_sequence on public.hermes_events(sequence);
create index if not exists idx_hermes_events_timestamp on public.hermes_events(timestamp);
create index if not exists idx_hermes_events_event_type on public.hermes_events("eventType");

create index if not exists idx_hermes_tool_calls_run_id on public.hermes_tool_calls("runId");
create index if not exists idx_hermes_tool_calls_tool_name on public.hermes_tool_calls("toolName");
create index if not exists idx_hermes_tool_calls_status on public.hermes_tool_calls(status);

-- Enable RLS (Row Level Security) for multi-tenant safety
alter table public.hermes_workspaces enable row level security;
alter table public.hermes_runs enable row level security;
alter table public.hermes_artifacts enable row level security;
alter table public.hermes_events enable row level security;
alter table public.hermes_tool_calls enable row level security;

-- RLS policies for workspaces (users can only access their own workspaces)
create policy "Users can view own workspaces" on public.hermes_workspaces
  for select using (auth.uid()::text = "userId");

create policy "Users can insert own workspaces" on public.hermes_workspaces
  for insert with check (auth.uid()::text = "userId");

create policy "Users can update own workspaces" on public.hermes_workspaces
  for update using (auth.uid()::text = "userId");

create policy "Users can delete own workspaces" on public.hermes_workspaces
  for delete using (auth.uid()::text = "userId");

-- RLS policies for runs (users can only access runs in their workspaces)
create policy "Users can view own runs" on public.hermes_runs
  for select using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_runs."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can insert own runs" on public.hermes_runs
  for insert with check (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_runs."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can update own runs" on public.hermes_runs
  for update using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_runs."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

-- RLS policies for artifacts (users can only access artifacts in their workspaces)
create policy "Users can view own artifacts" on public.hermes_artifacts
  for select using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_artifacts."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can insert own artifacts" on public.hermes_artifacts
  for insert with check (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_artifacts."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can update own artifacts" on public.hermes_artifacts
  for update using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_artifacts."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

-- RLS policies for events (users can only access events in their workspaces)  
create policy "Users can view own events" on public.hermes_events
  for select using (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_events."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can insert own events" on public.hermes_events
  for insert with check (
    exists (
      select 1 from public.hermes_workspaces w 
      where w.id = hermes_events."workspaceId" 
      and w."userId" = auth.uid()::text
    )
  );

-- RLS policies for tool calls (users can only access tool calls in their runs)
create policy "Users can view own tool calls" on public.hermes_tool_calls
  for select using (
    exists (
      select 1 from public.hermes_runs r
      join public.hermes_workspaces w on w.id = r."workspaceId"
      where r.id = hermes_tool_calls."runId" 
      and w."userId" = auth.uid()::text
    )
  );

create policy "Users can insert own tool calls" on public.hermes_tool_calls
  for insert with check (
    exists (
      select 1 from public.hermes_runs r
      join public.hermes_workspaces w on w.id = r."workspaceId"
      where r.id = hermes_tool_calls."runId" 
      and w."userId" = auth.uid()::text
    )
  );

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Comments for documentation
comment on table public.hermes_workspaces is 'User workspaces for organizing Hermes runs and artifacts';
comment on table public.hermes_runs is 'Individual Hermes execution runs within workspaces';
comment on table public.hermes_artifacts is 'Persistent artifacts created by Hermes runs';
comment on table public.hermes_events is 'Event log for runs, used for streaming and replay';
comment on table public.hermes_tool_calls is 'Tool invocation audit log for debugging and monitoring';