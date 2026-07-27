import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const {
    mockClaim,
    mockSetStatus,
    mockGetAccepted,
    mockRunLoop,
    mockBuildDeps,
    mockEnsureBible,
    mockGetProfile,
    mockGetWritingMd,
    mockUseByokKey,
} = vi.hoisted(() => ({
    mockClaim: vi.fn(),
    mockSetStatus: vi.fn(),
    mockGetAccepted: vi.fn(),
    mockRunLoop: vi.fn(),
    mockBuildDeps: vi.fn(),
    mockEnsureBible: vi.fn(),
    mockGetProfile: vi.fn(),
    mockGetWritingMd: vi.fn(),
    mockUseByokKey: vi.fn(),
}));

// Keep the real BookServiceError; mock only the DB-touching fns.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    claimBookForRun: mockClaim,
    setBookStatus: mockSetStatus,
    getAcceptedChapters: mockGetAccepted,
}));
// Keep the real runChapterLoop errors/types; mock the loop itself.
vi.mock('@/lib/book/author', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/author')>()),
    runChapterLoop: mockRunLoop,
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

const params = Promise.resolve({ id: 'b1' });
const authed = { _id: 'user-1' };

/** Drain the microtask queue so the fire-and-forget background run settles. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

/** A Request-like object with a JSON body + header lookup. */
function req(body: unknown, headers: Record<string, string> = {}) {
    return {
        json: async () => body,
        headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    } as any;
}

/** The book the atomic claim returns once it has transitioned draft → authoring. */
function claimedBook(over: Record<string, unknown> = {}) {
    return {
        _id: 'b1',
        status: 'running',
        plan: [{ index: 0, intent: 'Opening', beats: [] }],
        ...over,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ lettaAgentId: 'agent-1', modelHandle: undefined });
    mockGetWritingMd.mockResolvedValue({ content: '# voice' });
    mockEnsureBible.mockResolvedValue({});
    mockBuildDeps.mockReturnValue({ writingMd: 'x' });
    mockSetStatus.mockResolvedValue({});
    // Default: no prior accepted chapters (fresh run authors the whole plan).
    mockGetAccepted.mockResolvedValue([]);
});

describe('POST /api/book/[id]/run', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(401);
        expect(mockClaim).not.toHaveBeenCalled();
    });

    it('400 when provider is missing/invalid', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        const res: any = await POST(req({ provider: 'cohere' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/provider/i);
        expect(mockClaim).not.toHaveBeenCalled();
    });

    it('404 when the book is not owned/found (claim rejects notFound)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockRejectedValue(new BookServiceError('NOT_FOUND', 'Book not found.'));
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(404);
    });

    // The atomic claim is the SINGLE status gate: a non-draft book is rejected by
    // the claim itself (draft-only precondition), before any generate. No prior
    // read-guard, so this also documents the closed double-run race.
    it.each(['authoring', 'complete', 'failed'])(
        '400 with ZERO provider work when the book is not draft (status: %s)',
        async (status) => {
            (getAuthenticatedUser as any).mockResolvedValue(authed);
            mockUseByokKey.mockResolvedValue('sk-stored');
            mockClaim.mockRejectedValue(
                new BookServiceError(
                    'VALIDATION',
                    `Book is "${status}" and cannot be started; reset it to draft to run again.`
                )
            );
            const res: any = await POST(req({ provider: 'openai' }), { params });
            expect(res.status).toBe(400);
            expect(res.data.error).toMatch(/cannot be started|reset it to draft/i);
            // The claim rejected → no run, no deps, no terminal status write.
            expect(mockBuildDeps).not.toHaveBeenCalled();
            expect(mockRunLoop).not.toHaveBeenCalled();
            expect(mockSetStatus).not.toHaveBeenCalled();
        }
    );

    it('400 when no BYOK key is available (fail-closed): no claim, no run', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue(undefined);
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/no byok key/i);
        // A missing key must consume NO claim and make no provider call.
        expect(mockClaim).not.toHaveBeenCalled();
        expect(mockRunLoop).not.toHaveBeenCalled();
        expect(mockSetStatus).not.toHaveBeenCalled();
    });

    it('happy path: claims (draft→authoring), returns 202, background sets complete', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockResolvedValue({
            status: 'complete',
            haltedAtIndex: null,
            chapters: [{ index: 0, intent: 'Opening', status: 'accepted', attempts: 1, content: 'c', issues: [] }],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        // The response is an immediate 202 — the run continues in the background.
        expect(res.status).toBe(202);
        expect(res.data).toEqual({ bookId: 'b1', status: 'running' });
        // The claim (draft→authoring) happens synchronously BEFORE the 202.
        expect(mockClaim).toHaveBeenCalledWith('user-1', 'b1');
        // The terminal status is written by the background task (kicked off after
        // the claim, settled by the flush below) — never by the synchronous path.
        await flush();
        expect(mockRunLoop).toHaveBeenCalledTimes(1);
        expect(mockSetStatus).toHaveBeenCalledTimes(1);
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'completed');
    });

    it('uses the x-second-me-key header when present (over stored custody)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockResolvedValue({ status: 'complete', haltedAtIndex: null, chapters: [{ index: 0, intent: 'Opening', status: 'accepted', attempts: 1, content: 'c', issues: [] }] });
        const res: any = await POST(req({ provider: 'openai' }, { 'x-second-me-key': 'sk-header' }), { params });
        expect(res.status).toBe(202);
        expect(mockUseByokKey).not.toHaveBeenCalled(); // header short-circuits custody
        expect(mockBuildDeps).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'sk-header' }));
        await flush();
    });

    it('background: marks the book failed when the run halts', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockResolvedValue({
            status: 'halted',
            haltedAtIndex: 0,
            chapters: [{ index: 0, intent: 'Opening', status: 'failed', attempts: 4, content: '', issues: ['x'] }],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(202);
        await flush();
        expect(mockSetStatus).toHaveBeenCalledTimes(1);
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'failed');
    });

    it('resume: passes already-accepted indices to the loop and counts them toward completion', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        // A two-chapter plan; chapter 0 was accepted in a prior partial run.
        mockClaim.mockResolvedValue(
            claimedBook({ plan: [{ index: 0, intent: 'Opening', beats: [] }, { index: 1, intent: 'Middle', beats: [] }] })
        );
        mockGetAccepted.mockResolvedValue([{ index: 0 }]);
        // The loop skips index 0 (attempts 0) and authors index 1.
        mockRunLoop.mockResolvedValue({
            status: 'complete',
            haltedAtIndex: null,
            chapters: [
                { index: 0, intent: 'Opening', status: 'accepted', attempts: 0, content: '', issues: [] },
                { index: 1, intent: 'Middle', status: 'accepted', attempts: 1, content: 'c', issues: [] },
            ],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(202);
        await flush();
        // The pre-accepted index is threaded into the loop as a skip list.
        expect(mockRunLoop).toHaveBeenCalledWith(
            expect.any(Array),
            expect.anything(),
            expect.objectContaining({ failurePolicy: 'halt', alreadyAccepted: [0] })
        );
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'completed');
    });

    it('resume: a fully-accepted re-run does zero generation and ends complete', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        // Single-chapter plan, already accepted.
        mockClaim.mockResolvedValue(claimedBook());
        mockGetAccepted.mockResolvedValue([{ index: 0 }]);
        mockRunLoop.mockResolvedValue({
            status: 'complete',
            haltedAtIndex: null,
            chapters: [{ index: 0, intent: 'Opening', status: 'accepted', attempts: 0, content: '', issues: [] }],
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(202);
        await flush();
        expect(mockRunLoop).toHaveBeenCalledWith(
            expect.any(Array),
            expect.anything(),
            expect.objectContaining({ alreadyAccepted: [0] })
        );
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'completed');
    });

    it('background: a thrown run (e.g. over budget) is caught and resets to failed (no unhandled rejection)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        mockRunLoop.mockRejectedValue(new BookRunError('Run token budget exhausted.'));
        // The run error happens AFTER 202, so the response is still a clean 202.
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(202);
        expect(mockClaim).toHaveBeenCalledWith('user-1', 'b1');

        await flush();
        // The background catch best-effort resets the authoring book to failed.
        expect(mockSetStatus).toHaveBeenCalledTimes(1);
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'failed');
    });

    it('synchronous setup failure (deps build) after claim resets to failed and surfaces the error', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockUseByokKey.mockResolvedValue('sk-stored');
        mockClaim.mockResolvedValue(claimedBook());
        // A throw during synchronous setup (before kickoff) still flows through the
        // outer catch, which maps it and resets the claimed book to failed.
        mockBuildDeps.mockImplementation(() => {
            throw new BookRunError('deps wiring failed');
        });
        const res: any = await POST(req({ provider: 'openai' }), { params });
        expect(res.status).toBe(400);
        expect(res.data.error).toMatch(/deps wiring failed/i);
        expect(mockRunLoop).not.toHaveBeenCalled();
        expect(mockSetStatus).toHaveBeenCalledWith('user-1', 'b1', 'failed');
    });
});
