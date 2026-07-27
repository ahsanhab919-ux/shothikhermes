import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import logger from '@/lib/logger';
import {
  incrementCounter,
  maybeLogMetrics,
  recordDistribution,
} from '@/lib/runtime-metrics';

interface UsagePayload {
  userId: string;
  tool: string;
  provider: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function trackUsageSafe(
  convex: ConvexHttpClient,
  payload: UsagePayload,
  maxRetries = 2
): Promise<void> {
  const trackUsageMutation = api.llmUsage.trackUsage;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await convex.mutation(trackUsageMutation, payload);
      incrementCounter('llm.usage.track.success');
      incrementCounter('llm.usage.tokens.total', payload.tokens);
      incrementCounter('llm.usage.input_tokens.total', payload.inputTokens);
      incrementCounter('llm.usage.output_tokens.total', payload.outputTokens);
      incrementCounter('llm.usage.cost_usd.total', payload.costUsd);
      incrementCounter(`llm.usage.provider.${payload.provider}.calls`);
      incrementCounter(`llm.usage.tool.${payload.tool}.calls`);
      recordDistribution('llm.usage.cost_usd.per_call', payload.costUsd);
      recordDistribution('llm.usage.tokens.per_call', payload.tokens);
      maybeLogMetrics();
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        incrementCounter('llm.usage.track.failure');
        logger.error('[usage-tracking] Failed to track LLM usage after retries', {
          tool: payload.tool,
          userId: payload.userId,
          tokens: payload.tokens,
          costUsd: payload.costUsd,
          error: err instanceof Error ? err.message : String(err),
        });
        maybeLogMetrics();
      } else {
        const backoffMs = 200 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
}
