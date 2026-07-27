import { describe, it, expect } from 'vitest';

import {
    ingestBookDocument,
    BookIngestError,
    MAX_INPUT_CHARS,
    MAX_CHAPTERS,
    PARTIAL_PROSE_THRESHOLD,
} from './ingest';

describe('ingestBookDocument — input validation (pure, fail-closed)', () => {
    it('rejects a non-string document', () => {
        expect(() => ingestBookDocument(42 as unknown)).toThrow(BookIngestError);
        expect(() => ingestBookDocument(null as unknown)).toThrow(BookIngestError);
        expect(() => ingestBookDocument(undefined as unknown)).toThrow(BookIngestError);
    });

    it('rejects an empty / whitespace-only document', () => {
        expect(() => ingestBookDocument('')).toThrow(BookIngestError);
        expect(() => ingestBookDocument('   \n\t  ')).toThrow(BookIngestError);
    });

    it('rejects input larger than MAX_INPUT_CHARS', () => {
        const big = '# T\n\n## C\n' + 'x'.repeat(MAX_INPUT_CHARS);
        expect(() => ingestBookDocument(big)).toThrow(/exceeds .* characters/);
    });

    it('rejects a document with no headings', () => {
        expect(() => ingestBookDocument('just some prose, no structure at all.')).toThrow(
            /no headings/i
        );
    });

    it('rejects an invalid kindOverride', () => {
        expect(() => ingestBookDocument('## C\ntext', 'poetry' as never)).toThrow(
            /kindOverride/
        );
    });
});

describe('ingestBookDocument — title + chapter extraction', () => {
    it('treats a lone leading H1 as the title and H2s as chapters', () => {
        const doc = `# My Novel\n\n## Chapter 1\n- beat a\n\n## Chapter 2\n- beat b\n`;
        const r = ingestBookDocument(doc);
        expect(r.title).toBe('My Novel');
        expect(r.chapters.map((c) => c.intent)).toEqual(['Chapter 1', 'Chapter 2']);
        expect(r.chapters.map((c) => c.index)).toEqual([0, 1]);
    });

    it('treats every top heading as a chapter when there is no lone title', () => {
        const doc = `# Ch One\ntext\n# Ch Two\nmore`;
        const r = ingestBookDocument(doc);
        expect(r.title).toBeNull();
        expect(r.chapters).toHaveLength(2);
        expect(r.chapters[0].intent).toBe('Ch One');
    });

    it('captures terse bullet/numbered lines as beats (outline signal)', () => {
        const doc = `## Chapter 1\n- hero arrives\n- meets stranger\n1. secret\n2) reveal\n`;
        const r = ingestBookDocument(doc);
        expect(r.chapters[0].beats).toEqual([
            'hero arrives',
            'meets stranger',
            'secret',
            'reveal',
        ]);
        expect(r.chapters[0].proseChars).toBe(0);
    });

    it('counts prose body chars separately from beats', () => {
        const prose = 'This is a real paragraph of connected manuscript prose.';
        const doc = `## Chapter 1\n${prose}\n- a stray beat\n`;
        const r = ingestBookDocument(doc);
        expect(r.chapters[0].proseChars).toBe(prose.length);
        expect(r.chapters[0].beats).toEqual(['a stray beat']);
    });
});

describe('ingestBookDocument — sourceKind classification', () => {
    it('classifies a headings+beats document as an outline', () => {
        const doc = `# Book\n\n## Ch1\n- a\n- b\n\n## Ch2\n- c\n`;
        expect(ingestBookDocument(doc).sourceKind).toBe('outline');
    });

    it('classifies a prose-heavy document as a partial manuscript', () => {
        const prose = 'x'.repeat(PARTIAL_PROSE_THRESHOLD + 50);
        const doc = `# Book\n\n## Ch1\n\n${prose}\n`;
        expect(ingestBookDocument(doc).sourceKind).toBe('partial');
    });

    it('does not let zero-prose back-matter dilute the density signal', () => {
        // One substantial prose chapter + a References stub must still read as partial.
        const prose = 'y'.repeat(PARTIAL_PROSE_THRESHOLD + 100);
        const doc = `# Book\n\n## Ch1\n\n${prose}\n\n## References\n- Smith (1901)\n`;
        expect(ingestBookDocument(doc).sourceKind).toBe('partial');
    });
});

describe('ingestBookDocument — kind heuristic (hint, overridable)', () => {
    it('defaults an outline with no citation signals to fiction', () => {
        const doc = `# Novel\n\n## Ch1\n- a\n\n## Ch2\n- b\n`;
        const r = ingestBookDocument(doc);
        expect(r.kind).toBe('fiction');
        expect(r.kindSignals.citationHits).toBe(0);
    });

    it('leans non-fiction when a References section is present', () => {
        const doc = `# Book\n\n## Ch1\ntext\n\n## References\n- Smith (1901)\n`;
        const r = ingestBookDocument(doc);
        expect(r.kind).toBe('nonfiction');
        expect(r.kindSignals.citationHits).toBeGreaterThan(0);
    });

    it('leans non-fiction on footnote markers', () => {
        const doc = `## Ch1\nA claim with a footnote.[^1]\n\n[^1]: the note\n`;
        expect(ingestBookDocument(doc).kind).toBe('nonfiction');
    });

    it('leans non-fiction when several links are present', () => {
        const doc = `## Ch1\nSee [a](http://a.com), [b](http://b.com), [c](http://c.com).\n`;
        const r = ingestBookDocument(doc);
        expect(r.kind).toBe('nonfiction');
        expect(r.kindSignals.hasLinks).toBe(true);
    });

    it('honours an explicit kindOverride over the heuristic', () => {
        // A doc that would heuristically be non-fiction, forced to fiction.
        const doc = `## Ch1\ntext\n\n## References\n- Smith (1901)\n`;
        const r = ingestBookDocument(doc, 'fiction');
        expect(r.kind).toBe('fiction');
        expect(r.kindSignals.reason).toMatch(/override/);
    });
});

describe('ingestBookDocument — bounds', () => {
    it('rejects a document with more than MAX_CHAPTERS chapters', () => {
        const many = Array.from({ length: MAX_CHAPTERS + 1 }, (_, i) => `## Chapter ${i}\n- beat`).join(
            '\n'
        );
        expect(() => ingestBookDocument(many)).toThrow(/exceeds .* chapters/);
    });

    it('accepts exactly MAX_CHAPTERS chapters', () => {
        const many = Array.from({ length: MAX_CHAPTERS }, (_, i) => `## Chapter ${i}\n- beat`).join(
            '\n'
        );
        const r = ingestBookDocument(many);
        expect(r.chapters).toHaveLength(MAX_CHAPTERS);
    });
});
