"use client";

/**
 * useCheckpointGeneration Hook
 * 
 * Manages checkpoint-based slide generation with pause/resume
 * Inspired by Stitch AI's incremental memory building
 */

import { useState, useCallback, useRef } from 'react';
import { getStitchClient } from '@/lib/stitch/client';
import { Checkpoint, CheckpointStep } from '@/components/presentation/checkpoints/CheckpointProgress';

export interface GenerationJob {
  id: string;
  spaceId: string;
  prompt: string;
  title: string;
  slideCount: number;
  theme: string;
  status: 'pending' | 'generating' | 'paused' | 'completed' | 'failed';
  currentStep: CheckpointStep;
  checkpoints: Checkpoint[];
  overallProgress: number;
  result?: any;
  error?: string;
}

export function useCheckpointGeneration() {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize new generation job
  const createJob = useCallback((params: {
    spaceId: string;
    prompt: string;
    title: string;
    slideCount: number;
    theme: string;
  }): GenerationJob => {
    const jobId = `job-${Date.now()}`;
    
    const initialCheckpoints: Checkpoint[] = [
      { step: 'outline', status: 'pending', progress: 0 },
      { step: 'design', status: 'pending', progress: 0 },
      { step: 'content', status: 'pending', progress: 0 },
      { step: 'formatting', status: 'pending', progress: 0 },
      { step: 'review', status: 'pending', progress: 0 },
    ];
    
    const newJob: GenerationJob = {
      id: jobId,
      ...params,
      status: 'pending',
      currentStep: 'outline',
      checkpoints: initialCheckpoints,
      overallProgress: 0,
    };
    
    setJob(newJob);
    
    // Save to localStorage for resume capability
    localStorage.setItem(`shothik-job-${jobId}`, JSON.stringify({
      ...newJob,
      createdAt: new Date().toISOString(),
    }));
    
    return newJob;
  }, []);

  // Start or resume generation
  const startGeneration = useCallback(async (jobId: string) => {
    if (!job || job.id !== jobId) return;
    
    setIsLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Update job status
      setJob(prev => prev ? {
        ...prev,
        status: 'generating',
      } : null);
      
      // Simulate checkpoint-based generation
      await runCheckpointGeneration(job);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Generation paused by user');
      } else {
        setError(err instanceof Error ? err.message : 'Generation failed');
        setJob(prev => prev ? {
          ...prev,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Generation failed',
        } : null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [job]);

  // Simulate checkpoint generation (replace with actual API calls)
  const runCheckpointGeneration = async (currentJob: GenerationJob) => {
    const steps: CheckpointStep[] = ['outline', 'design', 'content', 'formatting', 'review'];
    const startIndex = steps.indexOf(currentJob.currentStep);
    
    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('AbortError');
      }
      
      // Update current step
      setJob(prev => prev ? {
        ...prev,
        currentStep: step,
        checkpoints: prev.checkpoints.map(c => 
          c.step === step 
            ? { ...c, status: 'in_progress' }
            : c.step === steps[i - 1]
            ? { ...c, status: 'completed', timestamp: new Date() }
            : c
        ),
      } : null);
      
      // Simulate step progress
      await simulateStepProgress(step, currentJob.id);
      
      // Save checkpoint to memory
      await saveCheckpoint(currentJob.spaceId, currentJob.id, step);
    }
    
    // Mark as completed
    setJob(prev => prev ? {
      ...prev,
      status: 'completed',
      overallProgress: 100,
      checkpoints: prev.checkpoints.map(c => 
        c.step === 'review' 
          ? { ...c, status: 'completed', timestamp: new Date() }
          : c
      ),
    } : null);
  };

  // Simulate step progress with updates
  const simulateStepProgress = async (step: CheckpointStep, jobId: string) => {
    const stepDuration = 2000; // 2 seconds per step for demo
    const updateInterval = 200; // Update every 200ms
    const steps = stepDuration / updateInterval;
    
    for (let i = 0; i <= steps; i++) {
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('AbortError');
      }
      
      const progress = Math.round((i / steps) * 100);
      const overallProgress = calculateOverallProgress(step, progress);
      
      setJob(prev => {
        if (!prev) return null;
        
        const updatedCheckpoints = prev.checkpoints.map(c => 
          c.step === step 
            ? { ...c, progress }
            : c
        );
        
        // Update localStorage
        localStorage.setItem(`shothik-job-${jobId}`, JSON.stringify({
          ...prev,
          checkpoints: updatedCheckpoints,
          overallProgress,
        }));
        
        return {
          ...prev,
          checkpoints: updatedCheckpoints,
          overallProgress,
        };
      });
      
      await new Promise(resolve => setTimeout(resolve, updateInterval));
    }
  };

  // Calculate overall progress
  const calculateOverallProgress = (currentStep: CheckpointStep, stepProgress: number): number => {
    const stepWeights: Record<CheckpointStep, number> = {
      outline: 0.2,
      design: 0.2,
      content: 0.3,
      formatting: 0.2,
      review: 0.1,
    };
    
    const steps: CheckpointStep[] = ['outline', 'design', 'content', 'formatting', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    let progress = 0;
    for (let i = 0; i < currentIndex; i++) {
      progress += stepWeights[steps[i]] * 100;
    }
    progress += stepWeights[currentStep] * stepProgress;
    
    return Math.round(progress);
  };

  // Save checkpoint to memory
  const saveCheckpoint = async (spaceId: string, jobId: string, step: CheckpointStep) => {
    try {
      const stitchClient = getStitchClient();
      await stitchClient.uploadMemory(
        spaceId,
        `Checkpoint: ${step} completed for job ${jobId}`,
        {
          type: 'checkpoint',
          jobId,
          step,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (err) {
      console.error('Failed to save checkpoint:', err);
    }
  };

  // Pause generation
  const pauseGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    
    setJob(prev => prev ? {
      ...prev,
      status: 'paused',
    } : null);
  }, []);

  // Resume generation
  const resumeGeneration = useCallback(() => {
    if (job && job.status === 'paused') {
      startGeneration(job.id);
    }
  }, [job, startGeneration]);

  // Rollback to checkpoint
  const rollbackToCheckpoint = useCallback((step: CheckpointStep) => {
    setJob(prev => {
      if (!prev) return null;
      
      const steps: CheckpointStep[] = ['outline', 'design', 'content', 'formatting', 'review'];
      const rollbackIndex = steps.indexOf(step);
      
      return {
        ...prev,
        currentStep: step,
        status: 'paused',
        checkpoints: prev.checkpoints.map((c, i) => {
          if (i < rollbackIndex) {
            return { ...c, status: 'completed' };
          } else if (i === rollbackIndex) {
            return { ...c, status: 'pending', progress: 0 };
          } else {
            return { ...c, status: 'pending', progress: 0 };
          }
        }),
      };
    });
  }, []);

  // Load saved job
  const loadSavedJob = useCallback((jobId: string): GenerationJob | null => {
    const saved = localStorage.getItem(`shothik-job-${jobId}`);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        lastModified: new Date(parsed.lastModified),
        createdAt: new Date(parsed.createdAt),
      };
    } catch {
      return null;
    }
  }, []);

  return {
    job,
    isLoading,
    error,
    createJob,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    rollbackToCheckpoint,
    loadSavedJob,
  };
}

export default useCheckpointGeneration;
