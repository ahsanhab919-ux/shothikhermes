/**
 * Book Authoring — story-bible manager (Track D, Step D2 of BOOK-AUTHORING-SPEC.md §3).
 *
 * The story bible is the COHERENCE SPINE of a long-form book: the persistent,
 * updated memory the chapter generator reads before writing each chapter and
 * writes back after each accepted chapter. It is what lets chapter 40 stay
 * consistent with chapter 3 while the model context window stays small — state
 * lives in the bible, not the prompt (spec §3, same brain↔memory pattern as the
 * Twin's WRITING.md).
 *
 * Mechanism (deliberate reuse, NOT a new memory stack — MEMORY-STACK-EVALUATION
 * settled this): a dedicated Letta CORE-MEMORY BLOCK labelled `book_bible_<id>`
 * on the user's EXISTING writing agent. Same primitive as `writing_md` in
 * src/lib/letta.ts — retrieve before generating, update after accepting.
 *
 * Design (senior-dev):
 *  - Do NOT create a new Letta agent per book. Attach the bible block to the
 *    user's existing writing agent (same discipline as `ensureSecondMeIdentity`,
 *    which reuses WritingProfile.lettaAgentId). One agent owns the user's memory.
 *  - The bible is a RUNNING SUMMARY, hard-bounded by the block char-limit — full
 *    chapter text lives in MongoDB (Chapter model, D-later), never in the bible.
 *    Writes over the limit fail closed with a clear error, they do not truncate
 *    silently (silent truncation = lost plot state = the exact bug we exist to
 *    prevent).
 *  - Reads degrade, writes fail loud. `getBibleBlock` never throws (Letta down or
 *    block absent ⇒ empty, mirroring `readWritingContext`), because a missing
 *    bible must not crash a read path. But a WRITE that cannot persist must be
 *    surfaced — a chapter accepted whose bible update was silently dropped would
 *    corrupt every later chapter.
 *  - The rendered bible has a fixed section structure so D3 can update it
 *    programmatically (`renderBible`/`parseBible` are pure + fully unit-testable
 *    with no Letta involved).
 */
import { getLettaClient, WRITING_MD_BLOCK_LIMIT } from '@/lib/letta';

/** Thrown when a bible block cannot be created/attached or a write cannot persist. */
export class BookBibleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BookBibleError';
    }
}

/**
 * Character budget for a bible block. Same order as WRITING.md (20000): Letta
 * keeps this in-context, so it must stay a compressed summary, not the manuscript.
 */
export const BOOK_BIBLE_BLOCK_LIMIT = WRITING_MD_BLOCK_LIMIT;

/** Canonical block label for a book's bible. Pure, deterministic. */
export function bibleBlockLabel(bookId: string): string {
    const id = String(bookId ?? '').trim();
    if (id.length === 0) {
        throw new BookBibleError('bibleBlockLabel: bookId is required');
    }
    return `book_bible_${id}`;
}

/** The structured sections the bible tracks (spec §3). */
export interface BibleFields {
    /** One-paragraph running synopsis. */
    synopsis: string;
    /** Character sheets (fiction) — name → notes. Freeform lines. */
    characters: string[];
    /** Timeline / plot state — what has happened so far, in order. */
    timeline: string[];
    /** Established facts (heavier for non-fiction) — canonical, do-not-contradict. */
    establishedFacts: string[];
    /** Open threads — promises made to the reader not yet paid off. */
    openThreads: string[];
    /** Voice rules — a POINTER to WRITING.md, not a copy (spec §3). */
    voiceRules: string;
}

/** An empty bible — every field present, nothing asserted yet. */
export const EMPTY_BIBLE_FIELDS: BibleFields = {
    synopsis: '',
    characters: [],
    timeline: [],
    establishedFacts: [],
    openThreads: [],
    voiceRules: 'See WRITING.md (voice, audience, terminology, do/don\'t).',
};

const SECTION = {
    synopsis: '## Synopsis',
    characters: '## Characters',
    timeline: '## Timeline / Plot State',
    establishedFacts: '## Established Facts',
    openThreads: '## Open Threads',
    voiceRules: '## Voice Rules',
} as const;

function renderList(items: string[]): string {
    const clean = items.map((i) => i.trim()).filter((i) => i.length > 0);
    if (clean.length === 0) return '_none yet_';
    return clean.map((i) => `- ${i}`).join('\n');
}

/**
 * Render a structured bible to the markdown stored in the Letta block. Pure.
 * Deterministic section order so `parseBible(renderBible(x))` round-trips.
 */
export function renderBible(fields: BibleFields): string {
    return [
        `${SECTION.synopsis}`,
        fields.synopsis.trim() || '_none yet_',
        '',
        `${SECTION.characters}`,
        renderList(fields.characters),
        '',
        `${SECTION.timeline}`,
        renderList(fields.timeline),
        '',
        `${SECTION.establishedFacts}`,
        renderList(fields.establishedFacts),
        '',
        `${SECTION.openThreads}`,
        renderList(fields.openThreads),
        '',
        `${SECTION.voiceRules}`,
        fields.voiceRules.trim() || EMPTY_BIBLE_FIELDS.voiceRules,
        '',
    ].join('\n');
}

/** The seed bible written when a book's block is first created. */
export const DEFAULT_BOOK_BIBLE = renderBible(EMPTY_BIBLE_FIELDS);

/** Parse a rendered bible back into fields. Pure; tolerant of missing sections. */
export function parseBible(content: string): BibleFields {
    const text = typeof content === 'string' ? content : '';
    const labels = Object.values(SECTION);

    const sectionBody = (label: string): string => {
        const start = text.indexOf(label);
        if (start === -1) return '';
        const after = start + label.length;
        // End at the next known section header, else end of doc.
        let end = text.length;
        for (const other of labels) {
            if (other === label) continue;
            const idx = text.indexOf(other, after);
            if (idx !== -1 && idx < end) end = idx;
        }
        return text.slice(after, end).trim();
    };

    const asList = (body: string): string[] => {
        if (!body || body === '_none yet_') return [];
        return body
            .split('\n')
            .map((l) => l.replace(/^[-*+]\s+/, '').trim())
            .filter((l) => l.length > 0 && l !== '_none yet_');
    };

    const asText = (body: string): string => (body === '_none yet_' ? '' : body);

    return {
        synopsis: asText(sectionBody(SECTION.synopsis)),
        characters: asList(sectionBody(SECTION.characters)),
        timeline: asList(sectionBody(SECTION.timeline)),
        establishedFacts: asList(sectionBody(SECTION.establishedFacts)),
        openThreads: asList(sectionBody(SECTION.openThreads)),
        voiceRules: asText(sectionBody(SECTION.voiceRules)) || EMPTY_BIBLE_FIELDS.voiceRules,
    };
}

export interface BibleBlockResult {
    agentId: string;
    bookId: string;
    label: string;
    content: string;
    limit: number;
}

/**
 * Ensure a bible block exists on the given (existing) writing agent for a book.
 * Idempotent: if the labelled block is already attached, returns it untouched;
 * otherwise creates the block and attaches it to the agent with the seed content.
 *
 * @param agentId  The user's EXISTING Letta agent (WritingProfile.lettaAgentId).
 * @param bookId   The book this bible belongs to.
 * @param initial  Optional seed content (defaults to DEFAULT_BOOK_BIBLE).
 */
export async function ensureBibleBlock(
    agentId: string,
    bookId: string,
    initial: string = DEFAULT_BOOK_BIBLE
): Promise<BibleBlockResult> {
    if (!agentId) throw new BookBibleError('ensureBibleBlock: agentId is required');
    const label = bibleBlockLabel(bookId);
    if (initial.length > BOOK_BIBLE_BLOCK_LIMIT) {
        throw new BookBibleError(
            `Initial bible exceeds block limit (${initial.length} > ${BOOK_BIBLE_BLOCK_LIMIT}).`
        );
    }
    const client = getLettaClient();

    // Already attached? Return it as-is (idempotent).
    try {
        const existing = await client.agents.blocks.retrieve(label, { agent_id: agentId });
        if (existing) {
            return {
                agentId,
                bookId: String(bookId).trim(),
                label,
                content: existing.value ?? '',
                limit: existing.limit ?? BOOK_BIBLE_BLOCK_LIMIT,
            };
        }
    } catch {
        // Not attached yet — fall through to create + attach.
    }

    let created;
    try {
        created = await client.blocks.create({
            label,
            value: initial,
            limit: BOOK_BIBLE_BLOCK_LIMIT,
        });
        if (!created?.id) {
            throw new BookBibleError('Letta block creation returned no id.');
        }
        await client.agents.blocks.attach(created.id, { agent_id: agentId });
    } catch (err) {
        if (err instanceof BookBibleError) throw err;
        throw new BookBibleError(
            `Failed to create/attach bible block for book ${String(bookId)}: ${
                err instanceof Error ? err.message : String(err)
            }`
        );
    }

    return {
        agentId,
        bookId: String(bookId).trim(),
        label,
        content: created.value ?? initial,
        limit: created.limit ?? BOOK_BIBLE_BLOCK_LIMIT,
    };
}

/**
 * Read a book's bible content. NEVER throws on Letta/absence — degrades to empty,
 * mirroring `readWritingContext`. A missing bible must not crash a read path.
 */
export async function getBibleBlock(
    agentId: string,
    bookId: string
): Promise<BibleBlockResult> {
    const trimmed = String(bookId ?? '').trim();
    const label = trimmed.length > 0 ? `book_bible_${trimmed}` : '';
    const fallback: BibleBlockResult = {
        agentId,
        bookId: trimmed,
        label,
        content: '',
        limit: BOOK_BIBLE_BLOCK_LIMIT,
    };
    if (!agentId || !label) return fallback;
    try {
        const client = getLettaClient();
        const block = await client.agents.blocks.retrieve(label, { agent_id: agentId });
        return {
            agentId,
            bookId: trimmed,
            label,
            content: block?.value ?? '',
            limit: block?.limit ?? BOOK_BIBLE_BLOCK_LIMIT,
        };
    } catch {
        return fallback;
    }
}

/**
 * Overwrite a book's bible content. Fails LOUD: an over-limit or failed write is
 * surfaced (a silently-dropped bible update corrupts every later chapter). The
 * block must already exist (call ensureBibleBlock first).
 */
export async function updateBibleBlock(
    agentId: string,
    bookId: string,
    content: string
): Promise<BibleBlockResult> {
    if (!agentId) throw new BookBibleError('updateBibleBlock: agentId is required');
    const label = bibleBlockLabel(bookId);
    if (typeof content !== 'string') {
        throw new BookBibleError('updateBibleBlock: content must be a string.');
    }
    if (content.length > BOOK_BIBLE_BLOCK_LIMIT) {
        throw new BookBibleError(
            `Bible update exceeds block limit (${content.length} > ${BOOK_BIBLE_BLOCK_LIMIT}). ` +
                'Summarize/compress the bible; do not store full chapter text here.'
        );
    }
    try {
        const client = getLettaClient();
        const block = await client.agents.blocks.update(label, {
            agent_id: agentId,
            value: content,
        });
        return {
            agentId,
            bookId: String(bookId).trim(),
            label,
            content: block?.value ?? content,
            limit: block?.limit ?? BOOK_BIBLE_BLOCK_LIMIT,
        };
    } catch (err) {
        throw new BookBibleError(
            `Failed to persist bible update for book ${String(bookId)}: ${
                err instanceof Error ? err.message : String(err)
            }`
        );
    }
}

export default {
    bibleBlockLabel,
    renderBible,
    parseBible,
    ensureBibleBlock,
    getBibleBlock,
    updateBibleBlock,
    BOOK_BIBLE_BLOCK_LIMIT,
    DEFAULT_BOOK_BIBLE,
    EMPTY_BIBLE_FIELDS,
};
