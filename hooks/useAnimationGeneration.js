"use client";

/**
 * useAnimationGeneration Hook
 * 
 * Manages video generation with the Animation Service backend
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const ANIMATION_SERVICE_URL = process.env.NEXT_PUBLIC_ANIMATION_SERVICE_URL || 'http://localhost:3002';

export function useAnimationGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  
  const eventSourceRef = useRef(null);

  /**
   * Start video generation
   */
  const generateVideo = useCallback(async (request) => {
    setIsGenerating(true);
    setProgress(0);
    setStatus('pending');
    setError(null);
    setVideoUrl(null);

    try {
      // Step 1: Create job
      const response = await fetch(`${ANIMATION_SERVICE_URL}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: request.userId || 'anonymous',
          slideDeck: request.slideDeck,
          template: request.template,
          resolution: request.resolution || '1080p',
          frameRate: request.frameRate || '30fps',
          voice: request.voice,
          voiceClone: request.voiceClone || { enabled: false },
          music: request.music,
          subtitles: request.subtitles ?? true,
          watermark: request.watermark ?? false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create video job');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create video job');
      }

      const newJobId = result.jobId;
      setJobId(newJobId);

      // Step 2: Stream progress
      return new Promise((resolve, reject) => {
        const eventSource = new EventSource(`${ANIMATION_SERVICE_URL}/videos/${newJobId}/stream`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            setStatus(data.status);
            setProgress(data.progress || 0);

            if (data.status === 'completed') {
              setVideoUrl(data.outputUrl);
              setIsGenerating(false);
              eventSource.close();
              resolve({
                jobId: newJobId,
                videoUrl: data.outputUrl,
              });
            } else if (data.status === 'failed') {
              setError(data.error || 'Video generation failed');
              setIsGenerating(false);
              eventSource.close();
              reject(new Error(data.error || 'Video generation failed'));
            }
          } catch (err) {
            console.error('Failed to parse SSE message:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.error('SSE error:', err);
          setError('Connection error');
          setIsGenerating(false);
          eventSource.close();
          reject(new Error('Connection error'));
        };
      });

    } catch (err) {
      setIsGenerating(false);
      setStatus('failed');
      setError(err.message || 'Unknown error');
      throw err;
    }
  }, []);

  /**
   * Export video
   */
  const exportVideo = useCallback(async (format = 'mp4') => {
    if (!videoUrl) {
      throw new Error('No video to export');
    }

    // If it's a direct URL, download it
    if (videoUrl.startsWith('http')) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `video.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true };
    }

    // Otherwise, use the export endpoint
    const response = await fetch(`${ANIMATION_SERVICE_URL}/videos/${jobId}/export/${format}`);
    
    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  }, [videoUrl, jobId]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setStatus('idle');
    setError(null);
    setVideoUrl(null);
    setJobId(null);
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    isGenerating,
    progress,
    status,
    error,
    videoUrl,
    jobId,
    generateVideo,
    exportVideo,
    reset,
  };
}

export default useAnimationGeneration;
