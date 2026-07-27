/**
 * Hermes Infrastructure - Database Layer
 * 
 * Provides typed access to the PostgreSQL backend through the existing
 * insforgeQuery infrastructure used by the project.
 */

import { insforgeQuery } from "@/lib/insforge-db";
import logger from "@/lib/logger";
import type { QueryResultRow } from "pg";
import type { 
  HermesRun, 
  HermesArtifact, 
  HermesWorkspace,
  HermesSession,
  HermesEventEnvelope,
  RunId,
  WorkspaceId,
  ArtifactId,
  SessionId,
  UserId 
} from "../contracts/core";

// The checked-in SQL migrations currently mix Supabase-style auth policies with
// a schema shape that does not fully match the runtime inserts. For the local
// Postgres-backed Hermes runtime we bootstrap the minimal table set directly so
// chat sends do not fail on missing relations.
const HERMES_SCHEMA_BOOTSTRAP_SQL = `
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

create table if not exists public.hermes_runs (
  id text primary key,
  "sessionId" text,
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

alter table public.hermes_runs add column if not exists "sessionId" text;
alter table public.hermes_runs add column if not exists "completedAt" timestamptz;

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

create table if not exists public.hermes_events (
  "eventId" uuid primary key,
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

create index if not exists idx_hermes_workspaces_user_id on public.hermes_workspaces("userId");
create index if not exists idx_hermes_workspaces_updated_at on public.hermes_workspaces("updatedAt");
create index if not exists idx_hermes_sessions_workspace_id on public.hermes_sessions("workspaceId");
create index if not exists idx_hermes_sessions_user_id on public.hermes_sessions("userId");
create index if not exists idx_hermes_runs_workspace_id on public.hermes_runs("workspaceId");
create index if not exists idx_hermes_runs_user_id on public.hermes_runs("userId");
create index if not exists idx_hermes_artifacts_workspace_id on public.hermes_artifacts("workspaceId");
create index if not exists idx_hermes_artifacts_run_id on public.hermes_artifacts("runId");
create index if not exists idx_hermes_events_run_id on public.hermes_events("runId");
create index if not exists idx_hermes_tool_calls_run_id on public.hermes_tool_calls("runId");

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hermes_runs'
      and column_name = 'sessionId'
  ) and exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'hermes_sessions'
  ) and not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'hermes_runs'
      and constraint_name = 'hermes_runs_sessionId_fkey'
  ) then
    alter table public.hermes_runs
      add constraint hermes_runs_sessionId_fkey
      foreign key ("sessionId") references public.hermes_sessions(id) on delete set null;
  end if;
end$$;
`;

let hermesSchemaReadyPromise: Promise<void> | null = null;

async function ensureHermesSchema() {
  if (!hermesSchemaReadyPromise) {
    hermesSchemaReadyPromise = (async () => {
      try {
        await insforgeQuery(HERMES_SCHEMA_BOOTSTRAP_SQL);
        logger.info("[hermes-db] Hermes schema bootstrap ready");
      } catch (error) {
        hermesSchemaReadyPromise = null;
        logger.error("[hermes-db] Hermes schema bootstrap failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    })();
  }

  await hermesSchemaReadyPromise;
}

async function hermesQuery<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  await ensureHermesSchema();
  return insforgeQuery<T>(text, params);
}

/**
 * Database client using the project's PostgreSQL infrastructure
 */
export class HermesDatabase {

  /**
   * Run Management
   */
  async createRun(run: Omit<HermesRun, 'createdAt' | 'updatedAt'>): Promise<HermesRun> {
    const now = new Date().toISOString();
    const fullRun = {
      ...run,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await hermesQuery<HermesRun>(
        `INSERT INTO hermes_runs (
          id, "sessionId", "workspaceId", "userId", domain, status, config, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          fullRun.id,
          fullRun.sessionId || null,
          fullRun.workspaceId,
          fullRun.userId,
          fullRun.domain,
          fullRun.status,
          JSON.stringify(fullRun.config),
          JSON.stringify(fullRun.metadata),
          fullRun.createdAt,
          fullRun.updatedAt
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create run - no rows returned');
      }

      const createdRun = result.rows[0];
      logger.info('[hermes-db] Run created', { runId: run.id, domain: run.domain });
      return createdRun;
    } catch (error) {
      logger.error('[hermes-db] Failed to create run', { 
        runId: run.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getRun(runId: RunId): Promise<HermesRun | null> {
    try {
      const result = await hermesQuery<HermesRun>(
        `SELECT * FROM hermes_runs WHERE id = $1`,
        [runId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('[hermes-db] Failed to get run', { 
        runId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async updateRunStatus(runId: RunId, status: HermesRun['status'], metadata?: Record<string, unknown>): Promise<void> {
    const now = new Date().toISOString();
    const completedAt = (status === 'completed' || status === 'failed' || status === 'cancelled') ? now : null;

    try {
      await hermesQuery(
        `UPDATE hermes_runs 
         SET status = $2, "updatedAt" = $3, "completedAt" = $4, metadata = $5
         WHERE id = $1`,
        [
          runId,
          status,
          now,
          completedAt,
          metadata ? JSON.stringify(metadata) : null
        ]
      );

      logger.info('[hermes-db] Run status updated', { runId, status });
    } catch (error) {
      logger.error('[hermes-db] Failed to update run status', { 
        runId, 
        status,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Session Management
   */
  async createSession(session: Omit<HermesSession, 'createdAt' | 'updatedAt' | 'lastActiveAt'>): Promise<HermesSession> {
    const now = new Date().toISOString();
    const fullSession = {
      ...session,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };

    try {
      const result = await hermesQuery<HermesSession>(
        `INSERT INTO hermes_sessions (
          id, "workspaceId", "userId", title, description, status, settings, metadata, 
          "createdAt", "updatedAt", "lastActiveAt", "expiresAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *`,
        [
          fullSession.id,
          fullSession.workspaceId,
          fullSession.userId,
          fullSession.title,
          fullSession.description || null,
          fullSession.status,
          JSON.stringify(fullSession.settings),
          JSON.stringify(fullSession.metadata),
          fullSession.createdAt,
          fullSession.updatedAt,
          fullSession.lastActiveAt,
          fullSession.expiresAt || null
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create session - no rows returned');
      }

      const createdSession = result.rows[0];
      logger.info('[hermes-db] Session created', { sessionId: session.id, workspaceId: session.workspaceId });
      return createdSession;
    } catch (error) {
      logger.error('[hermes-db] Failed to create session', { 
        sessionId: session.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getSession(sessionId: SessionId): Promise<HermesSession | null> {
    try {
      const result = await hermesQuery<HermesSession>(
        `SELECT * FROM hermes_sessions WHERE id = $1`,
        [sessionId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('[hermes-db] Failed to get session', { 
        sessionId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async updateSessionLastActive(sessionId: SessionId): Promise<void> {
    const now = new Date().toISOString();

    try {
      await hermesQuery(
        `UPDATE hermes_sessions 
         SET "lastActiveAt" = $2, "updatedAt" = $2
         WHERE id = $1`,
        [sessionId, now]
      );

      logger.debug('[hermes-db] Session activity updated', { sessionId });
    } catch (error) {
      logger.error('[hermes-db] Failed to update session activity', { 
        sessionId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async updateSessionStatus(sessionId: SessionId, status: HermesSession['status']): Promise<void> {
    const now = new Date().toISOString();

    try {
      await hermesQuery(
        `UPDATE hermes_sessions 
         SET status = $2, "updatedAt" = $3
         WHERE id = $1`,
        [sessionId, status, now]
      );

      logger.info('[hermes-db] Session status updated', { sessionId, status });
    } catch (error) {
      logger.error('[hermes-db] Failed to update session status', { 
        sessionId, 
        status,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getWorkspaceSessions(
    workspaceId: WorkspaceId, 
    limit: number = 50, 
    offset: number = 0,
    status?: HermesSession['status']
  ): Promise<HermesSession[]> {
    try {
      let query = `
        SELECT * FROM hermes_sessions 
        WHERE "workspaceId" = $1
      `;
      const params: any[] = [workspaceId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY "lastActiveAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await hermesQuery<HermesSession>(query, params);
      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get workspace sessions', { 
        workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getUserSessions(
    userId: UserId, 
    limit: number = 50, 
    offset: number = 0,
    status?: HermesSession['status']
  ): Promise<HermesSession[]> {
    try {
      let query = `
        SELECT * FROM hermes_sessions 
        WHERE "userId" = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY "lastActiveAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await hermesQuery<HermesSession>(query, params);
      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get user sessions', { 
        userId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getSessionRuns(sessionId: SessionId, limit: number = 50): Promise<HermesRun[]> {
    try {
      const result = await hermesQuery<HermesRun>(
        `SELECT * FROM hermes_runs 
         WHERE "sessionId" = $1 
         ORDER BY "createdAt" DESC 
         LIMIT $2`,
        [sessionId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get session runs', { 
        sessionId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Workspace Management
   */
  async createWorkspace(workspace: Omit<HermesWorkspace, 'createdAt' | 'updatedAt'>): Promise<HermesWorkspace> {
    const now = new Date().toISOString();

    try {
      const result = await hermesQuery<HermesWorkspace>(
        `INSERT INTO hermes_workspaces (
          id, "userId", title, description, settings, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          workspace.id,
          workspace.userId,
          workspace.title,
          workspace.description || null,
          JSON.stringify(workspace.settings),
          JSON.stringify(workspace.metadata),
          now,
          now
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create workspace - no rows returned');
      }

      const createdWorkspace = result.rows[0];
      logger.info('[hermes-db] Workspace created', { workspaceId: workspace.id, userId: workspace.userId });
      return createdWorkspace;
    } catch (error) {
      logger.error('[hermes-db] Failed to create workspace', { 
        workspaceId: workspace.id,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getWorkspace(workspaceId: WorkspaceId): Promise<HermesWorkspace | null> {
    try {
      const result = await hermesQuery<HermesWorkspace>(
        `SELECT * FROM hermes_workspaces WHERE id = $1`,
        [workspaceId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('[hermes-db] Failed to get workspace', { 
        workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getUserWorkspaces(userId: UserId, limit: number = 50): Promise<HermesWorkspace[]> {
    try {
      const result = await hermesQuery<HermesWorkspace>(
        `SELECT * FROM hermes_workspaces 
         WHERE "userId" = $1 
         ORDER BY "updatedAt" DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get user workspaces', { 
        userId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async updateWorkspace(
    workspaceId: WorkspaceId, 
    updates: Partial<Omit<HermesWorkspace, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const now = new Date().toISOString();

    try {
      const setParts: string[] = [];
      const values: any[] = [workspaceId];
      let paramIndex = 2;

      if (updates.title !== undefined) {
        setParts.push(`title = $${paramIndex++}`);
        values.push(updates.title);
      }

      if (updates.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }

      if (updates.settings !== undefined) {
        setParts.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(updates.settings));
      }

      if (updates.metadata !== undefined) {
        setParts.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(updates.metadata));
      }

      setParts.push(`"updatedAt" = $${paramIndex++}`);
      values.push(now);

      if (setParts.length === 1) {
        return; // Only updatedAt would be set, so skip the update
      }

      await hermesQuery(
        `UPDATE hermes_workspaces SET ${setParts.join(', ')} WHERE id = $1`,
        values
      );

      logger.info('[hermes-db] Workspace updated', { workspaceId });
    } catch (error) {
      logger.error('[hermes-db] Failed to update workspace', { 
        workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Artifact Management
   */
  async createArtifact(artifact: Omit<HermesArtifact, 'createdAt' | 'updatedAt'>): Promise<HermesArtifact> {
    const now = new Date().toISOString();

    try {
      const result = await hermesQuery<HermesArtifact>(
        `INSERT INTO hermes_artifacts (
          id, "workspaceId", "runId", "userId", domain, status, title, description, 
          content, metadata, version, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *`,
        [
          artifact.id,
          artifact.workspaceId,
          artifact.runId,
          artifact.userId,
          artifact.domain,
          artifact.status,
          artifact.title,
          artifact.description || null,
          JSON.stringify(artifact.content),
          JSON.stringify(artifact.metadata),
          artifact.version,
          now,
          now
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create artifact - no rows returned');
      }

      const createdArtifact = result.rows[0];
      logger.info('[hermes-db] Artifact created', { 
        artifactId: artifact.id, 
        domain: artifact.domain,
        runId: artifact.runId 
      });
      return createdArtifact;
    } catch (error) {
      logger.error('[hermes-db] Failed to create artifact', { 
        artifactId: artifact.id,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getArtifact(artifactId: ArtifactId): Promise<HermesArtifact | null> {
    try {
      const result = await hermesQuery<HermesArtifact>(
        `SELECT * FROM hermes_artifacts WHERE id = $1`,
        [artifactId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('[hermes-db] Failed to get artifact', { 
        artifactId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async updateArtifact(
    artifactId: ArtifactId, 
    updates: Partial<Omit<HermesArtifact, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const now = new Date().toISOString();

    try {
      const setParts: string[] = [];
      const values: any[] = [artifactId];
      let paramIndex = 2;

      if (updates.status !== undefined) {
        setParts.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      if (updates.title !== undefined) {
        setParts.push(`title = $${paramIndex++}`);
        values.push(updates.title);
      }

      if (updates.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }

      if (updates.content !== undefined) {
        setParts.push(`content = $${paramIndex++}`);
        values.push(JSON.stringify(updates.content));
      }

      if (updates.metadata !== undefined) {
        setParts.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(updates.metadata));
      }

      if (updates.version !== undefined) {
        setParts.push(`version = $${paramIndex++}`);
        values.push(updates.version);
      }

      setParts.push(`"updatedAt" = $${paramIndex++}`);
      values.push(now);

      if (setParts.length === 1) {
        return; // Only updatedAt would be set, so skip the update
      }

      await hermesQuery(
        `UPDATE hermes_artifacts SET ${setParts.join(', ')} WHERE id = $1`,
        values
      );

      logger.info('[hermes-db] Artifact updated', { artifactId });
    } catch (error) {
      logger.error('[hermes-db] Failed to update artifact', { 
        artifactId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Event Management
   */
  async appendEvent(event: HermesEventEnvelope): Promise<void> {
    try {
      await hermesQuery(
        `INSERT INTO hermes_events (
          "eventId", "runId", "workspaceId", "artifactId", domain, "eventType", 
          timestamp, payload, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          event.eventId,
          event.runId,
          event.workspaceId,
          event.artifactId || null,
          event.domain,
          event.eventType,
          event.timestamp,
          JSON.stringify(event.payload),
          JSON.stringify(event.metadata)
        ]
      );

      logger.debug('[hermes-db] Event appended', { 
        eventId: event.eventId, 
        eventType: event.eventType,
        runId: event.runId 
      });
    } catch (error) {
      logger.error('[hermes-db] Failed to append event', { 
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getRunEvents(runId: RunId, limit: number = 100): Promise<HermesEventEnvelope[]> {
    try {
      const result = await hermesQuery<HermesEventEnvelope>(
        `SELECT * FROM hermes_events 
         WHERE "runId" = $1 
         ORDER BY sequence ASC 
         LIMIT $2`,
        [runId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get run events', { 
        runId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getWorkspaceRuns(
    workspaceId: WorkspaceId, 
    limit: number = 50, 
    offset: number = 0,
    status?: HermesRun['status']
  ): Promise<HermesRun[]> {
    try {
      let query = `
        SELECT * FROM hermes_runs 
        WHERE "workspaceId" = $1
      `;
      const params: any[] = [workspaceId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await hermesQuery<HermesRun>(query, params);
      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get workspace runs', { 
        workspaceId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  async getUserRuns(
    userId: UserId, 
    limit: number = 50, 
    offset: number = 0,
    status?: HermesRun['status']
  ): Promise<HermesRun[]> {
    try {
      let query = `
        SELECT * FROM hermes_runs 
        WHERE "userId" = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ` ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await hermesQuery<HermesRun>(query, params);
      return result.rows;
    } catch (error) {
      logger.error('[hermes-db] Failed to get user runs', { 
        userId,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
}

// Singleton instance
let dbInstance: HermesDatabase | null = null;

export function getHermesDatabase(): HermesDatabase {
  if (!dbInstance) {
    dbInstance = new HermesDatabase();
  }
  return dbInstance;
}
