import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const {
    mockGetBook,
    mockAuthorSingle,
    mockBuildDeps,
    mockEnsureBible,
    mockGetProfile,
    mockGetWritingMd,
    mockUseByokKey,
} = vi.hoisted(() => ({
    mockGetBook: vi.fn(),
    mockAuthorSingle: vi.fn(),
    mockBuildDeps: vi.fn(),
    mockEnsureBible: vi.fn(),
    mockGetProfile: vi.fn(),
    mockGetWritingMd: vi.fn(),
    mockUseByokKey: vi.fn(),
}));

// Keep the real BookServiceError; mock only the DB-touching read.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    getBook: mockGetBook,
}));
// Keep the real BookAuthorError/types; mock the single-chapter author path.
vi.mock('@/lib/book/author', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/author')>()),
    authorSingleChapter: mockAuthorSingle,
}));
// Keep the real BookRunError; mock the factory (no network in tests).
vi.mock('@/lib/book/provider', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/provider')>()),
    buildAuthorDeps: mockBuildDeps,
}));
vi.mock('@/lib/book/bible', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/bible')>()),
    ensureBibleBlock: mockEnsureBible,
}));
vi.mock('@/lib/writingProfile', () => ({ getOrCreateWritingProfile: mockGetProfile }));
vi.mock('@/lib/letta', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/letta')>()),
    getWritingMd: mockGetWritingMd,
}));
vi.mock('@/lib/second-me/key-custody', () => ({ useByokKey: mockUseByokKey }));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { POST } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { BookServiceError } from '@/lib/book/book-service';
import { BookRunError } from '@/lib/book/provider';

const authed = { _id: 'user-1' };

/** Params for book b1, chapter index (as a string, like Next passes them). */
function makeParams(index = '0') {
    return Promise.resolve({ id: 'b1', index });
}

/** A Request-like object with a JSON body + header lookup. */
function req(body: unknown, headers: Record<string, string> = {}) {
    return {
        json: async () => body,
        headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    } as any;
}

/** An owned book with a two-chapter plan in the given status. */
function ownedBook(over: Record<string, unknown> = {}) {
    return {
        _id: 'b1',
        status: 'complete',
        plan: [
            { index: 0, intent: 'Opening', beats: [] },
            { index: 1, intent: 'Middle', beats: [] },
        ],
        ...over,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ lettaAgentId: 'agent-1', modelHandle: undefined });
    mockGetWritingMd.mockResolvedValue({ content: '# voice' });
    mockEnsureBible.mockResolvedValue({});
    mockBuildDeps.mockReturnValue({ writingMd: 'x' });
});

describe('POST /api/book/[id]/chapter/[index]/regenerate', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('0') });
        expect(res.status).toBe(401);
        expect(mockGetBook).not.toHaveBeenCalled();
    });

    it('400 when the index is not a non-negative integer', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('1.5') });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/integer/i);
        expect(mockGetBook).not.toHaveBeenCalled();
    });

    it('400 when provider is missing/invalid', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        const res: any = await POST(req({ provider: 'cohere' }), { params: makeParams('0') });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/provider/i);
    });

    it('400 when no BYOK key is available (fail-closed): no owner load, no author', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue(undefined);
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('0') });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/no byok key/i);
        expect(mockGetBook).not.toHaveBeenCalled();
        expect(mockAuthorSingle).not.toHaveBeenCalled();
    });

    it('404 when the book is not owned/found', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockGetBook.mockRejectedValue(new BookServiceError('NOT_FOUND', 'Book not found.'));
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('0') });
        expect(res.status).toBe(404);
        expect(mockAuthorSingle).not.toHaveBeenCalled();
    });

    it('409 when the book is currently authoring (must not race the loop)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockGetBook.mockResolvedValue(ownedBook({ status: 'running' }));
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('0') });
        expect(res.status).toBe(409);
        expect(res.data.error).toMatch(/authoring/i);
        expect(mockAuthorSingle).not.toHaveBeenCalled();
    });

    it('400 when the index is outside the book plan bounds', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockGetBook.mockResolvedValue(ownedBook());
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('5') });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/outside this book's plan/i);
        expect(mockAuthorSingle).not.toHaveBeenCalled();
    });

    it('200 with the accepted outcome on success (book status left unchanged)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockGetBook.mockResolvedValue(ownedBook());
        mockAuthorSingle.mockResolvedValue({
            index: 1,
            intent: 'Middle',
            status: 'accepted',
            attempts: 1,
            content: 'new prose',
            issues: [],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('1') });
        expect(res.status).toBe(200);
        expect(res.data).toEqual({
            bookId: 'b1',
            index: 1,
            outcome: expect.objectContaining({ index: 1, status: 'accepted' }),
        });
        expect(mockAuthorSingle).toHaveBeenCalledWith(
            expect.any(Array),
            expect.anything(),
            1
        );
    });

    it('422 with a structured failed outcome on gate-fail exhaustion', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockGetBook.mockResolvedValue(ownedBook());
        mockAuthorSingle.mockResolvedValue({
            index: 0,
            intent: 'Opening',
            status: 'failed',
            attempts: 4,
            content: '',
            issues: ['still broken'],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('0') });
        expect(res.status).toBe(422);
        expect(res.data.outcome).toMatchObject({ status: 'failed', issues: ['still broken'] });
    });

    it('uses the x-second-me-key header over stored custody', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue(ownedBook());
        mockAuthorSingle.mockResolvedValue({
            index: 0,
            intent: 'Opening',
            status: 'accepted',
            attempts: 1,
            content: 'c',
            issues: [],
        });
        const res: any = await POST(
            req({ provider: 'openai' }, { 'x-second-me-key': 'sk-header' }),
            { params: makeParams('0') }
        );
        expect(res.status).toBe(200);
        expect(mockUseByokKey).not.toHaveBeenCalled();
        expect(mockBuildDeps).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'sk-header' }));
    });

    it('maps a BookRunError (e.g. over budget) to 400', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockGetBook.mockResolvedValue(ownedBook());
        mockAuthorSingle.mockRejectedValue(new BookRunError('Run token budget exhausted.'));
        const res: any = await POST(req({ provider: 'openai' }), { params: makeParams('0') });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/budget/i);
    });
});
