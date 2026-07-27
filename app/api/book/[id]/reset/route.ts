import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { resetBookToDraft, BookServiceError } from '@/lib/book/book-service';

/**
 * POST /api/book/[id]/reset — move an owned book back to `draft` so it can be
 * re-run. The run route claims strictly `draft → authoring` (claimBookForRun),
 * so a `failed`/`complete`/stuck-`authoring` book is otherwise permanently
 * unrunnable. This is the explicit, human-in-the-loop re-arm: it clears the
 * book's prior Chapter docs and flips status to `draft` (see resetBookToDraft).
 *
 * Idempotent — no request body. Ownership is enforced in the service (queries
 * scoped to userId); a missing/foreign book ⇒ 404 via BookServiceError.code==='NOT_FOUND'.
 *
 * Returns: { book }
 */
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const userId = String(user._id || user.id);

        const book = await resetBookToDraft(userId, id);
        return NextResponse.json({ book });
    } catch (error) {
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === 'NOT_FOUND' ? 404 : 400 }
            );
        }
        console.error('Error resetting book:', error);
        return NextResponse.json({ error: 'Failed to reset book.' }, { status: 500 });
    }
}
