"use client";

import { useJobPolling } from "@/hooks/useJobPolling";
import { JobProgressBar } from "@/components/ui/job-progress-bar";
import { useState } from "react";

export default function AgentDemoPage() {
  const [resultText, setResultText] = useState<string>("");

  const { startPolling, isPolling, progress, state, status, stopPolling } = useJobPolling<{ generatedContent: string }>({
    apiPath: "http://localhost:3005/api/v1/jobs", // Pointing to the Orchestrator Service
    pollingIntervalMs: 1500,
    onSuccess: (result) => {
      setResultText(result.generatedContent);
    },
    onError: (err) => {
      console.error("Job failed:", err);
    }
  });

  const handleStart = async () => {
    setResultText("");
    try {
      const res = await fetch("http://localhost:3005/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer DEMO_TOKEN_123" // Expected by orchestrator auth hook
        },
        body: JSON.stringify({
          taskType: "research_agent",
          payload: { prompt: "Analyze global market trends for 2026." }
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to queue job");
      }
      
      const { jobId } = await res.json();
      startPolling(jobId);
    } catch (e) {
      console.error("Error starting job:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Autonomous Agent Orchestration Demo
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400">
          This demonstrates the end-to-end integration of the Next.js client, 
          the Node.js Orchestrator Service (Fastify + BullMQ), and the 
          Autonomous Agent Worker Service.
        </p>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <button 
            onClick={handleStart}
            disabled={isPolling}
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPolling ? "Agent is Working..." : "Launch Research Agent"}
          </button>

          {(isPolling || state !== "unknown") && (
            <JobProgressBar 
              isPolling={isPolling} 
              progress={progress} 
              state={state} 
              error={status?.error}
              label="Research Agent Progress"
              onCancel={stopPolling}
              onRetry={handleStart}
            />
          )}
        </div>

        {resultText && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Final Output Received:</h3>
            <p className="text-gray-700 dark:text-gray-300 font-mono text-sm break-words">
              {resultText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
