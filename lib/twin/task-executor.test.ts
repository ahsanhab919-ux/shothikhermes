import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock the LLM gateway so no network is touched; capture the request so we can
// assert what got folded into the system prompt.
vi.mock('@/lib/llm/gateway', () => ({
  completeForTool: vi.fn(),
}));

import { completeForTool } from '@/lib/llm/gateway';
import { executeTask } from './task-executor';

const complete = completeForTool as unknown as Mock;

const TASK = {
  title: 'Announce the launch',
  description: 'Keep it short',
  taskType: 'writing' as const,
};

const PROFILE = { name: 'Ada', communicationStyle: 'formal' as const };

const GENERATED = 'The launch is live. Thank you all.';

beforeEach(() => {
  vi.clearAllMocks();
  complete.mockResolvedValue({ text: GENERATED });
});

describe('executeTask (WRITING.md voice)', () => {
  it('folds writingMd into the system prompt when present', async () => {
    const md = '# WRITING.md\nWrite warmly, in first person.';
    await executeTask(TASK, PROFILE, null, md);

    expect(complete).toHaveBeenCalledTimes(1);
    const [tool, request] = complete.mock.calls[0];
    expect(tool).toBe('twin-task');
    expect(request.systemInstruction).toContain('Author voice (WRITING.md)');
    expect(request.systemInstruction).toContain('Write warmly, in first person.');
  });

  it('returns the gateway text unchanged (annotation must not rewrite)', async () => {
    const result = await executeTask(TASK, PROFILE, null, '# WRITING.md\nvoice');
    expect(result).toBe(GENERATED);
  });

  it('falls back to heuristic-only when writingMd is undefined (no throw, no WRITING.md block)', async () => {
    const result = await executeTask(TASK, PROFILE, null);

    expect(result).toBe(GENERATED);
    const [, request] = complete.mock.calls[0];
    expect(request.systemInstruction).not.toContain('Author voice (WRITING.md)');
  });
});
