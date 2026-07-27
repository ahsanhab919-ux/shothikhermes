import { describe, it, expect, vi, beforeEach } from 'vitest';

// Bible + book-service touch DB/Letta — mock them so the factory's DEFAULT edges
// are exercisable without network. Keep the real errors/pure helpers.
vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const { mockGetBible, mockUpdateBible, mockSaveChapter, mockRecordAttempt, mockGate } = vi.hoisted(
    () => ({
        mockGetBible: vi.fn(),
        mockUpdateBible: vi.fn(),
        mockSaveChapter: vi.fn(),
        mockRecordAttempt: vi.fn(),
        mockGate: vi.fn(),
    })
);

vi.mock('./bible', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./bible')>()),
    getBibleBlock: mockGetBible,
    updateBibleBlock: mockUpdateBible,
}));
vi.mock('./book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./book-service')>()),
    saveChapterRecord: mockSaveChapter,
    recordChapterAttempt: mockRecordAttempt,
}));
vi.mock('./gate', () => ({
    buildReEducatorGate: (...args: unknown[]) => mockGate(...args),
}));

import {
    buildAuthorDeps,
    buildProseGenerator,
    buildChapterPrompt,
    foldChapterIntoBible,
    BookRunError,
    DEFAULT_RUN_TOKEN_BUDGET,
    type ProseGenerator,
} from './provider';
import { runChapterLoop, type GenerateInput, type SavedChapter, type GateResult } from './author';
import { renderBible, EMPTY_BIBLE_FIELDS } from './bible';

const baseInput = {
    userId: 'u1',
    bookId: 'b1',
    agentId: 'agent-1',
    provider: 'openai' as const,
    apiKey: 'sk-test',
    writingMd: '# WRITING.md\nterse voice',
};

const genInput = (over: Partial<GenerateInput> = {}): GenerateInput => ({
    chapter: { index: 0, intent: 'Opening', beats: ['arrive'] },
    bible: 'BIBLE',
    writingMd: '# voice',
    facts: null,
    attempt: 0,
    ...over,
});

/** A prose generator stub that reports a fixed token cost per call. */
function fakeGenerator(text: string, outputTokens: number): ProseGenerator {
    return vi.fn(async () => ({ text, usage: { provider: 'openai', model: 'm', outputTokens } }));
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGate.mockReturnValue(
        async (draft: string): Promise<GateResult> => ({ passed: true, text: draft, issues: [] })
    );
});

describe('buildAuthorDeps — wiring', () => {
    it('builds deps whose edges resolve to the injected/default seams', async () => {
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('prose', 10) });
        expect(deps.writingMd).toBe(baseInput.writingMd);
        expect(typeof deps.generateChapter).toBe('function');
        expect(typeof deps.verifyChapter).toBe('function');
        expect(typeof deps.readBible).toBe('function');
        expect(typeof deps.saveChapter).toBe('function');
        expect(typeof deps.updateBible).toBe('function');
    });

    it('generateChapter returns the provider text', async () => {
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('Chapter text.', 10) });
        await expect(deps.generateChapter(genInput())).resolves.toBe('Chapter text.');
    });

    it('readBible resolves to the bible block content (default edge)', async () => {
        mockGetBible.mockResolvedValue({ content: 'SPINE', agentId: 'agent-1', bookId: 'b1', label: 'l', limit: 1 });
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('x', 1) });
        await expect(deps.readBible()).resolves.toBe('SPINE');
        expect(mockGetBible).toHaveBeenCalledWith('agent-1', 'b1');
    });

    it('saveChapter delegates to saveChapterRecord with status accepted (default edge)', async () => {
        mockSaveChapter.mockResolvedValue({});
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('x', 1) });
        const saved: SavedChapter = { index: 2, intent: 'Mid', content: 'body', attempts: 1 };
        await deps.saveChapter(saved);
        expect(mockSaveChapter).toHaveBeenCalledWith('u1', {
            bookId: 'b1',
            index: 2,
            intent: 'Mid',
            content: 'body',
            status: 'accepted',
            attempts: 1,
        });
    });

    it('updateBible folds the accepted chapter and persists via updateBibleBlock (default edge)', async () => {
        mockUpdateBible.mockResolvedValue({});
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('x', 1) });
        const prior = renderBible(EMPTY_BIBLE_FIELDS);
        await deps.updateBible({ index: 0, intent: 'Opening', content: 'c', attempts: 1 }, prior);
        expect(mockUpdateBible).toHaveBeenCalledTimes(1);
        const [agentId, bookId, content] = mockUpdateBible.mock.calls[0];
        expect(agentId).toBe('agent-1');
        expect(bookId).toBe('b1');
        expect(content).toContain('Ch1 — Opening');
    });

    it('verifyChapter defaults to the Re-educator gate builder', () => {
        buildAuthorDeps({ ...baseInput, generator: fakeGenerator('x', 1), gateOptions: { writingMdVersion: 'v2' } });
        expect(mockGate).toHaveBeenCalledWith({ writingMdVersion: 'v2' });
    });
});

describe('buildAuthorDeps — recordAttempt (fail-soft history)', () => {
    it('default recordAttempt delegates to recordChapterAttempt, owner-scoped', async () => {
        mockRecordAttempt.mockResolvedValue({});
        const deps = buildAuthorDeps({
            ...baseInput,
            model: 'gpt-x',
            generator: fakeGenerator('x', 1),
        });
        await deps.recordAttempt!({ index: 1, attempt: 2, status: 'failed', gateIssues: ['nope'] });
        expect(mockRecordAttempt).toHaveBeenCalledWith('u1', {
            bookId: 'b1',
            index: 1,
            attempt: 2,
            status: 'failed',
            gateIssues: ['nope'],
            tokensUsed: undefined,
            // Falls back to the run's model handle when the record omits one.
            modelHandle: 'gpt-x',
        });
    });

    it('swallows a history write failure (fail-soft): recordAttempt never rejects', async () => {
        mockRecordAttempt.mockRejectedValue(new Error('mongo down'));
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('x', 1) });
        // A rejected history write must NOT propagate — authoring must not abort.
        await expect(
            deps.recordAttempt!({ index: 0, attempt: 1, status: 'accepted', gateIssues: [] })
        ).resolves.toBeUndefined();
    });

    it('an accepted chapter is NOT lost when its history write throws (fail-soft end-to-end)', async () => {
        mockGetBible.mockResolvedValue({ content: 'S', agentId: 'a', bookId: 'b', label: 'l', limit: 1 });
        mockSaveChapter.mockResolvedValue({});
        mockUpdateBible.mockResolvedValue({});
        mockRecordAttempt.mockRejectedValue(new Error('mongo down'));
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('prose', 1) });
        const res = await runChapterLoop([{ index: 0, intent: 'One' }], deps);
        expect(res.status).toBe('complete');
        expect(res.chapters[0].status).toBe('accepted');
        // The chapter was saved even though its attempt-history write failed.
        expect(mockSaveChapter).toHaveBeenCalledTimes(1);
    });
});

describe('buildAuthorDeps — validation (fail-closed)', () => {
    it('rejects a missing userId', () => {
        expect(() => buildAuthorDeps({ ...baseInput, userId: '', generator: fakeGenerator('x', 1) })).toThrow(
            BookRunError
        );
    });
    it('rejects a non-positive run token budget', () => {
        expect(() =>
            buildAuthorDeps({ ...baseInput, runTokenBudget: 0, generator: fakeGenerator('x', 1) })
        ).toThrow(/runTokenBudget/);
    });
});

describe('token budget — fail-closed', () => {
    it('throws BookRunError once the run budget is exhausted', async () => {
        // Each call bills 60; a 60 budget allows the first call, the second (which
        // starts with tokensUsed=60 >= budget) is refused fail-closed.
        const deps = buildAuthorDeps({
            ...baseInput,
            runTokenBudget: 60,
            generator: fakeGenerator('prose', 60),
        });
        await expect(deps.generateChapter(genInput())).resolves.toBe('prose'); // 60 used
        await expect(deps.generateChapter(genInput({ attempt: 1 }))).rejects.toThrow(BookRunError);
    });

    it('halts a whole run when the budget is spent mid-plan', async () => {
        mockGetBible.mockResolvedValue({ content: 'SPINE', agentId: 'a', bookId: 'b', label: 'l', limit: 1 });
        mockSaveChapter.mockResolvedValue({});
        mockUpdateBible.mockResolvedValue({});
        // Budget 100, each chapter bills 80 → chapter 0 ok (80), chapter 1 refused (80>=100? no; 80<100 allowed... use 80 then next starts at 80>=100 false). Use bill 80, budget 120 → ch0 80, ch1 80>=120 false allowed→160. Use budget 80, bill 80: ch0 allowed bills 80, ch1: 80>=80 refused.
        const deps = buildAuthorDeps({
            ...baseInput,
            runTokenBudget: 80,
            generator: fakeGenerator('prose', 80),
        });
        const plan = [
            { index: 0, intent: 'One' },
            { index: 1, intent: 'Two' },
        ];
        await expect(runChapterLoop(plan, deps)).rejects.toThrow(BookRunError);
        // chapter 0 was saved before the budget tripped on chapter 1.
        expect(mockSaveChapter).toHaveBeenCalledTimes(1);
    });
});

describe('gate wiring — pass/fail', () => {
    it('a failing gate drives regeneration then a failed outcome', async () => {
        mockGate.mockReturnValue(
            async (draft: string): Promise<GateResult> => ({ passed: false, text: draft, issues: ['nope'] })
        );
        mockGetBible.mockResolvedValue({ content: 'S', agentId: 'a', bookId: 'b', label: 'l', limit: 1 });
        const deps = buildAuthorDeps({ ...baseInput, generator: fakeGenerator('prose', 1) });
        const res = await runChapterLoop([{ index: 0, intent: 'One' }], deps, { maxRegen: 1 });
        expect(res.status).toBe('halted');
        expect(res.chapters[0].status).toBe('failed');
    });
});

describe('buildProseGenerator — no key fails closed', () => {
    it('throws BookRunError when the key is empty', () => {
        expect(() => buildProseGenerator('openai', '')).toThrow(BookRunError);
    });

    it('openai path posts to the chat endpoint and returns text + usage (mocked fetch)', async () => {
        const fetchImpl = vi.fn(async () => ({
            ok: true,
            json: async () => ({ choices: [{ message: { content: 'Generated.' } }], usage: { completion_tokens: 42 } }),
        })) as unknown as typeof fetch;
        const gen = buildProseGenerator('openai', 'sk-x', { fetchImpl });
        const out = await gen({ system: 's', prompt: 'p', maxOutputTokens: 100 });
        expect(out.text).toBe('Generated.');
        expect(out.usage.outputTokens).toBe(42);
        const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toContain('api.openai.com');
    });

    it('fails loud (BookRunError) on a non-2xx provider response', async () => {
        const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as unknown as typeof fetch;
        const gen = buildProseGenerator('anthropic', 'sk-x', { fetchImpl });
        await expect(gen({ system: 's', prompt: 'p', maxOutputTokens: 10 })).rejects.toThrow(BookRunError);
    });

    it('fails closed (BookRunError) when the network call throws (timeout/abort/reset)', async () => {
        // runFetch swallows the throw and returns null; the generator must then fail
        // loud rather than hang or return an empty draft. (Finding A2 coverage.)
        const fetchImpl = vi.fn(async () => {
            throw new Error('ECONNRESET');
        }) as unknown as typeof fetch;
        const gen = buildProseGenerator('openai', 'sk-x', { fetchImpl });
        await expect(gen({ system: 's', prompt: 'p', maxOutputTokens: 10 })).rejects.toThrow(BookRunError);
    });
});

describe('pure helpers', () => {
    it('buildChapterPrompt includes intent, beats, and repair issues on regen', () => {
        const { system, prompt } = buildChapterPrompt(
            genInput({ attempt: 1, priorIssues: ['too vague'] })
        );
        expect(system).toMatch(/fiction author/i);
        expect(prompt).toContain('Opening');
        expect(prompt).toContain('arrive');
        expect(prompt).toContain('too vague');
    });

    it('foldChapterIntoBible appends a timeline line and seeds synopsis, round-trips', () => {
        const prior = renderBible(EMPTY_BIBLE_FIELDS);
        const next = foldChapterIntoBible({ index: 0, intent: 'Opening', content: 'c', attempts: 1 }, prior);
        expect(next).toContain('Ch1 — Opening');
        expect(next).toMatch(/Synopsis/);
    });
});

describe('DEFAULT_RUN_TOKEN_BUDGET', () => {
    it('is a positive number', () => {
        expect(DEFAULT_RUN_TOKEN_BUDGET).toBeGreaterThan(0);
    });
});
