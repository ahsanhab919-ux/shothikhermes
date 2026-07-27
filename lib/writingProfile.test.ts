import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock the Convex transport (the ported storage seam) and the Letta agent
// factory so no network is touched.
vi.mock('@/lib/second-me/convex-second-me-client', () => ({
  runSecondMeQuery: vi.fn(),
  runSecondMeMutation: vi.fn(),
}));

vi.mock('@/lib/letta', () => ({
  createWritingAgent: vi.fn(),
  DEFAULT_WRITING_MD: '# WRITING.md\ndefault',
  WRITING_MD_BLOCK_LABEL: 'writing_md',
}));

import { runSecondMeQuery, runSecondMeMutation } from '@/lib/second-me/convex-second-me-client';
import { createWritingAgent, DEFAULT_WRITING_MD } from '@/lib/letta';
import { getOrCreateWritingProfile } from './writingProfile';

const query = runSecondMeQuery as unknown as Mock;
const mutation = runSecondMeMutation as unknown as Mock;
const createAgent = createWritingAgent as unknown as Mock;

const USER = 'user-abc';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getOrCreateWritingProfile', () => {
  it('returns the existing profile without provisioning a new agent', async () => {
    query.mockResolvedValue({
      userId: USER,
      lettaAgentId: 'agent-existing',
      blockLabel: 'writing_md',
      modelHandle: 'openai/gpt-4o-mini',
      lastContentLength: 42,
      lastSyncedAt: 1000,
    });

    const profile = await getOrCreateWritingProfile(USER);

    expect(profile).toMatchObject({
      userId: USER,
      lettaAgentId: 'agent-existing',
      blockLabel: 'writing_md',
      modelHandle: 'openai/gpt-4o-mini',
    });
    // No agent provisioned, no row inserted.
    expect(createAgent).not.toHaveBeenCalled();
    expect(mutation).not.toHaveBeenCalled();
  });

  it('provisions ONE agent + inserts a row on first use', async () => {
    query.mockResolvedValue(null);
    createAgent.mockResolvedValue('agent-new');
    mutation.mockImplementation(async (_path, args) => ({
      userId: args.userId,
      lettaAgentId: args.lettaAgentId,
      blockLabel: args.blockLabel,
      lastContentLength: args.lastContentLength,
      lastSyncedAt: 2000,
    }));

    const profile = await getOrCreateWritingProfile(USER);

    expect(createAgent).toHaveBeenCalledTimes(1);
    expect(createAgent).toHaveBeenCalledWith(USER, DEFAULT_WRITING_MD);
    expect(mutation).toHaveBeenCalledWith('secondMePersistence:createWritingProfile', {
      userId: USER,
      lettaAgentId: 'agent-new',
      blockLabel: 'writing_md',
      lastContentLength: DEFAULT_WRITING_MD.length,
    });
    expect(profile.lettaAgentId).toBe('agent-new');
  });

  it('is idempotent: create-then-get provisions the agent only once', async () => {
    // First call: no row → provision + insert.
    query.mockResolvedValueOnce(null);
    createAgent.mockResolvedValue('agent-once');
    const created = {
      userId: USER,
      lettaAgentId: 'agent-once',
      blockLabel: 'writing_md',
      lastContentLength: DEFAULT_WRITING_MD.length,
      lastSyncedAt: 3000,
    };
    mutation.mockResolvedValue(created);

    const first = await getOrCreateWritingProfile(USER);

    // Second call: the row now exists → short-circuit, no new agent.
    query.mockResolvedValueOnce(created);
    const second = await getOrCreateWritingProfile(USER);

    expect(first.lettaAgentId).toBe('agent-once');
    expect(second.lettaAgentId).toBe('agent-once');
    expect(createAgent).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledTimes(1);
  });

  it('provisions at most ONE agent under concurrent first-calls (race guard)', async () => {
    // Both concurrent callers see no existing row (first-request race). Without
    // the in-flight reservation, each would fire createWritingAgent, orphaning a
    // Letta agent.
    query.mockResolvedValue(null);
    let agentSeq = 0;
    createAgent.mockImplementation(async () => {
      // Yield so a second concurrent caller can interleave before we resolve.
      await new Promise((resolve) => setTimeout(resolve, 0));
      agentSeq += 1;
      return `agent-${agentSeq}`;
    });
    mutation.mockImplementation(async (_path, args) => ({
      userId: args.userId,
      lettaAgentId: args.lettaAgentId,
      blockLabel: args.blockLabel,
      lastContentLength: args.lastContentLength,
      lastSyncedAt: 4000,
    }));

    const [a, b] = await Promise.all([
      getOrCreateWritingProfile(USER),
      getOrCreateWritingProfile(USER),
    ]);

    // Exactly one external agent minted, one row insert, and both callers get it.
    expect(createAgent).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(a.lettaAgentId).toBe('agent-1');
    expect(b.lettaAgentId).toBe('agent-1');
  });
});
