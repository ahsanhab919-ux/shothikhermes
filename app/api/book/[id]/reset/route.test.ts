import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockReset } = vi.hoisted(() => ({ mockReset: vi.fn() }));

// Keep the real BookServiceError; mock only the DB-touching fn.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    resetBookToDraft: mockReset,
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { POST } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { BookServiceError } from '@/lib/book/book-service';

const params = Promise.resolve({ id: 'b1' });
const authed = { _id: 'user-1' };

beforeEach(() => {
    vi.clearAllMocks();
});

describe('POST /api/book/[id]/reset', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(null);
        const res: any = await POST({} as any, { params });
        expect(res.status).toBe(401);
        expect(mockReset).not.toHaveBeenCalled();
    });

    it('404 when the book is not owned/found (reset rejects notFound)', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockReset.mockRejectedValue(new BookServiceError('NOT_FOUND', 'Book not found.'));
        const res: any = await POST({} as any, { params });
        expect(res.status).toBe(404);
    });

    it('400 on a non-notFound BookServiceError', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockReset.mockRejectedValue(new BookServiceError('VALIDATION', 'resetBookToDraft: bookId is required'));
        const res: any = await POST({} as any, { params });
        expect(res.status).toBe(400);
    });

    it('happy path: resets to draft and returns 200 + book', async () => {
        (getAuthenticatedUser as any).mockResolvedValue(authed);
        mockReset.mockResolvedValue({ _id: 'b1', status: 'draft' });
        const res: any = await POST({} as any, { params });
        expect(res.status).toBe(200);
        expect(res.data.book.status).toBe('draft');
        expect(mockReset).toHaveBeenCalledWith('user-1', 'b1');
    });
});
