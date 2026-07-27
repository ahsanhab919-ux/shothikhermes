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

describe('GET /api/book/[id]/export', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(401);
    });

    it('assembles and returns the manuscript', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue({ title: 'Vale', subtitle: undefined, author: undefined });
        mockGetChapters.mockResolvedValue([
            { index: 0, intent: 'One', content: 'First chapter body.' },
            { index: 1, intent: 'Two', content: 'Second chapter body.' },
        ]);
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(200);
        expect(res.data.filename).toBe('vale.md');
        expect(res.data.chapterCount).toBe(2);
        expect(res.data.markdown).toContain('# Vale');
        expect(res.data.markdown).toContain('## One');
    });

    it('returns 400 when there are no accepted chapters to export', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockGetBook.mockResolvedValue({ title: 'Vale' });
        mockGetChapters.mockResolvedValue([]); // assembleManuscript throws BookExportError
        const res: any = await GET({} as never, { params });
        expect(res.status).toBe(400);
    });

    it('maps a not-found book to 404', async () => {
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
