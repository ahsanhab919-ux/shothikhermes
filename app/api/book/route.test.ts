import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));
vi.mock('@/lib/server-auth', () => ({ getAuthenticatedUser: vi.fn() }));

const { mockCreateBook, mockListBooks } = vi.hoisted(() => ({
    mockCreateBook: vi.fn(),
    mockListBooks: vi.fn(),
}));
// Keep the real BookServiceError; mock only the DB-touching fns.
vi.mock('@/lib/book/book-service', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/book/book-service')>()),
    createBook: mockCreateBook,
    listBooks: mockListBooks,
}));

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
    },
}));

import { POST, GET } from './route';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { BookServiceError } from '@/lib/book/book-service';
import { BookIngestError } from '@/lib/book/ingest';

function req(body: unknown, badJson = false) {
    return {
        json: async () => {
            if (badJson) throw new Error('bad json');
            return body;
        },
    } as never;
}

const authed = { _id: 'user-1' };

beforeEach(() => vi.clearAllMocks());

describe('POST /api/book', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const res: any = await POST(req({ title: 'T', document: 'x' }));
        expect(res.status).toBe(401);
    });

    it('returns 400 on invalid JSON', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        const res: any = await POST(req({}, true));
        expect(res.status).toBe(400);
    });

    it('creates a book and returns 201', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockCreateBook.mockResolvedValue({ _id: 'b1', title: 'Novel' });
        const res: any = await POST(req({ title: 'Novel', document: '# N\n## C1\n- a' }));
        expect(res.status).toBe(201);
        expect(res.data.book._id).toBe('b1');
        expect(mockCreateBook).toHaveBeenCalledWith('user-1', expect.any(Object));
    });

    it('maps a BookServiceError to 400', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockCreateBook.mockRejectedValue(new BookServiceError('VALIDATION', 'bad title'));
        const res: any = await POST(req({ document: 'x' }));
        expect(res.status).toBe(400);
        expect(res.data.error).toBe('bad title');
    });

    it('maps a BookIngestError to 400', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockCreateBook.mockRejectedValue(new BookIngestError('no headings'));
        const res: any = await POST(req({ title: 'T', document: 'prose' }));
        expect(res.status).toBe(400);
    });

    it('maps an unexpected error to 500', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockCreateBook.mockRejectedValue(new Error('db down'));
        const res: any = await POST(req({ title: 'T', document: 'x' }));
        expect(res.status).toBe(500);
    });
});

describe('GET /api/book', () => {
    it('returns 401 when unauthenticated', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        const res: any = await GET();
        expect(res.status).toBe(401);
    });

    it('lists the user\'s books', async () => {
        (getAuthenticatedUser as ReturnType<typeof vi.fn>).mockResolvedValue(authed);
        mockListBooks.mockResolvedValue([{ _id: 'b1' }, { _id: 'b2' }]);
        const res: any = await GET();
        expect(res.status).toBe(200);
        expect(res.data.books).toHaveLength(2);
        expect(mockListBooks).toHaveBeenCalledWith('user-1');
    });
});
