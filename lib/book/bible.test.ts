import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRetrieve, mockUpdate, mockAttach, mockCreate } = vi.hoisted(() => ({
    mockRetrieve: vi.fn(),
    mockUpdate: vi.fn(),
    mockAttach: vi.fn(),
    mockCreate: vi.fn(),
}));

vi.mock('@/lib/letta', () => ({
    WRITING_MD_BLOCK_LIMIT: 20000,
    getLettaClient: () => ({
        blocks: { create: mockCreate },
        agents: {
            blocks: {
                retrieve: mockRetrieve,
                update: mockUpdate,
                attach: mockAttach,
            },
        },
    }),
}));

import {
    bibleBlockLabel,
    renderBible,
    parseBible,
    ensureBibleBlock,
    getBibleBlock,
    updateBibleBlock,
    BookBibleError,
    BOOK_BIBLE_BLOCK_LIMIT,
    DEFAULT_BOOK_BIBLE,
    EMPTY_BIBLE_FIELDS,
    type BibleFields,
} from './bible';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('bibleBlockLabel (pure)', () => {
    it('builds a stable per-book label', () => {
        expect(bibleBlockLabel('abc')).toBe('book_bible_abc');
        expect(bibleBlockLabel('  xyz  ')).toBe('book_bible_xyz');
    });

    it('requires a bookId', () => {
        expect(() => bibleBlockLabel('')).toThrow(BookBibleError);
        expect(() => bibleBlockLabel('   ')).toThrow(BookBibleError);
    });
});

describe('renderBible / parseBible (pure, round-trip)', () => {
    const fields: BibleFields = {
        synopsis: 'A hero rises against the tide.',
        characters: ['Ada — protagonist', 'Rex — rival'],
        timeline: ['Ch1: arrival', 'Ch2: betrayal'],
        establishedFacts: ['The city is named Vale.'],
        openThreads: ['Who sent the letter?'],
        voiceRules: 'See WRITING.md.',
    };

    it('round-trips a fully populated bible', () => {
        const back = parseBible(renderBible(fields));
        expect(back).toEqual(fields);
    });

    it('renders an empty bible with _none yet_ placeholders', () => {
        const md = renderBible(EMPTY_BIBLE_FIELDS);
        expect(md).toContain('_none yet_');
        const back = parseBible(md);
        expect(back.synopsis).toBe('');
        expect(back.characters).toEqual([]);
        expect(back.establishedFacts).toEqual([]);
    });

    it('DEFAULT_BOOK_BIBLE parses to an empty-equivalent bible', () => {
        const back = parseBible(DEFAULT_BOOK_BIBLE);
        expect(back.characters).toEqual([]);
        expect(back.timeline).toEqual([]);
        expect(back.synopsis).toBe('');
    });

    it('tolerates missing sections', () => {
        const back = parseBible('## Synopsis\nJust a synopsis, nothing else.');
        expect(back.synopsis).toBe('Just a synopsis, nothing else.');
        expect(back.characters).toEqual([]);
        // voiceRules always falls back to the pointer default
        expect(back.voiceRules).toMatch(/WRITING\.md/);
    });

    it('parseBible tolerates non-string input', () => {
        expect(parseBible(undefined as unknown as string).characters).toEqual([]);
    });
});

describe('ensureBibleBlock', () => {
    it('returns the existing block untouched when already attached (idempotent)', async () => {
        mockRetrieve.mockResolvedValueOnce({ value: 'existing bible', limit: 20000 });
        const r = await ensureBibleBlock('agent-1', 'book-1');
        expect(r.content).toBe('existing bible');
        expect(r.label).toBe('book_bible_book-1');
        expect(mockCreate).not.toHaveBeenCalled();
        expect(mockAttach).not.toHaveBeenCalled();
    });

    it('creates + attaches a new block when none exists', async () => {
        mockRetrieve.mockRejectedValueOnce(new Error('404 not found'));
        mockCreate.mockResolvedValueOnce({ id: 'blk-9', value: DEFAULT_BOOK_BIBLE, limit: 20000 });
        mockAttach.mockResolvedValueOnce({});
        const r = await ensureBibleBlock('agent-1', 'book-1');
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'book_bible_book-1', limit: BOOK_BIBLE_BLOCK_LIMIT })
        );
        expect(mockAttach).toHaveBeenCalledWith('blk-9', { agent_id: 'agent-1' });
        expect(r.content).toBe(DEFAULT_BOOK_BIBLE);
    });

    it('requires an agentId', async () => {
        await expect(ensureBibleBlock('', 'book-1')).rejects.toThrow(BookBibleError);
    });

    it('rejects seed content over the block limit', async () => {
        const huge = 'x'.repeat(BOOK_BIBLE_BLOCK_LIMIT + 1);
        await expect(ensureBibleBlock('agent-1', 'book-1', huge)).rejects.toThrow(/exceeds block limit/);
    });

    it('wraps a creation failure in BookBibleError', async () => {
        mockRetrieve.mockRejectedValueOnce(new Error('not attached'));
        mockCreate.mockResolvedValueOnce({ value: 'x' }); // no id
        await expect(ensureBibleBlock('agent-1', 'book-1')).rejects.toThrow(BookBibleError);
    });
});

describe('getBibleBlock (reads degrade, never throw)', () => {
    it('returns block content when present', async () => {
        mockRetrieve.mockResolvedValueOnce({ value: 'the bible', limit: 20000 });
        const r = await getBibleBlock('agent-1', 'book-1');
        expect(r.content).toBe('the bible');
    });

    it('degrades to empty when Letta throws', async () => {
        mockRetrieve.mockRejectedValueOnce(new Error('letta down'));
        const r = await getBibleBlock('agent-1', 'book-1');
        expect(r.content).toBe('');
        expect(r.label).toBe('book_bible_book-1');
    });

    it('degrades to empty when agentId or bookId is missing (no Letta call)', async () => {
        const r = await getBibleBlock('', 'book-1');
        expect(r.content).toBe('');
        expect(mockRetrieve).not.toHaveBeenCalled();
    });
});

describe('updateBibleBlock (writes fail loud)', () => {
    it('persists a valid update', async () => {
        mockUpdate.mockResolvedValueOnce({ value: 'updated', limit: 20000 });
        const r = await updateBibleBlock('agent-1', 'book-1', 'updated');
        expect(mockUpdate).toHaveBeenCalledWith('book_bible_book-1', {
            agent_id: 'agent-1',
            value: 'updated',
        });
        expect(r.content).toBe('updated');
    });

    it('rejects an over-limit update (no silent truncation)', async () => {
        const huge = 'y'.repeat(BOOK_BIBLE_BLOCK_LIMIT + 1);
        await expect(updateBibleBlock('agent-1', 'book-1', huge)).rejects.toThrow(/exceeds block limit/);
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('surfaces a Letta write failure as BookBibleError', async () => {
        mockUpdate.mockRejectedValueOnce(new Error('write failed'));
        await expect(updateBibleBlock('agent-1', 'book-1', 'x')).rejects.toThrow(BookBibleError);
    });

    it('requires an agentId and a string content', async () => {
        await expect(updateBibleBlock('', 'book-1', 'x')).rejects.toThrow(BookBibleError);
        await expect(
            updateBibleBlock('agent-1', 'book-1', 123 as unknown as string)
        ).rejects.toThrow(BookBibleError);
    });
});
