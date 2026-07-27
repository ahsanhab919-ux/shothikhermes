"use client";

import LogRouter from "./logs/LogRouter";

/**
 * MessageBubble Component
 *
 * Wrapper component that routes logs to specialized log components
 * based on their messageType. This provides a clean separation of concerns
 * while maintaining backward compatibility.
 */
export default function MessageBubble({
  logs,
  onViewSummary,
  handlePreviewOpen,
}) {
  return (
    <LogRouter
      log={logs}
      onViewSummary={onViewSummary}
      handlePreviewOpen={handlePreviewOpen}
    />
  );
}
