import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockGetBook, mockGetChapters } = vi.hoisted(() => ({
    mockGetBook: vi.fn(),
    mockGetChapters: vi.fn(),
}));
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    getBook: mockGetBook,
    getAcceptedChapters: mockGetChapters,
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

beforeEach(() => vi.clearAllMocks());

describe('GET /api/book/[id]', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(401);
    });

    it('returns the book snapshot with accepted chapters', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue({ _id: 'b1', title: 'Novel' });
        mockGetChapters.mockResolvedValue([{ index: 0 }, { index: 1 }]);
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(200);
        expect(res.data.book._id).toBe('b1');
        expect(res.data.chapters).toHaveLength(2);
        expect(mockGetBook).toHaveBeenCalledWith('user-1', 'b1');
    });

    it('maps a not-found BookServiceError to 404', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockGetBook.mockRejectedValue(new BookServiceError('NOT_FOUND', 'Book not found.'));
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(404);
    });

    it('maps an unexpected error to 500', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockGetBook.mockRejectedValue(new Error('db down'));
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(500);
    });
});
