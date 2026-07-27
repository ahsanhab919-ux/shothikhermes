import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getBook, getChapterProgress, BookServiceError } from '@/lib/book/book-service';

/**
 * GET /api/book/[id]/status — poll an owned book's run progress (Wave 3).
 *
 * The read side of the async run: POST /run returns 202 and authors in an
 * in-process background task; this surfaces where that run is up to. Owner-scoped
 * (getChapterProgress returns null for a missing/foreign book ⇒ 404), so progress
 * is never disclosed for a book the caller doesn't own.
 *
 * Returns a COMPACT, prose-free summary only: the book's lifecycle status plus a
 * per-index accepted/failed rollup. It deliberately WITHHOLDS chapter prose and
 * the gate-issue detail (available, if needed, via GET /api/book/[id]/attempts) —
 * mirroring the list-vs-detail withhold discipline of the re-educator routes.
 *
 * Returns: { bookId, status, progress: { total, accepted, failed, lastIndex, perIndex } }
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const userId = String(user._id || user.id);

        const progress = await getChapterProgress(userId, id);
        if (!progress) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });

        const book = await getBook(userId, id);
        return NextResponse.json({ bookId: id, status: book.status, progress });
    } catch (error) {
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === 'NOT_FOUND' ? 404 : 400 }
            );
        }
        console.error('Error fetching book status:', error);
        return NextResponse.json({ error: 'Failed to fetch book status.' }, { status: 500 });
    }
}
