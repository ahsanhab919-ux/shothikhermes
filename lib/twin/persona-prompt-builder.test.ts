import { describe, it, expect } from 'vitest';
import { buildPersonaPrompt } from './persona-prompt-builder';
import type { StyleProfile } from './style-extractor';

const PROFILE = {
  name: 'Ada',
  persona: 'A precise engineer',
  communicationStyle: 'formal' as const,
};

const STYLE: StyleProfile = {
  avgSentenceLength: 18,
  formalityScore: 70,
  vocabularyComplexity: 60,
  domainKeywords: ['systems', 'latency'],
  preferredStructures: ['lead with the conclusion'],
  toneDescriptor: 'measured',
  writingPatterns: ['short paragraphs'],
};

const HEURISTIC_MARKER = '--- Extracted Writing Style Profile (replicate this voice) ---';
const WRITING_MD_MARKER = 'Author voice (WRITING.md)';

describe('buildPersonaPrompt (WRITING.md augmentation)', () => {
  it('appends the WRITING.md block when writingMd is present', () => {
    const md = '# WRITING.md\nUse plain, direct sentences. Avoid jargon.';
    const prompt = buildPersonaPrompt(PROFILE, STYLE, md);

    expect(prompt).toContain(WRITING_MD_MARKER);
    expect(prompt).toContain('Use plain, direct sentences.');
  });

  it('keeps the heuristic StyleProfile block alongside WRITING.md (augment, not replace)', () => {
    const prompt = buildPersonaPrompt(PROFILE, STYLE, '# WRITING.md\nvoice');

    // Both signals coexist.
    expect(prompt).toContain(HEURISTIC_MARKER);
    expect(prompt).toContain('Domain vocabulary to incorporate: systems, latency');
    expect(prompt).toContain(WRITING_MD_MARKER);
  });

  it('is byte-identical to today when no writingMd is supplied', () => {
    const without = buildPersonaPrompt(PROFILE, STYLE);
    const undef = buildPersonaPrompt(PROFILE, STYLE, undefined);
    const empty = buildPersonaPrompt(PROFILE, STYLE, '   ');

    expect(undef).toBe(without);
    expect(empty).toBe(without);
    expect(without).not.toContain(WRITING_MD_MARKER);
  });

  it('truncates an oversized WRITING.md to 4000 chars', () => {
    const md = 'x'.repeat(9000);
    const prompt = buildPersonaPrompt(PROFILE, STYLE, md);
    expect(prompt).toContain('x'.repeat(4000));
    expect(prompt).not.toContain('x'.repeat(4001));
  });
});
