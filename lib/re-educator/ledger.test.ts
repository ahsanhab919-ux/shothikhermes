import { describe, it, expect } from 'vitest';
import {
  createLedger,
  appendEntry,
  verifyChain,
  genesisHash,
  computeEntryHash,
  canonicalize,
  type LedgerMeta,
  type LedgerEntryInput,
} from './ledger';

const META: LedgerMeta = {
  manuscript: 'doc_001',
  writing_md_version: 'wmd_abc123',
  anchors: [{ start: 0, end: 10 }],
};

function makeInput(id: string, over: Partial<LedgerEntryInput> = {}): LedgerEntryInput {
  return {
    issue_id: id,
    span: { start: 100, end: 120 },
    category: 'voice-drift',
    severity: 'minor',
    verdict: 'propose',
    edit: { before: 'utilise', after: 'use', reason: 'WRITING.md tone rule #3' },
    verify: { guard: 'voice-drift', before_score: 0.71, after_score: 0.12, result: 'pass' },
    ...over,
  };
}

describe('canonicalize', () => {
  it('is key-order independent', () => {
    expect(canonicalize({ a: 1, b: 2 })).toBe(canonicalize({ b: 2, a: 1 }));
  });

  it('sorts nested object keys but preserves array order', () => {
    expect(canonicalize({ x: [{ b: 1, a: 2 }] })).toBe('{"x":[{"a":2,"b":1}]}');
  });
});

describe('createLedger', () => {
  it('starts empty with the given meta', () => {
    const l = createLedger(META);
    expect(l.entries).toEqual([]);
    expect(l.meta).toEqual(META);
  });
});

describe('genesisHash', () => {
  it('is deterministic for the same meta', () => {
    expect(genesisHash(META)).toBe(genesisHash({ ...META }));
  });

  it('differs for different manuscripts', () => {
    expect(genesisHash(META)).not.toBe(genesisHash({ ...META, manuscript: 'doc_002' }));
  });
});

describe('appendEntry', () => {
  it('chains the first entry to the genesis hash', () => {
    const l = appendEntry(createLedger(META), makeInput('iss_001'));
    expect(l.entries).toHaveLength(1);
    expect(l.entries[0].prev_hash).toBe(genesisHash(META));
  });

  it('chains each entry to the previous entry hash', () => {
    let l = createLedger(META);
    l = appendEntry(l, makeInput('iss_001'));
    l = appendEntry(l, makeInput('iss_002'));
    expect(l.entries[1].prev_hash).toBe(l.entries[0].hash);
  });

  it('does not mutate the input ledger (append-only, immutable)', () => {
    const l0 = createLedger(META);
    const l1 = appendEntry(l0, makeInput('iss_001'));
    expect(l0.entries).toHaveLength(0);
    expect(l1.entries).toHaveLength(1);
    expect(l1).not.toBe(l0);
  });

  it("stores a hash matching the entry's own payload", () => {
    const l = appendEntry(createLedger(META), makeInput('iss_001'));
    const e = l.entries[0];
    const { prev_hash, hash, ...payload } = e;
    expect(computeEntryHash(prev_hash, payload)).toBe(hash);
  });

  it('is deterministic: identical build produces identical hashes', () => {
    const build = () => {
      let l = createLedger(META);
      l = appendEntry(l, makeInput('iss_001'));
      l = appendEntry(l, makeInput('iss_002'));
      return l;
    };
    expect(build().entries.map((e) => e.hash)).toEqual(build().entries.map((e) => e.hash));
  });
});

describe('verifyChain', () => {
  function threeEntryLedger() {
    let l = createLedger(META);
    l = appendEntry(l, makeInput('iss_001'));
    l = appendEntry(l, makeInput('iss_002', { category: 'readability' }));
    l = appendEntry(l, makeInput('iss_003', { verdict: 'auto-fixable' }));
    return l;
  }

  it('accepts an empty ledger', () => {
    expect(verifyChain(createLedger(META))).toEqual({ valid: true, brokenAt: -1 });
  });

  it('accepts an intact multi-entry chain', () => {
    expect(verifyChain(threeEntryLedger())).toEqual({ valid: true, brokenAt: -1 });
  });

  it('detects a tampered payload (edit text changed after commit)', () => {
    const l = threeEntryLedger();
    // Mutate a middle entry's edit without recomputing its hash.
    l.entries[1].edit.after = 'MALICIOUSLY CHANGED';
    const res = verifyChain(l);
    expect(res.valid).toBe(false);
    expect(res.brokenAt).toBe(1);
    expect(res.reason).toContain('tampered');
  });

  it('detects a broken prev_hash link', () => {
    const l = threeEntryLedger();
    l.entries[2].prev_hash = 'deadbeef';
    const res = verifyChain(l);
    expect(res.valid).toBe(false);
    expect(res.brokenAt).toBe(2);
    expect(res.reason).toContain('prev_hash');
  });

  it('detects a forged genesis (meta changed after entries committed)', () => {
    const l = threeEntryLedger();
    l.meta.manuscript = 'doc_switcheroo';
    const res = verifyChain(l);
    expect(res.valid).toBe(false);
    expect(res.brokenAt).toBe(0);
  });

  it('reports the FIRST broken index when multiple entries are corrupted', () => {
    const l = threeEntryLedger();
    l.entries[1].severity = 'major';
    l.entries[2].verdict = 'author-required';
    expect(verifyChain(l).brokenAt).toBe(1);
  });
});

describe('LedgerUsage — usage is a sibling of the chain, outside the hash (Phase 2 #6)', () => {
  function twoEntry() {
    let l = createLedger(META);
    l = appendEntry(l, makeInput('iss_a'));
    l = appendEntry(l, makeInput('iss_b', { category: 'readability' }));
    return l;
  }

  it('attaching usage does not change genesis or break verification', () => {
    const l = twoEntry();
    const genesisBefore = genesisHash(l.meta);
    l.usage = { provider: 'openai', spans_reviewed: 3, chars_sent: 210, capped: false };
    // Genesis is derived from meta only; usage lives outside meta.
    expect(genesisHash(l.meta)).toBe(genesisBefore);
    expect(verifyChain(l)).toEqual({ valid: true, brokenAt: -1 });
  });

  it('changing usage after commit still leaves the chain valid (not authenticated)', () => {
    const l = twoEntry();
    l.usage = { provider: 'anthropic', spans_reviewed: 1, chars_sent: 40, capped: true, model: 'x' };
    l.usage.chars_sent = 999999; // tamper with the observational field
    // The chain authenticates edits, not cost — so this remains valid by design.
    expect(verifyChain(l).valid).toBe(true);
  });
});
