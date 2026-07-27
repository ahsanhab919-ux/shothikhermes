import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getBook, getAcceptedChapters, BookServiceError } from '@/lib/book/book-service';

/**
 * GET /api/book/[id] — snapshot of one owned book: its metadata + plan + the
 * chapters accepted so far (in reading order). Thin shell over book-service;
 * ownership is enforced there (queries scoped to userId). Missing/foreign book
 * ⇒ 404 via BookServiceError.code==='NOT_FOUND'.
 *
 * Returns: { book, chapters }
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

        const book = await getBook(userId, id);
        const chapters = await getAcceptedChapters(userId, id);
        return NextResponse.json({ book, chapters });
    } catch (error) {
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === 'NOT_FOUND' ? 404 : 400 }
            );
        }
        console.error('Error fetching book:', error);
        return NextResponse.json({ error: 'Failed to fetch book.' }, { status: 500 });
    }
}
