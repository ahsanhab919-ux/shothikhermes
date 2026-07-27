/**
 * Type definitions for agent logs and streaming log system
 */

/**
 * Parsed output from an agent can be either a string message or structured data
 */
export type ParsedOutput = string | Record<string, unknown>;

/**
 * Agent log entry with required and optional fields
 */
export interface AgentLog {
  /** Name of the agent that generated this log */
  agent_name: string;

  /** The parsed output content from the agent */
  parsed_output: ParsedOutput;

  /** ISO timestamp when the log was created */
  timestamp: string;

  /** Unique identifier for the log entry */
  id?: string;

  /** Optional status indicator */
  status?: "processing" | "completed" | "failed";

  /** Whether this log should be animated when displayed */
  shouldAnimate?: boolean;
}

/**
 * Session status for tracking overall processing state
 */
export type SessionStatus = "processing" | "completed" | "failed";

/**
 * Result returned by log hooks
 */
export interface LogHookResult {
  /** Processed and filtered logs ready for display */
  processedLogs: AgentLog[];

  /** Index of currently typing/animating log (-1 if none) */
  currentlyTypingIndex: number;

  /** Whether to show "thinking" indicator */
  showThinking: boolean;

  /** Callback when typing animation completes */
  handleTypingComplete: (logIndex: number) => void;

  /** Current session status */
  sessionStatus: SessionStatus;

  /** Whether processing is happening in background */
  isBackgroundProcessing: boolean;

  /** Register a callback for animation completion */
  registerAnimationCallback: (logIndex: number, forceComplete: () => void) => void;

  /** Unregister animation callback */
  unregisterAnimationCallback: (logIndex: number) => void;

  /** Force complete current animation */
  forceCompleteCurrentAnimation: () => void;
}
