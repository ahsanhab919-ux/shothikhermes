import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockGetBook, mockGetProgress } = vi.hoisted(() => ({
    mockGetBook: vi.fn(),
    mockGetProgress: vi.fn(),
}));

// Keep the real BookServiceError; mock only the DB-touching fns.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    getBook: mockGetBook,
    getChapterProgress: mockGetProgress,
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { GET } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';

const params = Promise.resolve({ id: 'b1' });
const authed = { _id: 'user-1' };

beforeEach(() => {
    vi.clearAllMocks();
});

describe('GET /api/book/[id]/status (run progress poll)', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(401);
        expect(mockGetProgress).not.toHaveBeenCalled();
    });

    it('404 when the book is missing/not owned (getChapterProgress returns null)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetProgress.mockResolvedValue(null);
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(404);
        expect(mockGetProgress).toHaveBeenCalledWith('user-1', 'b1');
        // Never falls through to read the book's status for a book we can't see.
        expect(mockGetBook).not.toHaveBeenCalled();
    });

    it('200 returns the book status + a compact progress rollup', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetProgress.mockResolvedValue({
            total: 2,
            accepted: 1,
            failed: 0,
            lastIndex: 0,
            perIndex: [{ index: 0, status: 'accepted', attempt: 1 }],
        });
        mockGetBook.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'running' });
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(200);
        expect(res.data.bookId).toBe('b1');
        expect(res.data.status).toBe('running');
        expect(res.data.progress.accepted).toBe(1);
        expect(res.data.progress.perIndex).toHaveLength(1);
    });

    it('withholds prose and gate-issue detail (compact summary only)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetProgress.mockResolvedValue({
            total: 1,
            accepted: 0,
            failed: 1,
            lastIndex: 0,
            perIndex: [{ index: 0, status: 'failed', attempt: 3 }],
        });
        mockGetBook.mockResolvedValue({ _id: 'b1', userId: 'user-1', status: 'failed' });
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(200);
        const payload = JSON.stringify(res.data);
        // The poll never leaks chapter prose or the gate-issue detail.
        expect(payload).not.toContain('gateIssues');
        expect(payload).not.toContain('content');
        expect(payload).not.toContain('issues');
    });
});
