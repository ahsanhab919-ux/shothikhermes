import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getBook, getAcceptedChapters, BookServiceError } from '@/lib/book/book-service';
import { assembleManuscript, BookExportError } from '@/lib/book/export';

/**
 * GET /api/book/[id]/export — assemble an owned book's accepted chapters into a
 * single markdown manuscript (Track D, D5). Thin shell: auth → load owned book +
 * accepted chapters → pure assembleManuscript → return.
 *
 * assembleManuscript is fail-closed: it refuses to export a book with no accepted
 * chapters (or gapped/blank ones), surfaced here as a 400. This is the export
 * side of the "no silent shipping" rule — you cannot download an unfinished book.
 *
 * Returns: { filename, markdown, chapterCount, wordCount, charCount }
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

        const assembled = assembleManuscript(
            chapters.map((c) => ({ index: c.index, intent: c.intent, content: c.content })),
            {
                title: book.title,
                subtitle: book.subtitle,
                author: book.author,
            }
        );

        return NextResponse.json({
            filename: assembled.filename,
            markdown: assembled.markdown,
            chapterCount: assembled.chapterCount,
            wordCount: assembled.wordCount,
            charCount: assembled.charCount,
        });
    } catch (error) {
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === 'NOT_FOUND' ? 404 : 400 }
            );
        }
        if (error instanceof BookExportError) {
            // Can't assemble (e.g. no accepted chapters yet) — a client-state issue.
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error exporting book:', error);
        return NextResponse.json({ error: 'Failed to export book.' }, { status: 500 });
    }
}
