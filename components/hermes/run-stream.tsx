'use client';

/**
 * Run Stream Component
 * 
 * Real-time streaming display for Hermes runs.
 * Uses SSE from backend, no frontend orchestration logic.
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Pause, Play, Square } from 'lucide-react';
import { useHermesRun, useHermesRunStream, useControlHermesRun, type RunAction } from '@/lib/hermes/hooks';
import type { RunId, HermesRun } from '@/lib/hermes/contracts/core';

interface RunStreamEventItem {
  eventType: string;
  timestamp: string;
  sequence: number;
  payload: Record<string, unknown>;
  message?: string;
}

interface RunStreamProps {
  runId: RunId;
  autoScroll?: boolean;
}

function getStatusColor(status: HermesRun['status']) {
  switch (status) {
    case 'running':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    case 'paused':
      return 'bg-yellow-500';
    case 'cancelled':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString();
}

function RunStreamEvent({ event }: { event: RunStreamEventItem }) {
  return (
    <div className="py-2 border-b border-border/50 last:border-b-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground">
          {formatTimestamp(event.timestamp)}
        </span>
        <Badge variant="outline" className="text-xs">
          {event.eventType}
        </Badge>
      </div>
      
      {event.message && (
        <p className="text-sm mb-2">{event.message}</p>
      )}
      
      {Object.keys(event.payload).length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Payload
          </summary>
          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export function RunStream({ runId, autoScroll = true }: RunStreamProps) {
  const [events, setEvents] = useState<RunStreamEventItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  const { data: runContext, isLoading: runLoading } = useHermesRun(runId);
  const { data: streamData } = useHermesRunStream(runId);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // Process stream events
  useEffect(() => {
    if (!streamData?.events) return;

    const processStream = async () => {
      try {
        setIsConnected(true);
        setError(null);

        for await (const messageEvent of streamData.events) {
          const event = messageEvent.data as RunStreamEventItem;
          
          setEvents(prev => [...prev, {
            eventType: event.eventType,
            timestamp: event.timestamp,
            sequence: event.sequence,
            payload: event.payload || {},
            message: event.message,
          }]);
        }
      } catch (err) {
        console.error('Stream error:', err);
        setError(err instanceof Error ? err.message : 'Stream connection failed');
        setIsConnected(false);
      }
    };

    processStream();

    return () => {
      setIsConnected(false);
    };
  }, [streamData?.events]);

  if (runLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading run...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!runContext) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive text-center">Run not found</p>
        </CardContent>
      </Card>
    );
  }

  const { run } = runContext;
  const routeMetadata = (run.metadata?.routeMetadata ?? {}) as Record<string, unknown>;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Run: {run.domain}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <RunControls runId={run.id} status={run.status} canResume={runContext.canResume} />
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(run.status)} text-white border-0`}
            >
              {run.status}
            </Badge>
            
            <div className="flex items-center gap-1">
              <div 
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <span>ID: {run.id}</span>
          {run.sessionId && (
            <span className="ml-4">Session: {run.sessionId}</span>
          )}
        </div>
        {(routeMetadata.routeId || routeMetadata.sourceRequestPath || routeMetadata.targetBackendService) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {routeMetadata.routeId ? (
              <Badge variant="outline">Route {String(routeMetadata.routeId)}</Badge>
            ) : null}
            {routeMetadata.sourceRequestPath ? (
              <Badge variant="outline">Source {String(routeMetadata.sourceRequestPath)}</Badge>
            ) : null}
            {routeMetadata.targetBackendService ? (
              <Badge variant="outline">Target {String(routeMetadata.targetBackendService)}</Badge>
            ) : null}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {error && (
          <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-sm text-destructive">Stream Error: {error}</p>
          </div>
        )}
        
        <ScrollArea className="h-[400px] px-6">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Waiting for events...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {events.map((event, index) => (
                <RunStreamEvent key={`${event.sequence}-${index}`} event={event} />
              ))}
              <div ref={eventsEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface RunControlsProps {
  runId: RunId;
  status: HermesRun['status'];
  canResume: boolean;
}

export function RunControls({ runId, status, canResume }: RunControlsProps) {
  const controlMutation = useControlHermesRun(runId);

  const handleControl = async (action: RunAction['action']) => {
    try {
      await controlMutation.mutateAsync({ action });
    } catch (error) {
      console.error(`Failed to ${action} run:`, error);
    }
  };

  const isLoading = controlMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      {status === 'running' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleControl('pause')}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
          Pause
        </Button>
      )}
      
      {canResume && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleControl('resume')}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Resume
        </Button>
      )}
      
      {(status === 'running' || status === 'paused') && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleControl('cancel')}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          Cancel
        </Button>
      )}
    </div>
  );
}

