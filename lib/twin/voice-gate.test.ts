import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock the LLM gateway so the loop touches no network; capture requests so we can
// assert how many generations ran and what repair feedback was threaded through.
vi.mock('@/lib/llm/gateway', () => ({
  completeForTool: vi.fn(),
}));

import { completeForTool } from '@/lib/llm/gateway';
import { DEFAULT_WRITING_MD } from '@/lib/letta';
import type { Issue } from '@/lib/re-educator/types';
import {
  passesVoiceGate,
  extractBannedPhrases,
  generateWithVoiceGate,
  hasTimeBudget,
  DRIFT_RATIO_THRESHOLD,
} from './writing-voice';

const complete = completeForTool as unknown as Mock;

const TASK = {
  title: 'Announce the launch',
  description: 'Keep it short',
  taskType: 'writing' as const,
};
const PROFILE = { name: 'Ada', communicationStyle: 'formal' as const };

// Reference voice + a Do/Don't section so the banned-phrase gate has teeth.
const WRITING_MD = [
  '# WRITING.md',
  'Write in short, warm, plain sentences. Keep a calm, personal tone.',
  '',
  '## Don\'t',
  '- "synergy"',
  '- "leverage"',
].join('\n');

// Short sentences (<5 non-stopword tokens each) never trip the lexical-drift
// guard and contain no banned phrase → the gate passes.
const CLEAN = 'The launch is live. Thanks everyone.';
// Contains banned phrases → deterministic minor findings → the gate blocks.
const BANNED = 'We must leverage synergy now.';

function issue(severity: Issue['severity']): Issue {
  return {
    category: 'voice-drift',
    span: { start: 0, end: 1 },
    severity,
    rationale: `${severity} finding`,
    text: 'x',
    source: 'voice-drift',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('passesVoiceGate', () => {
  it('blocks on any banned-phrase (minor) finding', () => {
    const gate = passesVoiceGate([issue('minor')], 10);
    expect(gate.passed).toBe(false);
    expect(gate.blockingFindings).toHaveLength(1);
  });

  it('does NOT block on a single lexical-drift (info) finding', () => {
    const gate = passesVoiceGate([issue('info')], 10); // ratio 0.1 <= 0.30
    expect(gate.passed).toBe(true);
    expect(gate.blockingFindings).toHaveLength(0);
  });

  it('blocks when the drifted-sentence ratio exceeds the threshold', () => {
    const gate = passesVoiceGate([issue('info'), issue('info')], 3); // ratio 0.66 > 0.30
    expect(gate.passed).toBe(false);
    expect(gate.blockingFindings).toHaveLength(2);
    expect(2 / 3).toBeGreaterThan(DRIFT_RATIO_THRESHOLD);
  });

  // F4: the denominator is now the QUALIFYING-sentence count (drifted / qualifying),
  // so a lone drift in a single-qualifying-sentence doc is ratio 1.0 and blocks —
  // whereas diluting it with many short/non-qualifying sentences would not.
  it('blocks a single drift when it is the only qualifying sentence (ratio 1.0)', () => {
    const gate = passesVoiceGate([issue('info')], 1);
    expect(gate.passed).toBe(false);
    expect(gate.blockingFindings).toHaveLength(1);
  });

  it('does NOT block a single drift diluted across many qualifying sentences', () => {
    const gate = passesVoiceGate([issue('info')], 20); // ratio 0.05 <= 0.30
    expect(gate.passed).toBe(true);
    expect(gate.blockingFindings).toHaveLength(0);
  });
});

describe('hasTimeBudget', () => {
  it('is true while elapsed < budget and false once the budget is reached', () => {
    expect(hasTimeBudget(1000, 1000 + 59_999, 60_000)).toBe(true);
    expect(hasTimeBudget(1000, 1000 + 60_000, 60_000)).toBe(false);
    expect(hasTimeBudget(1000, 1000 + 90_000, 60_000)).toBe(false);
  });
});

describe('extractBannedPhrases', () => {
  it('extracts quoted phrases from a WRITING.md Don\'t section', () => {
    expect(extractBannedPhrases(WRITING_MD)).toEqual(['synergy', 'leverage']);
  });

  it('returns [] when there is no Don\'t section', () => {
    expect(extractBannedPhrases('# WRITING.md\nJust prose, no lists.')).toEqual([]);
  });

  it('returns [] for undefined input', () => {
    expect(extractBannedPhrases(undefined)).toEqual([]);
  });

  // F1: the shipped default ships a combined "## Do / Don't" heading with empty
  // inline sub-labels — it must yield NO banned phrases (and never "Do:"/"Don't:").
  it('yields no bogus banned phrases from the DEFAULT_WRITING_MD scaffold', () => {
    const banned = extractBannedPhrases(DEFAULT_WRITING_MD);
    expect(banned).toEqual([]);
    expect(banned).not.toContain('Do:');
    expect(banned).not.toContain("Don't:");
  });

  it('parses a combined "## Do / Don\'t" heading into bare Don\'t terms only', () => {
    const md = [
      '## Do / Don\'t',
      '- Do: use short warm sentences',
      '- Don\'t: use jargon',
      '- Don\'t: say synergy',
    ].join('\n');
    // The Do rule is excluded; Don't items lose their label prefix.
    expect(extractBannedPhrases(md)).toEqual(['use jargon', 'say synergy']);
  });
});

describe('generateWithVoiceGate', () => {
  it('passes on the first try → exactly 1 generation, repairAttempts 0', async () => {
    complete.mockResolvedValue({ text: CLEAN });

    const res = await generateWithVoiceGate({
      task: TASK,
      profile: PROFILE,
      writingMd: WRITING_MD,
    });

    expect(complete).toHaveBeenCalledTimes(1);
    expect(res.voiceGatePassed).toBe(true);
    expect(res.repairAttempts).toBe(0);
    expect(res.bestEffort).toBe(false);
    expect(res.text).toBe(CLEAN);
  });

  it('repairs a banned-phrase draft then accepts the clean regen', async () => {
    complete
      .mockResolvedValueOnce({ text: BANNED })
      .mockResolvedValueOnce({ text: CLEAN });

    const res = await generateWithVoiceGate({
      task: TASK,
      profile: PROFILE,
      writingMd: WRITING_MD,
    });

    expect(complete).toHaveBeenCalledTimes(2);
    expect(res.voiceGatePassed).toBe(true);
    expect(res.repairAttempts).toBe(1);
    expect(res.bestEffort).toBe(false);
    expect(res.text).toBe(CLEAN);

    // The repair feedback must be threaded into the SECOND executeTask call.
    const secondPrompt = complete.mock.calls[1][1].prompt as string;
    expect(secondPrompt).toContain('Revise to fix');
    expect(secondPrompt).toContain('Avoid these phrases entirely');
    expect(secondPrompt).toContain('synergy');
    // The first call is the initial generation — no repair block.
    const firstPrompt = complete.mock.calls[0][1].prompt as string;
    expect(firstPrompt).not.toContain('Revise to fix');
  });

  it('returns best-effort flagged text when it never converges', async () => {
    complete.mockResolvedValue({ text: BANNED });

    const res = await generateWithVoiceGate({
      task: TASK,
      profile: PROFILE,
      writingMd: WRITING_MD,
    });

    // 1 initial + 2 repairs (maxAttempts default = 2).
    expect(complete).toHaveBeenCalledTimes(3);
    expect(res.voiceGatePassed).toBe(false);
    expect(res.bestEffort).toBe(true);
    expect(res.repairAttempts).toBe(2);
    expect(res.text).toBe(BANNED);
    expect(res.finalFindings.length).toBeGreaterThan(0);
  });

  it('stops issuing new attempts once the wall-clock budget is exceeded (best-effort)', async () => {
    // Each generation advances the fake clock past the budget; the first attempt
    // always runs, then the budget check short-circuits any repair.
    let t = 0;
    complete.mockImplementation(async () => {
      t += 100_000; // one generation blows the 60s budget
      return { text: BANNED };
    });

    const res = await generateWithVoiceGate({
      task: TASK,
      profile: PROFILE,
      writingMd: WRITING_MD,
      maxTotalMs: 60_000,
      now: () => t,
    });

    // Only the first generation ran; no repair was issued.
    expect(complete).toHaveBeenCalledTimes(1);
    expect(res.voiceGatePassed).toBe(false);
    expect(res.bestEffort).toBe(true);
    expect(res.repairAttempts).toBe(0);
    expect(res.text).toBe(BANNED);
  });

  it('is a no-op gate (1 generation, passed) when writingMd is absent', async () => {
    complete.mockResolvedValue({ text: BANNED });

    const res = await generateWithVoiceGate({ task: TASK, profile: PROFILE });

    expect(complete).toHaveBeenCalledTimes(1);
    expect(res.voiceGatePassed).toBe(true);
    expect(res.repairAttempts).toBe(0);
    expect(res.bestEffort).toBe(false);
    expect(res.finalFindings).toEqual([]);
    expect(res.text).toBe(BANNED);
  });
});
