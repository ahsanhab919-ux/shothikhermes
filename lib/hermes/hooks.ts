'use client';

/**
 * React Hooks for Hermes Sessions and Runs
 * 
 * Provides React Query-based hooks for frontend components.
 * Keeps UI state management separate from backend orchestration.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hermesClient,
  type CreateSessionRequest,
  type CreateRunRequest,
  type ListSessionsParams,
  type SessionAction,
  type RunAction,
  type GenerateSlidesRequest,
  type PauseResumeSlidesRequest,
  type UpdateSlideContentRequest,
  type ExportSlideDeckRequest,
  type GenerateSheetsRequest,
  type ControlSheetsRequest,
  type GenerateResearchRequest,
  type ControlResearchRequest,
  type GenerateWritingRequest,
  type ControlWritingRequest,
  type GenerateBookRequest,
  type ControlBookRequest,
  type GenerateAIDetectorRequest,
  type ControlAIDetectorRequest,
  type GeneratePlagiarismRequest,
  type ControlPlagiarismRequest,
  type GeneratePublishRequest,
  type ControlPublishRequest,
  type HandoffRequest,
} from './client';



import type { SessionId, RunId } from './contracts/core';

// Query Keys
export const hermesQueryKeys = {
  all: ['hermes'] as const,
  sessions: () => [...hermesQueryKeys.all, 'sessions'] as const,
  sessionList: (params: ListSessionsParams) => [...hermesQueryKeys.sessions(), 'list', params] as const,
  sessionDetail: (sessionId: SessionId) => [...hermesQueryKeys.sessions(), 'detail', sessionId] as const,
  runs: () => [...hermesQueryKeys.all, 'runs'] as const,
  runDetail: (runId: RunId) => [...hermesQueryKeys.runs(), 'detail', runId] as const,
} as const;

// Session Hooks

export function useHermesSessionList(params: ListSessionsParams = {}) {
  return useQuery({
    queryKey: hermesQueryKeys.sessionList(params),
    queryFn: () => hermesClient.listSessions(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useHermesSession(sessionId: SessionId | null) {
  return useQuery({
    queryKey: hermesQueryKeys.sessionDetail(sessionId!),
    queryFn: () => hermesClient.getSessionContext(sessionId!),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateHermesSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateSessionRequest) => hermesClient.createSession(request),
    onSuccess: (session) => {
      // Invalidate sessions list to show new session
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      
      // Set the new session data in cache
      queryClient.setQueryData(
        hermesQueryKeys.sessionDetail(session.id),
        {
          session,
          workspace: null, // Will be loaded on detail view
          runs: [],
          canResume: false,
        }
      );
    },
  });
}

export function useControlHermesSession(sessionId: SessionId) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (action: SessionAction) => hermesClient.controlSession(sessionId, action),
    onSuccess: () => {
      // Invalidate session detail and list to refresh status
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
    },
  });
}

// Run Hooks

export function useHermesRun(runId: RunId | null) {
  return useQuery({
    queryKey: hermesQueryKeys.runDetail(runId!),
    queryFn: () => hermesClient.getRunContext(runId!),
    enabled: !!runId,
    staleTime: 1000 * 30, // 30 seconds - runs change more frequently
  });
}

export function useCreateHermesRun() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateRunRequest) => hermesClient.createRun(request),
    onSuccess: (response, variables) => {
      // Invalidate session detail if run is tied to a session
      if (variables.sessionId) {
        queryClient.invalidateQueries({ 
          queryKey: hermesQueryKeys.sessionDetail(variables.sessionId) 
        });
      }
      
      // Set the new run data in cache
      queryClient.setQueryData(
        hermesQueryKeys.runDetail(response.run.id),
        {
          run: response.run,
          workspace: null, // Will be loaded on detail view
          canResume: false,
        }
      );
    },
  });
}

export function useControlHermesRun(runId: RunId) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (action: RunAction) => hermesClient.controlRun(runId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runDetail(runId) });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
    },
  });
}

// Streaming Hooks

export function useHermesRunStream(runId: RunId | null) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: [...hermesQueryKeys.runDetail(runId!), 'stream'],
    queryFn: async () => {
      if (!runId) return null;
      
      const stream = await hermesClient.getRunStream(runId);
      return {
        stream,
        events: hermesClient.parseEventStream(stream),
      };
    },
    enabled: !!runId,
    staleTime: Infinity, // Stream should not be refetched
    gcTime: 0, // Don't cache streams
    refetchOnMount: true, // Always get fresh stream
  });
}

// Optimistic Updates for Better UX

export function useOptimisticSessionAction(sessionId: SessionId) {
  const queryClient = useQueryClient();
  const controlMutation = useControlHermesSession(sessionId);
  
  const executeAction = async (action: SessionAction['action']) => {
    // Optimistic update
    queryClient.setQueryData(
      hermesQueryKeys.sessionDetail(sessionId),
      (old: any) => {
        if (!old?.session) return old;
        
        const newStatus = action === 'resume' ? 'active' : 
                         action === 'pause' ? 'paused' : 'archived';
        
        return {
          ...old,
          session: {
            ...old.session,
            status: newStatus,
          },
          canResume: newStatus === 'paused',
        };
      }
    );

    // Execute actual mutation
    try {
      await controlMutation.mutateAsync({ action });
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessionDetail(sessionId) });
      throw error;
    }
  };

  return {
    executeAction,
    isLoading: controlMutation.isPending,
    error: controlMutation.error,
  };
}

export type {
  SessionAction,
  RunAction,
  GenerateSlidesRequest,
  PauseResumeSlidesRequest,
  UpdateSlideContentRequest,
  ExportSlideDeckRequest,
  GenerateSheetsRequest,
  ControlSheetsRequest,
  GenerateResearchRequest,
  ControlResearchRequest,
  GenerateWritingRequest,
  ControlWritingRequest,
  GenerateBookRequest,
  ControlBookRequest,
  GenerateAIDetectorRequest,
  ControlAIDetectorRequest,
  GeneratePlagiarismRequest,
  ControlPlagiarismRequest,
  GeneratePublishRequest,
  ControlPublishRequest,
  HandoffRequest,
};

// Cross-Domain Handoff Hooks

export function useHermesHandoff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: HandoffRequest) => hermesClient.handoff(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}


// Writing Artifact Hooks

export function useGenerateHermesWriting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateWritingRequest) => hermesClient.generateWriting(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesWriting(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlWritingRequest) => hermesClient.controlWriting(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

// Book Artifact Hooks

export function useGenerateHermesBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateBookRequest) => hermesClient.generateBook(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesBook(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlBookRequest) => hermesClient.controlBook(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

// AI Detector Artifact Hooks

export function useGenerateHermesAIDetector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateAIDetectorRequest) => hermesClient.generateAIDetector(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesAIDetector(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlAIDetectorRequest) => hermesClient.controlAIDetector(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

// Plagiarism Artifact Hooks

export function useGenerateHermesPlagiarism() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GeneratePlagiarismRequest) => hermesClient.generatePlagiarism(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesPlagiarism(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlPlagiarismRequest) => hermesClient.controlPlagiarism(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

// Publish Artifact Hooks

export function useGenerateHermesPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GeneratePublishRequest) => hermesClient.generatePublish(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesPublish(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlPublishRequest) => hermesClient.controlPublish(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}


// Slide Artifact Hooks

export function useGenerateHermesSlides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateSlidesRequest) => hermesClient.generateSlides(request),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesSlides(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: PauseResumeSlidesRequest | UpdateSlideContentRequest | ExportSlideDeckRequest) =>
      hermesClient.controlSlides(action, body),
    onSuccess: (_, variables) => {
      if ('runId' in variables) {
        queryClient.invalidateQueries({
          queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
        });
      }
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

// Sheet Artifact Hooks

export function useGenerateHermesSheets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateSheetsRequest) => hermesClient.generateSheets(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesSheets(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlSheetsRequest) => hermesClient.controlSheets(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

// Research Artifact Hooks

export function useGenerateHermesResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateResearchRequest) => hermesClient.generateResearch(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

export function useControlHermesResearch(action: 'pause' | 'resume' | 'update' | 'export') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ControlResearchRequest) => hermesClient.controlResearch(action, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: hermesQueryKeys.runDetail(variables.runId as RunId),
      });
      queryClient.invalidateQueries({ queryKey: hermesQueryKeys.runs() });
    },
  });
}

