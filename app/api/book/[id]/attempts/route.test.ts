import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockGetBook, mockListAttempts } = vi.hoisted(() => ({
    mockGetBook: vi.fn(),
    mockListAttempts: vi.fn(),
}));

// Keep the real BookServiceError; mock only the DB-touching fns.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    getBook: mockGetBook,
    listChapterAttempts: mockListAttempts,
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { GET } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { BookServiceError } from '@/lib/book/book-service';

const params = Promise.resolve({ id: 'b1' });
const authed = { _id: 'user-1' };

beforeEach(() => {
    vi.clearAllMocks();
});

describe('GET /api/book/[id]/attempts (per-chapter run history)', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(401);
        expect(mockGetBook).not.toHaveBeenCalled();
        expect(mockListAttempts).not.toHaveBeenCalled();
    });

    it('404 when the book is missing/not owned (never lists a foreign book\'s history)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockRejectedValue(new BookServiceError('NOT_FOUND', 'Book not found.'));
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(404);
        // Ownership is enforced before any history is read.
        expect(mockGetBook).toHaveBeenCalledWith('user-1', 'b1');
        expect(mockListAttempts).not.toHaveBeenCalled();
    });

    it('happy path: returns the owned book\'s attempt history', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue({ _id: 'b1', userId: 'user-1' });
        mockListAttempts.mockResolvedValue([
            { index: 0, attempt: 2, status: 'accepted', gateIssues: [] },
            { index: 0, attempt: 1, status: 'failed', gateIssues: ['too flat'] },
        ]);
        const res: any = await GET({} as any, { params });
        expect(res.status).toBe(200);
        expect(mockListAttempts).toHaveBeenCalledWith('user-1', 'b1');
        expect(res.data.attempts).toHaveLength(2);
        expect(res.data.attempts[0]).toMatchObject({ index: 0, attempt: 2, status: 'accepted' });
    });
});
