import { useState, useEffect, useCallback, useRef } from 'react';

type JobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';

export interface JobStatus<TResult = any> {
  id: string;
  state: JobState;
  progress: number | null;
  result: TResult | null;
  error?: string;
}

export interface UseJobPollingOptions<TResult = any> {
  pollingIntervalMs?: number;
  onSuccess?: (result: TResult) => void;
  onError?: (error: string) => void;
  apiPath?: string; // e.g. '/api/v1/jobs'
}

/**
 * Enterprise-grade custom React hook for polling job status.
 * Handles memory leaks, unmount cleanup, and strict typing.
 */
export function useJobPolling<TResult = any>(options: UseJobPollingOptions<TResult> = {}) {
  const { 
    pollingIntervalMs = 1500, 
    onSuccess, 
    onError,
    apiPath = '/api/v1/jobs'
  } = options;
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus<TResult> | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Use refs for callbacks to avoid re-triggering useEffect unnecessarily
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const startPolling = useCallback((id: string) => {
    setJobId(id);
    setIsPolling(true);
    setStatus(null);
  }, []);

  const stopPolling = useCallback(() => {
    setJobId(null);
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!jobId || !isPolling) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const poll = async () => {
      if (!isMounted) return;

      try {
        const response = await fetch(`${apiPath}/${jobId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch job status: ${response.statusText}`);
        }
        
        const data = (await response.json()) as JobStatus<TResult>;
        
        if (!isMounted) return;

        setStatus(data);

        if (data.state === 'completed') {
          setIsPolling(false);
          if (onSuccessRef.current && data.result !== null) {
            onSuccessRef.current(data.result);
          }
          return; // Stop scheduling new polls
        } else if (data.state === 'failed') {
          setIsPolling(false);
          if (onErrorRef.current) {
            onErrorRef.current(data.error || 'Job failed silently on the server.');
          }
          return; // Stop scheduling new polls
        }

        // Schedule next poll only if we haven't completed/failed
        if (isMounted && isPolling) {
          timeoutId = setTimeout(poll, pollingIntervalMs);
        }

      } catch (error) {
        if (!isMounted) return;
        
        console.error('[useJobPolling] Polling error:', error);
        setIsPolling(false);
        if (onErrorRef.current) {
          onErrorRef.current(error instanceof Error ? error.message : String(error));
        }
      }
    };

    // Immediate first poll
    poll();

    // Cleanup function: clears timeout and marks as unmounted to prevent state updates
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [jobId, isPolling, pollingIntervalMs, apiPath]);

  return {
    startPolling,
    stopPolling,
    status,
    isPolling,
    progress: status?.progress ?? 0,
    state: status?.state ?? 'unknown'
  };
}
