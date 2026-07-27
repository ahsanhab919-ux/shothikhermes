import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { getBook, BookServiceError } from '@/lib/book/book-service';
import { authorSingleChapter, BookAuthorError, type PlannedChapter } from '@/lib/book/author';
import { buildAuthorDeps, BookRunError } from '@/lib/book/provider';
import { ensureBibleBlock, BookBibleError } from '@/lib/book/bible';
import { getOrCreateWritingProfile } from '@/lib/writingProfile';
import { getWritingMd } from '@/lib/letta';
import { isByokProvider, type ByokProviderName } from '@/lib/re-educator/byok';
import { useByokKey } from '@/lib/second-me/key-custody';

/**
 * POST /api/book/[id]/chapter/[index]/regenerate — re-author ONE chapter of an
 * owned book with the user's BYOK model (Wave 4A, audit A4).
 *
 * The targeted counterpart to POST /run: instead of authoring the whole plan in a
 * background task, this SYNCHRONOUSLY regenerates a single chapter and returns its
 * outcome. It reuses the exact generate → done-gate → regen-on-fail engine one
 * iteration of the loop uses (`authorSingleChapter` → the shared `authorChapterOnce`
 * in author.ts), so a regenerated chapter clears the identical bar and, on
 * acceptance, is persisted (saveChapterRecord) + folded into the bible + attempt-
 * logged exactly as the loop does. The gate is REUSED, not re-implemented.
 *
 * Shell shape mirrors run/route.ts: auth → parse → BYOK key capture → owner load →
 * deps → author → JSON. BYOK key custody and the per-run token budget are preserved
 * via provider.ts (buildAuthorDeps); the key is never logged or echoed.
 *
 * Concurrency (must NOT weaken the loop): if the book is currently `authoring` (a
 * full run is in flight), a targeted regen is rejected 409 so it cannot race the
 * loop's writes to the same chapter/bible. Only a `draft`/`complete`/`failed` book
 * may be regenerated chapter-by-chapter.
 *
 * Book-level status is DELIBERATELY left unchanged: a targeted regen is a surgical
 * fix, not a run. Flipping the book to `authoring`/`complete`/`failed` here would
 * misreport a whole-book run and would collide with the loop's own status writes.
 * The chapter's own accepted/failed state (and its attempt history) is the source
 * of truth for what this endpoint changed.
 *
 * Body: { provider: 'openai'|'anthropic', model?: string }
 * Returns: 200 { bookId, index, outcome } on accept;
 *          422 { bookId, index, outcome } on gate-fail exhaustion (prior accepted
 *          chapter and the bible are left untouched).
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; index: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, index: indexParam } = await params;
        const bookId = id;
        const userId = String(user._id || user.id);

        // Index must be a non-negative integer literal (reject "1.5", "abc", "-1").
        if (!/^\d+$/.test(indexParam)) {
            return NextResponse.json(
                { error: 'Chapter index must be a non-negative integer.' },
                { status: 400 }
            );
        }
        const index = Number(indexParam);

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Body must be valid JSON.' }, { status: 400 });
        }
        const b = (body ?? {}) as Record<string, unknown>;
        const provider = b.provider;
        if (!isByokProvider(provider)) {
            return NextResponse.json(
                { error: 'A valid "provider" (openai or anthropic) is required.' },
                { status: 400 }
            );
        }
        const model = typeof b.model === 'string' && b.model.length > 0 ? b.model : undefined;

        // Recover the BYOK key BEFORE any provider work (fail-closed): a per-request
        // header wins (kept out of captured bodies), else the user's sealed custody.
        const headerKey = request.headers.get('x-second-me-key') ?? undefined;
        // eslint-disable-next-line react-hooks/rules-of-hooks -- useByokKey is a server-side custody accessor, not a React hook (name collision on the `use` prefix).
        const apiKey = headerKey || (await useByokKey(userId, provider as ByokProviderName));
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: `No BYOK key available for "${provider}". Store one via /api/second-me/keys or send it in the x-second-me-key header.`,
                },
                { status: 400 }
            );
        }

        // Owner-scoped load (404 for a missing/foreign book — no prose leaks).
        const book = await getBook(userId, bookId);

        // Concurrency guard: never race a full run. A book mid-`authoring` is owned
        // by the loop; a targeted regen must wait until it settles (reset/complete).
        if (book.status === 'running') {
            return NextResponse.json(
                { error: 'Book is currently authoring; wait for the run to finish before regenerating a chapter.' },
                { status: 409 }
            );
        }

        // Validate the index is within the book's plan bounds.
        const plan: PlannedChapter[] = book.plan.map((c) => ({
            index: c.index,
            intent: c.intent,
            beats: c.beats,
        }));
        const planned = plan.find((c) => c.index === index);
        if (!planned) {
            return NextResponse.json(
                { error: `Chapter index ${index} is outside this book's plan.` },
                { status: 400 }
            );
        }

        // The user's writing agent owns WRITING.md (voice) + the bible block.
        const profile = await getOrCreateWritingProfile(userId);
        const agentId = profile.lettaAgentId;
        const { content: writingMd } = await getWritingMd(agentId);

        // Ensure the coherence-spine block exists so readBible/updateBible work.
        await ensureBibleBlock(agentId, bookId);

        const deps = buildAuthorDeps({
            userId,
            bookId,
            agentId,
            provider: provider as ByokProviderName,
            apiKey,
            writingMd,
            model: model ?? profile.modelHandle,
        });

        // Regenerate ONLY this chapter through the shared engine. On accept it is
        // persisted + folded into the bible + attempt-logged (inside authorSingleChapter);
        // on exhaustion it returns a failed outcome without saving (the prior
        // accepted chapter and the bible stay intact).
        const outcome = await authorSingleChapter(plan, deps, index);

        if (outcome.status === 'accepted') {
            return NextResponse.json({ bookId, index, outcome }, { status: 200 });
        }
        // Gate-fail exhaustion — mirror the loop's "failed chapter" report with a
        // structured, non-200 body. Book status is left unchanged (see header).
        return NextResponse.json({ bookId, index, outcome }, { status: 422 });
    } catch (error) {
        if (error instanceof BookServiceError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === 'NOT_FOUND' ? 404 : 400 }
            );
        }
        if (
            error instanceof BookRunError ||
            error instanceof BookAuthorError ||
            error instanceof BookBibleError
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error regenerating chapter:', error);
        return NextResponse.json({ error: 'Failed to regenerate chapter.' }, { status: 500 });
    }
}
