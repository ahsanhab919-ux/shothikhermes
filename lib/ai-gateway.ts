import {
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  retry,
  circuitBreaker,
  wrap,
  timeout,
  TimeoutStrategy,
  TaskCancelledError,
} from "cockatiel";
import { logger } from "./logger";
import { incrementCounter, setGauge } from "./runtime-metrics";

export type ToolName =
  | "paraphrase"
  | "plagiarism"
  | "ai_detector"
  | "grammar"
  | "humanize"
  | "summarize"
  | "translator"
  | "ai_cowriter";

interface GatewayConfig {
  timeoutMs: number;
  maxRetries: number;
  cbThreshold: number;
  cbHalfOpenAfterMs: number;
}

const DEFAULT_CONFIG: GatewayConfig = {
  timeoutMs: 15_000,
  maxRetries: 1,
  cbThreshold: 5,
  cbHalfOpenAfterMs: 15_000,
};

const TOOL_CONFIGS: Partial<Record<ToolName, Partial<GatewayConfig>>> = {
  plagiarism: { timeoutMs: 300_000, maxRetries: 0 },
  paraphrase: { timeoutMs: 30_000, maxRetries: 1 },
  ai_detector: { timeoutMs: 20_000, maxRetries: 1 },
  grammar: { timeoutMs: 20_000, maxRetries: 1 },
  humanize: { timeoutMs: 30_000, maxRetries: 1 },
  summarize: { timeoutMs: 30_000, maxRetries: 1 },
  translator: { timeoutMs: 30_000, maxRetries: 1 },
  ai_cowriter: { timeoutMs: 60_000, maxRetries: 0 },
};

interface CircuitState {
  breaker: CircuitBreakerPolicy;
  failureCount: number;
  lastFailure: number;
  isOpen: boolean;
}

const MAX_CIRCUITS = 50;
const circuits = new Map<string, CircuitState>();

function getOrCreateCircuit(key: string, config: GatewayConfig): CircuitState {
  const existing = circuits.get(key);
  if (existing) return existing;

  if (circuits.size >= MAX_CIRCUITS) {
    const oldestKey = circuits.keys().next().value;
    if (oldestKey) circuits.delete(oldestKey);
    incrementCounter("gateway.circuit_evictions");
  }
  setGauge("gateway.circuit_count", circuits.size + 1);

  const breaker = circuitBreaker(handleAll, {
    halfOpenAfter: config.cbHalfOpenAfterMs,
    breaker: new ConsecutiveBreaker(config.cbThreshold),
  });

  breaker.onBreak(() => {
    logger.warn(`Circuit breaker OPEN for ${key}`);
    const state = circuits.get(key);
    if (state) state.isOpen = true;
  });

  breaker.onReset(() => {
    logger.info(`Circuit breaker CLOSED for ${key}`);
    const state = circuits.get(key);
    if (state) {
      state.isOpen = false;
      state.failureCount = 0;
    }
  });

  breaker.onHalfOpen(() => {
    logger.info(`Circuit breaker HALF-OPEN for ${key}`);
    const state = circuits.get(key);
    if (state) state.isOpen = false;
  });

  const state: CircuitState = {
    breaker,
    failureCount: 0,
    lastFailure: 0,
    isOpen: false,
  };

  circuits.set(key, state);
  return state;
}

export interface GatewayRequestOptions {
  tool: ToolName;
  signal?: AbortSignal;
  skipCircuitBreaker?: boolean;
}

export interface GatewayResult<T> {
  data: T;
  latencyMs: number;
  fromCache: boolean;
  retried: boolean;
  circuitState: "closed" | "open" | "half-open";
}

export class GatewayError extends Error {
  status: number;
  tool: ToolName;
  retriable: boolean;
  circuitOpen: boolean;

  constructor(
    message: string,
    status: number,
    tool: ToolName,
    retriable: boolean = false,
    circuitOpen: boolean = false
  ) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.tool = tool;
    this.retriable = retriable;
    this.circuitOpen = circuitOpen;
  }
}

export async function executeWithGateway<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: GatewayRequestOptions
): Promise<GatewayResult<T>> {
  const { tool, signal, skipCircuitBreaker = false } = options;

  const toolConfig = { ...DEFAULT_CONFIG, ...(TOOL_CONFIGS[tool] || {}) };
  const circuitKey = `tool:${tool}`;
  const circuitState = getOrCreateCircuit(circuitKey, toolConfig);

  const startTime = Date.now();
  let retried = false;

  const timeoutPolicy = timeout(toolConfig.timeoutMs, TimeoutStrategy.Aggressive);

  const retryPolicy = retry(handleAll, {
    maxAttempts: toolConfig.maxRetries + 1,
    backoff: new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 5000,
    }),
  });

  retryPolicy.onRetry(() => {
    retried = true;
    logger.info(`Retrying ${tool} request`);
  });

  const policy = skipCircuitBreaker
    ? wrap(retryPolicy, timeoutPolicy)
    : wrap(circuitState.breaker, retryPolicy, timeoutPolicy);

  try {
    const data = await policy.execute(async ({ signal: policySignal }) => {
      const combinedSignal =
        signal && policySignal
          ? AbortSignal.any([signal, policySignal])
          : signal || policySignal;

      return fn(combinedSignal);
    });

    const latencyMs = Date.now() - startTime;

    logger.info(`${tool} request completed in ${latencyMs}ms`);
    incrementCounter(`gateway.${tool}.success`);

    return {
      data,
      latencyMs,
      fromCache: false,
      retried,
      circuitState: circuitState.isOpen ? "open" : "closed",
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    circuitState.failureCount++;
    circuitState.lastFailure = Date.now();
    incrementCounter(`gateway.${tool}.failure`);

    if (error instanceof TaskCancelledError) {
      if (signal?.aborted) {
        throw error;
      }
      throw new GatewayError(
        "Request timed out. Please try again.",
        408,
        tool,
        true
      );
    }

    if (error instanceof GatewayError) {
      throw error;
    }

    const status =
      error instanceof Error && "status" in error
        ? (error as any).status
        : 500;
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred";

    const retriable = status >= 500 || status === 408 || status === 429;

    logger.error(
      `${tool} request failed after ${latencyMs}ms: ${message}`
    );

    throw new GatewayError(message, status, tool, retriable);
  }
}

export function getCircuitStatus(tool: ToolName): {
  isOpen: boolean;
  failureCount: number;
  lastFailure: number;
} {
  const state = circuits.get(`tool:${tool}`);
  if (!state) {
    return { isOpen: false, failureCount: 0, lastFailure: 0 };
  }
  return {
    isOpen: state.isOpen,
    failureCount: state.failureCount,
    lastFailure: state.lastFailure,
  };
}

export function resetCircuit(tool: ToolName): void {
  circuits.delete(`tool:${tool}`);
}

export function getAllCircuitStatuses(): Record<
  string,
  { isOpen: boolean; failureCount: number }
> {
  const statuses: Record<string, { isOpen: boolean; failureCount: number }> =
    {};
  for (const [key, state] of circuits) {
    statuses[key] = {
      isOpen: state.isOpen,
      failureCount: state.failureCount,
    };
  }
  return statuses;
}
