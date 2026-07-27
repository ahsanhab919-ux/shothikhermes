import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getBook, listChapterAttempts, BookServiceError } from '@/lib/book/book-service';

/**
 * GET /api/book/[id]/attempts — the per-chapter attempt/gate history for one owned
 * book (newest first, bounded). Thin shell over book-service; ownership is enforced
 * there (queries scoped to userId). A missing/foreign book ⇒ 404 via getBook's
 * BookServiceError.code==='NOT_FOUND', so history is never listed for a book the caller
 * doesn't own. Mirrors GET /api/book/[id].
 *
 * Returns: { attempts }
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

        // Confirm ownership first so a missing/foreign book is a crisp 404 rather
        // than an empty list.
        await getBook(userId, id);
        const attempts = await listChapterAttempts(userId, id);
        return NextResponse.json({ attempts });
    } catch (error) {
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === 'NOT_FOUND' ? 404 : 400 }
            );
        }
        console.error('Error fetching chapter attempts:', error);
        return NextResponse.json({ error: 'Failed to fetch chapter attempts.' }, { status: 500 });
    }
}
