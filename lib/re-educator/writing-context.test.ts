import { describe, it, expect } from 'vitest';
import {
  parseWritingContext,
  deriveVersionTag,
  readWritingContext,
  EMPTY_WRITING_CONTEXT,
} from './writing-context';

/**
 * Phase 1 #3 — WRITING.md -> guard-context reader.
 *
 * The contract we pin:
 *   - a stable version tag per WRITING.md revision (auditability),
 *   - conservative extraction of ONLY unambiguous structure into guard options,
 *   - and the non-negotiable: readWritingContext never throws — Letta being down
 *     or the block being absent degrades to the deterministic-only path.
 */

describe('deriveVersionTag', () => {
  it('returns "none" for empty/whitespace content', () => {
    expect(deriveVersionTag('')).toBe('none');
    expect(deriveVersionTag('   \n  ')).toBe('none');
  });

  it('is stable and content-addressed', () => {
    const a = deriveVersionTag('# WRITING.md\nhello');
    const b = deriveVersionTag('# WRITING.md\nhello');
    expect(a).toBe(b);
    expect(a).toMatch(/^wmd:[0-9a-f]{12}$/);
  });

  it('changes when content changes', () => {
    expect(deriveVersionTag('one')).not.toBe(deriveVersionTag('two'));
  });
});

describe('parseWritingContext — terminology extraction', () => {
  it('parses arrow, "instead of", and "prefer over" forms', () => {
    const md = [
      '## Terminology & Style',
      '- utilize -> use',
      '- Use "colour" instead of "color"',
      '- prefer "email" over "e-mail"',
    ].join('\n');
    const { guardOptions } = parseWritingContext(md);
    const rules = guardOptions.terminologyRules ?? [];
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ avoid: 'utilize', prefer: 'use' }),
        expect.objectContaining({ avoid: 'color', prefer: 'colour' }),
        expect.objectContaining({ avoid: 'e-mail', prefer: 'email' }),
      ]),
    );
  });

  it('skips template placeholder lines and self-referential rules', () => {
    const md = [
      '## Terminology & Style',
      '_Preferred terms, spellings, formatting rules, citation style._',
      '- foo -> foo',
    ].join('\n');
    const { guardOptions } = parseWritingContext(md);
    expect(guardOptions.terminologyRules).toBeUndefined();
  });

  it('dedupes rules by avoid term', () => {
    const md = '## Terminology & Style\n- utilize -> use\n- utilize -> employ';
    const { guardOptions } = parseWritingContext(md);
    expect(guardOptions.terminologyRules).toHaveLength(1);
    expect(guardOptions.terminologyRules![0].prefer).toBe('use');
  });
});

describe('parseWritingContext — voice profile', () => {
  it('captures Voice & Tone as referenceText and Don\'t items as bannedPhrases', () => {
    const md = [
      '## Voice & Tone',
      'Clear, warm, direct. Short sentences.',
      '',
      "## Do / Don't",
      '- Do: use active voice',
      "- Don't: leverage",
      "- Don't: synergy",
    ].join('\n');
    const { guardOptions } = parseWritingContext(md);
    expect(guardOptions.voiceProfile?.referenceText).toContain('Clear, warm, direct');
    expect(guardOptions.voiceProfile?.bannedPhrases).toEqual(
      expect.arrayContaining(['leverage', 'synergy']),
    );
    // "use active voice" is a Do, not a Don't — must not be banned.
    expect(guardOptions.voiceProfile?.bannedPhrases).not.toContain('use active voice');
  });
});

describe('parseWritingContext — empty/degenerate input', () => {
  it('returns EMPTY_WRITING_CONTEXT for empty content', () => {
    expect(parseWritingContext('')).toEqual(EMPTY_WRITING_CONTEXT);
  });

  it('tags version even when nothing parses into guard options', () => {
    const { guardOptions, writingMdVersion } = parseWritingContext('# Notes\njust prose');
    expect(guardOptions).toEqual({});
    expect(writingMdVersion).toMatch(/^wmd:/);
  });

  it('the DEFAULT template (all placeholders) yields no guard options', () => {
    const def = [
      '# WRITING.md',
      '## Voice & Tone',
      '_Describe how you want to sound._',
      '## Terminology & Style',
      '_Preferred terms._',
      "## Do / Don't",
      '- Do:',
      "- Don't:",
    ].join('\n');
    const { guardOptions } = parseWritingContext(def);
    expect(guardOptions.terminologyRules).toBeUndefined();
    // Voice referenceText is placeholder-only; no banned phrases.
    expect(guardOptions.voiceProfile?.bannedPhrases).toBeUndefined();
  });
});

describe('readWritingContext — best-effort, never throws', () => {
  it('parses when the fetcher returns content', async () => {
    const ctx = await readWritingContext('u1', async () => '## Terminology & Style\n- utilize -> use');
    expect(ctx.guardOptions.terminologyRules?.[0]).toMatchObject({ avoid: 'utilize', prefer: 'use' });
    expect(ctx.writingMdVersion).toMatch(/^wmd:/);
  });

  it('degrades to empty when the fetcher returns null (no block)', async () => {
    const ctx = await readWritingContext('u1', async () => null);
    expect(ctx).toEqual(EMPTY_WRITING_CONTEXT);
  });

  it('degrades to empty when the fetcher throws (Letta down)', async () => {
    const ctx = await readWritingContext('u1', async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(ctx).toEqual(EMPTY_WRITING_CONTEXT);
  });
});
