import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { createBook, listBooks, BookServiceError } from '@/lib/book/book-service';
import { BookIngestError } from '@/lib/book/ingest';

/**
 * /api/book — create and list book-authoring projects (Track D).
 *
 * Thin HTTP shell over src/lib/book/book-service.ts: auth → parse → service →
 * JSON, mirroring /api/re-educator. All validation/decision logic lives in the
 * service so it stays unit-testable without HTTP. Parse-family errors
 * (BookServiceError, BookIngestError) map to 400; everything else 500.
 */

/** Map a domain error to its HTTP status; null if not a known client error. */
function clientErrorStatus(error: unknown): number | null {
    if (error instanceof BookServiceError) return error.code === 'NOT_FOUND' ? 404 : 400;
    if (error instanceof BookIngestError) return 400;
    return null;
}

/**
 * POST /api/book — create a book from an uploaded document.
 * Body: { title: string, subtitle?: string, author?: string,
 *         kindOverride?: 'fiction'|'nonfiction', document: string }
 * Returns: { book }
 */
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 });
        }

        const userId = String(user._id || user.id);
        const book = await createBook(userId, body);
        return NextResponse.json({ book }, { status: 201 });
    } catch (error) {
        const status = clientErrorStatus(error);
        if (status) {
            return NextResponse.json({ error: (error as Error).message }, { status });
        }
        console.error('Error creating book:', error);
        return NextResponse.json({ error: 'Failed to create book.' }, { status: 500 });
    }
}

/**
 * GET /api/book — list the authenticated user's books (newest first).
 * Returns: { books }
 */
export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = String(user._id || user.id);
        const books = await listBooks(userId);
        return NextResponse.json({ books });
    } catch (error) {
        const status = clientErrorStatus(error);
        if (status) {
            return NextResponse.json({ error: (error as Error).message }, { status });
        }
        console.error('Error listing books:', error);
        return NextResponse.json({ error: 'Failed to list books.' }, { status: 500 });
    }
}
