import { describe, it, expect } from 'vitest';

import {
    assembleManuscript,
    toFilenameStem,
    BookExportError,
    type ManuscriptChapter,
} from './export';

const chapters: ManuscriptChapter[] = [
    { index: 0, intent: 'The Arrival', content: 'Ada stepped off the train.' },
    { index: 1, intent: 'The Betrayal', content: 'Rex turned, knife in hand.' },
];

describe('toFilenameStem', () => {
    it('slugifies a title', () => {
        expect(toFilenameStem('Vale: A Novel!')).toBe('vale-a-novel');
    });

    it('strips diacritics and collapses separators', () => {
        expect(toFilenameStem('Café del  Mar — 2024')).toBe('cafe-del-mar-2024');
    });

    it('falls back to "manuscript" for empty/punctuation-only titles', () => {
        expect(toFilenameStem('   ***   ')).toBe('manuscript');
        expect(toFilenameStem('')).toBe('manuscript');
    });

    it('caps length at 80 chars', () => {
        expect(toFilenameStem('a'.repeat(200)).length).toBe(80);
    });
});

describe('assembleManuscript — validation (fail-closed)', () => {
    it('requires a non-empty title', () => {
        expect(() => assembleManuscript(chapters, { title: '' })).toThrow(/title is required/);
        expect(() => assembleManuscript(chapters, { title: '   ' })).toThrow(BookExportError);
    });

    it('requires at least one chapter', () => {
        expect(() => assembleManuscript([], { title: 'X' })).toThrow(/at least one chapter/);
    });

    it('rejects a chapter with empty content', () => {
        const bad = [{ index: 0, intent: 'Blank', content: '   ' }];
        expect(() => assembleManuscript(bad, { title: 'X' })).toThrow(/has no content/);
    });

    it('rejects duplicate chapter indices', () => {
        const dup = [
            { index: 0, intent: 'A', content: 'a' },
            { index: 0, intent: 'B', content: 'b' },
        ];
        expect(() => assembleManuscript(dup, { title: 'X' })).toThrow(/duplicate chapter index/);
    });

    it('rejects a non-integer chapter index', () => {
        const bad = [{ index: 1.5, intent: 'A', content: 'a' }];
        expect(() => assembleManuscript(bad, { title: 'X' })).toThrow(/must be an integer/);
    });
});

describe('assembleManuscript — structure', () => {
    it('emits chapters in ascending index order regardless of input order', () => {
        const shuffled = [chapters[1], chapters[0]];
        const md = assembleManuscript(shuffled, { title: 'Book' }).markdown;
        expect(md.indexOf('The Arrival')).toBeLessThan(md.indexOf('The Betrayal'));
    });

    it('includes a title heading and a TOC by default', () => {
        const md = assembleManuscript(chapters, { title: 'My Book' }).markdown;
        expect(md).toContain('# My Book');
        expect(md).toContain('## Contents');
        expect(md).toContain('1. The Arrival');
        expect(md).toContain('2. The Betrayal');
    });

    it('omits the TOC when includeToc is false', () => {
        const md = assembleManuscript(chapters, { title: 'Book', includeToc: false }).markdown;
        expect(md).not.toContain('## Contents');
    });

    it('renders subtitle and author front matter when provided', () => {
        const md = assembleManuscript(chapters, {
            title: 'Book',
            subtitle: 'A Tale',
            author: 'Jane Doe',
        }).markdown;
        expect(md).toContain('## A Tale');
        expect(md).toContain('_by Jane Doe_');
    });

    it('renders back matter and an attribution colophon', () => {
        const md = assembleManuscript(chapters, {
            title: 'Book',
            backMatter: '## Afterword\nThank you.',
            attribution: 'signed: abc123',
        }).markdown;
        expect(md).toContain('## Afterword');
        expect(md).toContain('<sub>signed: abc123</sub>');
    });

    it('renders each chapter body under its heading', () => {
        const md = assembleManuscript(chapters, { title: 'Book' }).markdown;
        expect(md).toContain('## The Arrival');
        expect(md).toContain('Ada stepped off the train.');
    });

    it('collapses excess blank lines and ends with a single newline', () => {
        const md = assembleManuscript(chapters, { title: 'Book' }).markdown;
        expect(md).not.toMatch(/\n{3,}/);
        expect(md.endsWith('\n')).toBe(true);
        expect(md.endsWith('\n\n')).toBe(false);
    });
});

describe('assembleManuscript — metrics + filename', () => {
    it('suggests a .md filename derived from the title', () => {
        const r = assembleManuscript(chapters, { title: 'Vale: A Novel' });
        expect(r.filename).toBe('vale-a-novel.md');
    });

    it('counts chapters and body words (front/back matter excluded)', () => {
        const r = assembleManuscript(chapters, { title: 'Book', backMatter: 'extra words here now' });
        expect(r.chapterCount).toBe(2);
        // "Ada stepped off the train." (5) + "Rex turned, knife in hand." (5) = 10
        expect(r.wordCount).toBe(10);
    });

    it('reports the full document char count', () => {
        const r = assembleManuscript(chapters, { title: 'Book' });
        expect(r.charCount).toBe(r.markdown.length);
    });
});
