import { logger } from "./logger";

export interface ResilientSocketConfig {
  maxReconnectAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  jitterFactor: number;
}

const DEFAULT_CONFIG: ResilientSocketConfig = {
  maxReconnectAttempts: 15,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  heartbeatIntervalMs: 25000,
  heartbeatTimeoutMs: 10000,
  jitterFactor: 0.3,
};

export interface ReconnectState {
  attempt: number;
  nextDelayMs: number;
  isReconnecting: boolean;
  lastDisconnectReason: string;
  totalReconnects: number;
}

export function calculateBackoffDelay(
  attempt: number,
  config: Partial<ResilientSocketConfig> = {}
): number {
  const {
    initialDelay = DEFAULT_CONFIG.initialDelay,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    backoffMultiplier = DEFAULT_CONFIG.backoffMultiplier,
    jitterFactor = DEFAULT_CONFIG.jitterFactor,
  } = config;

  const baseDelay = Math.min(
    initialDelay * Math.pow(backoffMultiplier, attempt),
    maxDelay
  );

  const jitter = baseDelay * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(baseDelay + jitter));
}

export class MessageDeduplicator {
  private seen = new Map<string, number>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number = 500, ttlMs: number = 30000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  isDuplicate(messageId: string): boolean {
    const now = Date.now();
    this.cleanup(now);

    if (this.seen.has(messageId)) {
      return true;
    }

    if (this.seen.size >= this.maxSize) {
      const oldest = this.getOldestKey();
      if (oldest) this.seen.delete(oldest);
    }

    this.seen.set(messageId, now);
    return false;
  }

  private cleanup(now: number): void {
    for (const [key, timestamp] of this.seen) {
      if (now - timestamp > this.ttlMs) {
        this.seen.delete(key);
      }
    }
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, time] of this.seen) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    return oldestKey;
  }

  clear(): void {
    this.seen.clear();
  }

  get size(): number {
    return this.seen.size;
  }
}

export function generateMessageId(message: {
  author?: string;
  type?: string;
  timestamp?: string;
  event?: string;
  content?: string;
}): string {
  const parts = [
    message.author || "",
    message.type || "",
    message.timestamp || "",
    message.event || "",
  ];

  if (message.content) {
    parts.push(message.content.substring(0, 50));
  }

  return parts.join(":");
}

export class HeartbeatManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private config: ResilientSocketConfig;
  private onTimeout: () => void;
  private sendPing: () => void;
  private lastPong: number = 0;

  constructor(
    sendPing: () => void,
    onTimeout: () => void,
    config: Partial<ResilientSocketConfig> = {}
  ) {
    this.sendPing = sendPing;
    this.onTimeout = onTimeout;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    this.stop();
    this.lastPong = Date.now();

    this.intervalId = setInterval(() => {
      this.sendPing();

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      this.timeoutId = setTimeout(() => {
        const elapsed = Date.now() - this.lastPong;
        if (elapsed > this.config.heartbeatIntervalMs + this.config.heartbeatTimeoutMs) {
          logger.warn("Heartbeat timeout — no pong received");
          this.onTimeout();
        }
        this.timeoutId = null;
      }, this.config.heartbeatTimeoutMs);
    }, this.config.heartbeatIntervalMs);
  }

  receivedPong(): void {
    this.lastPong = Date.now();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export function createReconnectState(): ReconnectState {
  return {
    attempt: 0,
    nextDelayMs: DEFAULT_CONFIG.initialDelay,
    isReconnecting: false,
    lastDisconnectReason: "",
    totalReconnects: 0,
  };
}

export function shouldReconnect(
  state: ReconnectState,
  reason: string,
  config: Partial<ResilientSocketConfig> = {}
): boolean {
  const maxAttempts =
    config.maxReconnectAttempts ?? DEFAULT_CONFIG.maxReconnectAttempts;

  const noReconnectReasons = [
    "io server disconnect",
    "io client disconnect",
    "forced close",
  ];

  if (noReconnectReasons.includes(reason)) {
    return false;
  }

  return state.attempt < maxAttempts;
}

export function advanceReconnectState(
  state: ReconnectState,
  config: Partial<ResilientSocketConfig> = {}
): ReconnectState {
  const nextAttempt = state.attempt + 1;
  const nextDelay = calculateBackoffDelay(nextAttempt, config);

  return {
    ...state,
    attempt: nextAttempt,
    nextDelayMs: nextDelay,
    isReconnecting: true,
    totalReconnects: state.totalReconnects + 1,
  };
}

export function resetReconnectState(state: ReconnectState): ReconnectState {
  return {
    ...state,
    attempt: 0,
    nextDelayMs: DEFAULT_CONFIG.initialDelay,
    isReconnecting: false,
  };
}
