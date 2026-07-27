import { describe, it, expect } from 'vitest';
import {
  runEngine,
  review,
  adjudicate,
  verifyEdit,
  verifyMechanicalEdit,
  type EngineConfig,
  type RegisteredGuard,
} from './engine';
import type { MeaningVerifier } from './entailment';
import { STANDARD, PARAPHRASE } from './profiles';
import { terminology, type TerminologyRule } from './guards/terminology';
import { pii } from './guards/pii';
import { readability } from './guards/readability';
import { verifyChain, type LedgerMeta } from './ledger';
import type { Issue, Span } from './types';

const META: LedgerMeta = {
  manuscript: 'doc_engine',
  writing_md_version: 'wmd_v1',
  anchors: [],
};

// Non-cascading rule: the fixed term is NOT itself flagged, so a valid fix
// stays fixed. diff 'utilise'->'utilize' is 0.14, within STANDARD's 0.15 bound.
const APPLY_RULES: TerminologyRule[] = [{ avoid: 'utilise', prefer: 'utilize' }];
// Out-of-bound rule: 'utilize'->'use' is diff 0.71, over the 0.15 bound.
const REVERT_RULES: TerminologyRule[] = [{ avoid: 'utilize', prefer: 'use' }];

type BaseOverrides = Partial<EngineConfig> & { termRules?: TerminologyRule[] };

function baseConfig(over: BaseOverrides = {}): EngineConfig {
  const { termRules = APPLY_RULES, ...rest } = over;
  const guards: RegisteredGuard[] = [
    { name: 'terminology', category: 'terminology', run: terminology, ctx: { rules: termRules } },
    { name: 'pii', category: 'pii', run: pii },
    { name: 'readability', category: 'readability', run: readability },
  ];
  return { profile: STANDARD, guards, anchors: [], meta: META, ...rest };
}

describe('REVIEW stage', () => {
  it('aggregates issues from every registered guard', async () => {
    const text = 'Please utilise the form. Email me at a@b.com.';
    const issues = await review(baseConfig(), text);
    const cats = new Set(issues.map((i) => i.category));
    expect(cats.has('terminology')).toBe(true);
    expect(cats.has('pii')).toBe(true);
  });

  it('returns issues sorted by span start', async () => {
    const text = 'Please utilise the form. Email me at a@b.com.';
    const issues = await review(baseConfig(), text);
    const starts = issues.map((i) => i.span.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('merges semantic-reviewer findings when present', async () => {
    const semanticReview = (_t: string): Issue[] => [
      {
        category: 'clarity',
        span: { start: 0, end: 3 },
        severity: 'minor',
        rationale: 'semantic',
        text: 'foo',
      },
    ];
    const issues = await review(baseConfig({ semanticReview }), 'foo utilise bar');
    expect(issues.some((i) => i.category === 'clarity')).toBe(true);
  });
});

describe('VERDICT stage', () => {
  it('assigns profile verdicts when no anchors overlap', async () => {
    const issues = await review(baseConfig(), 'Please utilise this. a@b.com');
    const adj = adjudicate(baseConfig(), issues);
    const term = adj.find((a) => a.issue.category === 'terminology');
    const piiAdj = adj.find((a) => a.issue.category === 'pii');
    expect(term?.verdict).toBe('auto-fixable');
    expect(piiAdj?.verdict).toBe('author-required');
  });

  it('freezes any issue overlapping a frozen anchor', async () => {
    const text = 'Please utilise the form.';
    // Anchor covers the whole sentence including "utilise".
    const anchors: Span[] = [{ start: 0, end: text.length }];
    const issues = await review(baseConfig({ anchors }), text);
    const adj = adjudicate(baseConfig({ anchors }), issues);
    const term = adj.find((a) => a.issue.category === 'terminology');
    expect(term?.overlapsAnchor).toBe(true);
    expect(term?.verdict).toBe('author-required');
    expect(term?.maxDiff).toBe(0);
  });
});

describe('runEngine — full pipeline', () => {
  it('applies an in-bound mechanical fix and records it in the ledger', async () => {
    const res = await runEngine(baseConfig(), 'Please utilise the form.');
    expect(res.text).toBe('Please utilize the form.');
    const applied = res.outcomes.filter((o) => o.disposition === 'applied');
    expect(applied).toHaveLength(1);
    expect(applied[0].edit).toEqual({
      before: 'utilise',
      after: 'utilize',
      reason: expect.any(String),
    });
    expect(res.ledger.entries).toHaveLength(1);
  });

  it('produces a ledger that passes chain verification', async () => {
    const res = await runEngine(baseConfig(), 'Please utilise the form.');
    expect(verifyChain(res.ledger)).toEqual({ valid: true, brokenAt: -1 });
  });

  it('reverts and re-queues an out-of-bound mechanical edit (never applied)', async () => {
    // "utilize" -> "use" is diff 0.71, over STANDARD terminology bound 0.15.
    const res = await runEngine(baseConfig({ termRules: REVERT_RULES }), 'Please utilize the form.');
    expect(res.text).toBe('Please utilize the form.'); // unchanged
    const reverted = res.outcomes.find((o) => o.disposition === 'reverted-requeued');
    expect(reverted).toBeDefined();
    expect(reverted?.note).toContain('reverted');
    expect(res.ledger.entries).toHaveLength(0);
  });

  it('never edits PII — always author-required, text untouched', async () => {
    const res = await runEngine(baseConfig(), 'Reach me at jane@example.com please.');
    expect(res.text).toBe('Reach me at jane@example.com please.');
    const piiOut = res.outcomes.find((o) => o.issue.category === 'pii');
    expect(piiOut?.disposition).toBe('author-required');
    expect(piiOut?.edit).toBeUndefined();
  });

  it('proposes (does not apply) a readability issue under STANDARD', async () => {
    const long = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ') + '.';
    const res = await runEngine(baseConfig(), long);
    const read = res.outcomes.find((o) => o.issue.category === 'readability');
    expect(read?.verdict).toBe('propose');
    expect(read?.disposition).toBe('proposed');
    expect(res.text).toBe(long); // proposals are never auto-applied
  });

  it('does not apply edits inside a frozen anchor', async () => {
    const text = 'Please utilise the form.';
    const anchors: Span[] = [{ start: 0, end: text.length }];
    const res = await runEngine(baseConfig({ anchors }), text);
    expect(res.text).toBe(text);
    expect(res.ledger.entries).toHaveLength(0);
    const term = res.outcomes.find((o) => o.issue.category === 'terminology');
    expect(term?.disposition).toBe('author-required');
  });

  it('applies multiple edits with correct offset bookkeeping', async () => {
    const res = await runEngine(baseConfig(), 'utilise this and utilise that.');
    expect(res.text).toBe('utilize this and utilize that.');
    expect(res.ledger.entries).toHaveLength(2);
    expect(verifyChain(res.ledger).valid).toBe(true);
  });

  it('is deterministic: same input yields identical text and ledger hashes', async () => {
    const run = () => runEngine(baseConfig(), 'Please utilise the form here.');
    const a = await run();
    const b = await run();
    expect(a.text).toBe(b.text);
    expect(a.ledger.entries.map((e) => e.hash)).toEqual(
      b.ledger.entries.map((e) => e.hash),
    );
  });
});

describe('Paraphrase = config, not new code', () => {
  it('same engine + PARAPHRASE profile changes disposition without code changes', async () => {
    // readability is "propose" in STANDARD but "auto-fixable" in PARAPHRASE.
    // The readability guard emits no suggestion, so PARAPHRASE routes it to the
    // "auto-fixable but no mechanical suggestion -> proposed/deferred" branch
    // rather than author-required. This proves the profile alone drives behavior.
    const long = Array.from({ length: 35 }, (_, i) => `word${i}`).join(' ') + '.';

    const std = await runEngine(baseConfig({ profile: STANDARD }), long);
    const para = await runEngine(baseConfig({ profile: PARAPHRASE }), long);

    const stdRead = std.outcomes.find((o) => o.issue.category === 'readability');
    const paraRead = para.outcomes.find((o) => o.issue.category === 'readability');

    expect(stdRead?.verdict).toBe('propose');
    expect(paraRead?.verdict).toBe('auto-fixable');
    // Both leave text unchanged (no mechanical suggestion), but the verdict flip
    // came purely from swapping the profile object — no engine code changed.
    expect(std.text).toBe(long);
    expect(para.text).toBe(long);
  });
});

describe('VERIFY gate selection (Phase 2 #5 — meaning preservation)', () => {
  const yesVerifier: MeaningVerifier = { name: 'yes', verify: async () => true };
  const noVerifier: MeaningVerifier = { name: 'no', verify: async () => false };

  // A semantic issue whose category has no deterministic guard.
  const semanticIssue: Issue = {
    category: 'clarity',
    span: { start: 0, end: 5 },
    severity: 'minor',
    rationale: 'unclear',
    text: 'Hello',
  };
  const editedSpan: Span = { start: 0, end: 5 };

  it('keeps a semantic edit only when the meaning verifier confirms', async () => {
    const cfg = baseConfig({ meaningVerifier: yesVerifier });
    const ok = await verifyEdit(cfg, semanticIssue, editedSpan, 'Howdy world', 'Hello', 'Howdy', 1);
    expect(ok).toBe(true);
  });

  it('reverts a semantic edit when the verifier denies meaning preservation', async () => {
    const cfg = baseConfig({ meaningVerifier: noVerifier });
    const ok = await verifyEdit(cfg, semanticIssue, editedSpan, 'Howdy world', 'Hello', 'Howdy', 1);
    expect(ok).toBe(false);
  });

  it('fails closed for a semantic edit when NO verifier is configured', async () => {
    const cfg = baseConfig(); // no meaningVerifier
    const ok = await verifyEdit(cfg, semanticIssue, editedSpan, 'Howdy world', 'Hello', 'Howdy', 1);
    expect(ok).toBe(false);
  });

  it('still enforces the diff-bound gate before ever consulting the verifier', async () => {
    const cfg = baseConfig({ meaningVerifier: yesVerifier });
    // A huge diff exceeds the bound (maxDiff 0.1) — fails without asking the verifier.
    const ok = await verifyEdit(cfg, semanticIssue, editedSpan, 'X', 'Hello', 'X', 0.1);
    expect(ok).toBe(false);
  });

  it('a mechanical edit ignores the meaning verifier and uses the guard re-run', async () => {
    // terminology 'utilise'->'utilize' is a valid, non-cascading mechanical fix.
    const cfg = baseConfig({ meaningVerifier: noVerifier }); // would block if consulted
    const issue: Issue = {
      category: 'terminology',
      span: { start: 7, end: 14 },
      severity: 'minor',
      rationale: 'term',
      text: 'utilise',
    };
    const edited = 'Please utilize the form.';
    const span: Span = { start: 7, end: 14 };
    const ok = await verifyEdit(cfg, issue, span, edited, 'utilise', 'utilize', 0.15);
    // Passes on the guard re-run despite the (irrelevant) denying verifier.
    expect(ok).toBe(true);
    // The synchronous mechanical gate agrees.
    expect(verifyMechanicalEdit(cfg, issue, span, edited, 'utilise', 'utilize', 0.15)).toBe(true);
  });
});
