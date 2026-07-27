"use client";

/**
 * useSheetGeneration Hook
 * 
 * Manages sheet generation with the new Sheet Service backend
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { sheetService } from '@/services/sheetService';

export function useSheetGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, pending, generating_data, completed, failed
  const [error, setError] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [jobId, setJobId] = useState(null);
  
  const abortControllerRef = useRef(null);

  /**
   * Start sheet generation
   */
  const generateSheet = useCallback(async (request) => {
    setIsGenerating(true);
    setProgress(0);
    setStatus('pending');
    setError(null);
    setSheetData(null);

    try {
      // Step 1: Create job
      const createResult = await sheetService.createSheet(request);
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create sheet job');
      }

      const newJobId = createResult.jobId;
      setJobId(newJobId);
      setStatus('generating_data');

      // Step 2: Stream progress
      return new Promise((resolve, reject) => {
        const stream = sheetService.streamSheetProgress(newJobId, {
          onMessage: (data) => {
            setStatus(data.status);
            setProgress(data.progress || 0);
            
            if (data.job?.data) {
              setSheetData(data.job.data);
            }
          },
          onComplete: (data) => {
            setIsGenerating(false);
            setProgress(100);
            
            if (data.status === 'completed') {
              setStatus('completed');
              resolve({
                jobId: newJobId,
                data: data.job?.data || sheetData,
                exportUrls: data.job?.exportUrls,
              });
            } else {
              setStatus('failed');
              setError(data.error || 'Sheet generation failed');
              reject(new Error(data.error || 'Sheet generation failed'));
            }
          },
          onError: (err) => {
            setIsGenerating(false);
            setStatus('failed');
            setError(err.message || 'Stream error');
            reject(err);
          },
        });

        abortControllerRef.current = stream;
      });

    } catch (err) {
      setIsGenerating(false);
      setStatus('failed');
      setError(err.message || 'Unknown error');
      throw err;
    }
  }, []);

  /**
   * Cancel generation
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.close();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setStatus('idle');
    setProgress(0);
  }, []);

  /**
   * Export sheet
   */
  const exportSheet = useCallback(async (format = 'xlsx') => {
    if (!jobId) {
      throw new Error('No sheet to export');
    }

    return sheetService.exportSheet(jobId, format);
  }, [jobId]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setStatus('idle');
    setError(null);
    setSheetData(null);
    setJobId(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.close();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.close();
      }
    };
  }, []);

  return {
    // State
    isGenerating,
    progress,
    status,
    error,
    sheetData,
    jobId,
    
    // Actions
    generateSheet,
    cancelGeneration,
    exportSheet,
    reset,
  };
}

export default useSheetGeneration;
