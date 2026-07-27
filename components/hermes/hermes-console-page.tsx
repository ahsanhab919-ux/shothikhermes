'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CreateRunDialog, CreateSessionDialog } from '@/components/hermes/create-dialogs';
import { RunStream } from '@/components/hermes/run-stream';
import { SessionList } from '@/components/hermes/session-list';
import { useHermesSession } from '@/lib/hermes/hooks';
import type { RunId, SessionId, WorkspaceId } from '@/lib/hermes/contracts/core';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function HermesConsolePage() {
  const [workspaceIdInput, setWorkspaceIdInput] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<SessionId | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<RunId | null>(null);
  const [routeIdFilter, setRouteIdFilter] = useState('');
  const [sourcePathFilter, setSourcePathFilter] = useState('');
  const [targetServiceFilter, setTargetServiceFilter] = useState('');

  const workspaceId = useMemo(
    () => (workspaceIdInput.trim() ? (workspaceIdInput.trim() as WorkspaceId) : undefined),
    [workspaceIdInput],
  );

  const {
    data: sessionContext,
    isLoading: sessionLoading,
    error: sessionError,
  } = useHermesSession(selectedSessionId);

  const filteredRuns = useMemo(() => {
    if (!sessionContext) {
      return [];
    }

    return sessionContext.runs.filter((run) => {
      const routeMetadata = (run.metadata?.routeMetadata ?? {}) as Record<string, unknown>;
      const routeId = String(routeMetadata.routeId ?? '').toLowerCase();
      const sourcePath = String(routeMetadata.sourceRequestPath ?? '').toLowerCase();
      const targetService = String(routeMetadata.targetBackendService ?? '').toLowerCase();

      if (routeIdFilter.trim() && !routeId.includes(routeIdFilter.trim().toLowerCase())) {
        return false;
      }

      if (
        sourcePathFilter.trim() &&
        !sourcePath.includes(sourcePathFilter.trim().toLowerCase())
      ) {
        return false;
      }

      if (
        targetServiceFilter.trim() &&
        !targetService.includes(targetServiceFilter.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [routeIdFilter, sessionContext, sourcePathFilter, targetServiceFilter]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Hermes Console</CardTitle>
            <Badge variant="secondary">Preview</Badge>
          </div>
          <CardDescription>
            This is a dedicated browser surface for the Hermes runtime. It is separate from the current
            Gemini-backed chat page and uses the Hermes session and run APIs directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="workspace-id">
                Workspace ID
              </label>
              <Input
                id="workspace-id"
                placeholder="Enter a valid workspace ID to create sessions or runs"
                value={workspaceIdInput}
                onChange={(event) => setWorkspaceIdInput(event.target.value)}
              />
            </div>

            <CreateSessionDialog
              workspaceId={(workspaceId ?? '') as WorkspaceId}
              onSessionCreated={(sessionId) => setSelectedSessionId(sessionId as SessionId)}
              trigger={<Button disabled={!workspaceId}>New Hermes Session</Button>}
            />

            <CreateRunDialog
              workspaceId={(workspaceId ?? '') as WorkspaceId}
              sessionId={selectedSessionId ?? undefined}
              onRunCreated={(runId) => setSelectedRunId(runId as RunId)}
              trigger={<Button disabled={!workspaceId}>New Hermes Run</Button>}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Requires an authenticated chat user and a valid workspace owned by that user.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="min-h-[540px]">
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              Browse Hermes sessions and select one to inspect its runs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionList
              workspaceId={workspaceId}
              onSessionClick={(sessionId) => {
                setSelectedSessionId(sessionId as SessionId);
                setSelectedRunId(null);
              }}
            />
          </CardContent>
        </Card>

        <div className="flex min-h-[540px] flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Detail</CardTitle>
              <CardDescription>
                {selectedSessionId ? `Selected session: ${selectedSessionId}` : 'Choose a session to inspect runs.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedSessionId && (
                <div className="text-sm text-muted-foreground">
                  Select a session from the left panel to inspect Hermes run history.
                </div>
              )}

              {selectedSessionId && sessionLoading && (
                <div className="text-sm text-muted-foreground">Loading session context...</div>
              )}

              {selectedSessionId && sessionError && (
                <div className="text-sm text-destructive">
                  {sessionError instanceof Error ? sessionError.message : 'Failed to load session context'}
                </div>
              )}

              {sessionContext && (
                <>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">{sessionContext.session.title}</div>
                    {sessionContext.session.description && (
                      <p className="text-sm text-muted-foreground">{sessionContext.session.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{sessionContext.session.status}</Badge>
                    <span>Updated {formatDate(sessionContext.session.updatedAt)}</span>
                    <span>Active {formatDate(sessionContext.session.lastActiveAt)}</span>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Runs</div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="Filter by route ID"
                          value={routeIdFilter}
                          onChange={(event) => setRouteIdFilter(event.target.value)}
                        />
                        <Input
                          placeholder="Filter by source path"
                          value={sourcePathFilter}
                          onChange={(event) => setSourcePathFilter(event.target.value)}
                        />
                        <Input
                          placeholder="Filter by target service"
                          value={targetServiceFilter}
                          onChange={(event) => setTargetServiceFilter(event.target.value)}
                        />
                      </div>
                    </div>

                    {filteredRuns.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No runs matched the current route metadata filters.
                      </div>
                    )}

                    {filteredRuns.map((run) => {
                      const routeMetadata = (run.metadata?.routeMetadata ?? {}) as Record<string, unknown>;

                      return (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => setSelectedRunId(run.id as RunId)}
                        className={`flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors ${
                          selectedRunId === run.id ? 'border-primary bg-accent/50' : 'hover:bg-accent/30'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="font-medium">{run.domain}</div>
                          <Badge variant="secondary">{run.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{run.id}</div>
                        <div className="text-xs text-muted-foreground">
                          Created {formatDate(run.createdAt)}
                        </div>
                        {routeMetadata.routeId && (
                          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <Badge variant="outline">{String(routeMetadata.routeId)}</Badge>
                            {routeMetadata.sourceRequestPath ? (
                              <Badge variant="outline">{String(routeMetadata.sourceRequestPath)}</Badge>
                            ) : null}
                            {routeMetadata.targetBackendService ? (
                              <Badge variant="outline">{String(routeMetadata.targetBackendService)}</Badge>
                            ) : null}
                          </div>
                        )}
                      </button>
                    )})}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="min-h-[420px]">
            {selectedRunId ? (
              <RunStream runId={selectedRunId} />
            ) : (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Run Stream</CardTitle>
                  <CardDescription>
                    Select a run from the session detail panel to view Hermes stream events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  No run selected yet.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
