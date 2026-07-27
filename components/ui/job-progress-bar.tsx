"use client";

import React from "react";
import { JobStatus } from "@/hooks/useJobPolling";

interface JobProgressBarProps {
  isPolling: boolean;
  progress: number;
  state: JobStatus["state"];
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  label?: string;
}

export function JobProgressBar({
  isPolling,
  progress,
  state,
  error,
  onRetry,
  onCancel,
  label = "Processing your request...",
}: JobProgressBarProps) {
  if (!isPolling && state === "unknown") return null;

  // Determine colors based on state
  const isError = state === "failed" || !!error;
  const isComplete = state === "completed" || progress === 100;
  
  const barColor = isError
    ? "bg-red-500"
    : isComplete
    ? "bg-green-500"
    : "bg-blue-600";
    
  const statusText = isError 
    ? "Failed" 
    : isComplete 
    ? "Completed" 
    : state === "waiting" || state === "delayed"
    ? "In Queue..."
    : `${progress}%`;

  return (
    <div className="w-full max-w-md p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isError ? "Error processing job" : label}
        </span>
        <span className={`text-xs font-semibold ${isError ? "text-red-500" : isComplete ? "text-green-500" : "text-blue-600"}`}>
          {statusText}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
        {/* Animated Bar */}
        <div
          className={`h-full transition-all duration-500 ease-out ${barColor} ${
            isPolling && state === "active" ? "animate-pulse" : ""
          }`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      {/* Error Message & Controls */}
      {isError && error && (
        <div className="mt-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {(isError || isPolling) && (
        <div className="mt-3 flex gap-2 justify-end">
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              Retry
            </button>
          )}
          {isPolling && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
