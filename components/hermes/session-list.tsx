'use client';

/**
 * Hermes UI Components
 * 
 * Minimal UI components that use the adapter hooks.
 * Backend orchestration logic is kept separate from UI concerns.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Play, Pause, Archive, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useHermesSessionList, 
  useOptimisticSessionAction,
  type SessionAction 
} from '@/lib/hermes/hooks';
import type { HermesSession, WorkspaceId } from '@/lib/hermes/contracts/core';

interface SessionCardProps {
  session: HermesSession;
  onSessionClick?: (sessionId: string) => void;
}

function getStatusColor(status: HermesSession['status']) {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'paused':
      return 'bg-yellow-500';
    case 'archived':
      return 'bg-gray-500';
    case 'expired':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

function SessionCard({ session, onSessionClick }: SessionCardProps) {
  const { executeAction, isLoading, error } = useOptimisticSessionAction(session.id);

  const handleAction = async (action: SessionAction['action']) => {
    try {
      await executeAction(action);
    } catch (err) {
      console.error('Session action failed:', err);
    }
  };

  const canResume = session.status === 'paused';
  const canPause = session.status === 'active';
  const canArchive = session.status !== 'archived';

  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div 
            className="flex-1 space-y-1"
            onClick={() => onSessionClick?.(session.id)}
          >
            <CardTitle className="text-base font-medium line-clamp-1">
              {session.title}
            </CardTitle>
            {session.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {session.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(session.status)} text-white border-0`}
            >
              {session.status}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canResume && (
                  <DropdownMenuItem onClick={() => handleAction('resume')}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                {canPause && (
                  <DropdownMenuItem onClick={() => handleAction('pause')}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                {canArchive && (
                  <DropdownMenuItem 
                    onClick={() => handleAction('archive')}
                    className="text-destructive"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0" onClick={() => onSessionClick?.(session.id)}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Updated: {new Date(session.updatedAt).toLocaleDateString()}
          </span>
          <span>
            Active: {new Date(session.lastActiveAt).toLocaleDateString()}
          </span>
        </div>
        
        {error && (
          <div className="mt-2 text-xs text-destructive">
            Action failed: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SessionListProps {
  workspaceId?: WorkspaceId;
  onSessionClick?: (sessionId: string) => void;
  limit?: number;
}

export function SessionList({ workspaceId, onSessionClick, limit = 20 }: SessionListProps) {
  const [offset, setOffset] = useState(0);
  
  const { data: sessions, isLoading, error } = useHermesSessionList({
    workspaceId,
    limit,
    offset,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load sessions</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No sessions found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first session to get started
        </p>
      </div>
    );
  }

  const hasMore = sessions.length === limit;

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onSessionClick={onSessionClick}
          />
        ))}
      </div>
      
      {(offset > 0 || hasMore) && (
        <>
          <Separator />
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground self-center">
              Showing {offset + 1} - {offset + sessions.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export { SessionCard };
