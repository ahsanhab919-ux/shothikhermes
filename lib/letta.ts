/**
 * Letta client + WRITING.md memory service (Phase 1 keystone).
 *
 * WRITING.md is Shothik's persistent-context document — the "brain" that Twin
 * (and later Second Me) reads before writing and updates after learning about
 * the user's voice, audience, terminology, and goals.
 *
 * Architecture decision (see MEMORY-STACK-EVALUATION.md):
 *   - ADOPT Letta (self-hosted) as the stateful-agent memory framework.
 *   - Each user gets ONE Letta agent that owns their WRITING.md.
 *   - WRITING.md lives as a human-readable Letta CORE MEMORY BLOCK
 *     (label "writing_md"), so it is versioned, patchable, and auditable.
 *   - Model/embedding are configured per-agent -> clean BYOK path (Phase 2).
 *   - Metadata (agentId, blockLabel, updatedAt) is mirrored in MongoDB so the
 *     app can look up a user's agent without a Letta round-trip.
 *
 * Letta TS SDK: @letta-ai/letta-client (v1.12.x, snake_case params)
 *   - new Letta({ baseURL, apiKey })
 *   - client.agents.create({ name, model, embedding, memory_blocks })
 *   - client.agents.blocks.retrieve(blockLabel, { agent_id })
 *   - client.agents.blocks.update(blockLabel, { agent_id, value, limit })
 * (HTTP: PATCH /v1/agents/{agent_id}/core-memory/blocks/{block_label})
 */

import Letta from '@letta-ai/letta-client';

// The canonical label for the WRITING.md core-memory block on every agent.
export const WRITING_MD_BLOCK_LABEL = 'writing_md';

// Generous character budget for the WRITING.md block. Letta keeps this in the
// context window, so we cap it; overflow guidance is enforced in the API layer.
export const WRITING_MD_BLOCK_LIMIT = 20000;

// Persona block gives Twin its operating instructions re: WRITING.md.
const TWIN_PERSONA = [
    'You are Twin, the user\'s writing partner inside Shothik.',
    'The "writing_md" memory block is the user\'s WRITING.md: their living style guide',
    '(voice, audience, terminology, goals, do/don\'t rules).',
    'Always read writing_md before drafting. When you learn a durable preference,',
    'update writing_md via your memory tools. Keep it concise and well-structured.',
].join(' ');

// A sensible starting WRITING.md so a new user is never staring at a blank block.
export const DEFAULT_WRITING_MD = `# WRITING.md

## Voice & Tone
_Describe how you want to sound (e.g. clear, warm, authoritative). Twin follows this._

## Audience
_Who you write for. Reading level, domain expertise, cultural context._

## Terminology & Style
_Preferred terms, spellings, formatting rules, citation style._

## Goals
_What your writing is trying to achieve right now._

## Do / Don't
- Do:
- Don't:
`;

let _client: Letta | null = null;

/**
 * Lazily construct a singleton Letta client.
 *
 * Env:
 *   LETTA_BASE_URL   e.g. http://localhost:8283  (self-hosted server)
 *   LETTA_API_KEY    token for the self-hosted server (optional in local dev)
 *   LETTA_MODEL      default model handle, format "provider/model-name"
 *   LETTA_EMBEDDING  default embedding handle, format "provider/model-name"
 */
export function getLettaClient(): Letta {
    if (_client) return _client;

    const baseURL = process.env.LETTA_BASE_URL;
    if (!baseURL) {
        throw new Error(
            'LETTA_BASE_URL is not set. Point it at your self-hosted Letta server (e.g. http://localhost:8283).'
        );
    }

    _client = new Letta({
        baseURL,
        // apiKey may be null for an unsecured local server.
        apiKey: process.env.LETTA_API_KEY ?? null,
    });
    return _client;
}

export const DEFAULT_MODEL = process.env.LETTA_MODEL || 'openai/gpt-4o-mini';
export const DEFAULT_EMBEDDING =
    process.env.LETTA_EMBEDDING || 'openai/text-embedding-3-small';

export interface WritingMdResult {
    agentId: string;
    content: string;
    limit: number;
}

/**
 * Create a Letta agent that owns a user's WRITING.md.
 * Returns the new agent id. Caller should persist it in MongoDB.
 *
 * @param userId       Shothik user id (used for agent naming / traceability)
 * @param initial      Optional starting WRITING.md content
 * @param modelHandle  Optional BYOK override (Phase 2). Falls back to server default.
 */
export async function createWritingAgent(
    userId: string,
    initial: string = DEFAULT_WRITING_MD,
    modelHandle: string = DEFAULT_MODEL,
    embeddingHandle: string = DEFAULT_EMBEDDING
): Promise<string> {
    const client = getLettaClient();

    const agent = await client.agents.create({
        name: `writing-md-${userId}`,
        model: modelHandle,
        embedding: embeddingHandle,
        memory_blocks: [
            {
                label: 'persona',
                value: TWIN_PERSONA,
            },
            {
                label: WRITING_MD_BLOCK_LABEL,
                value: initial,
                limit: WRITING_MD_BLOCK_LIMIT,
            },
        ],
    });

    if (!agent?.id) {
        throw new Error('Letta agent creation returned no id.');
    }
    return agent.id;
}

/**
 * Read the current WRITING.md content for an agent.
 */
export async function getWritingMd(agentId: string): Promise<WritingMdResult> {
    const client = getLettaClient();
    const block = await client.agents.blocks.retrieve(WRITING_MD_BLOCK_LABEL, {
        agent_id: agentId,
    });
    return {
        agentId,
        content: block?.value ?? '',
        limit: block?.limit ?? WRITING_MD_BLOCK_LIMIT,
    };
}

/**
 * Overwrite the WRITING.md content (full save from the editor).
 * PATCH /v1/agents/{agent_id}/core-memory/blocks/writing_md
 */
export async function saveWritingMd(
    agentId: string,
    content: string
): Promise<WritingMdResult> {
    const client = getLettaClient();
    const block = await client.agents.blocks.update(WRITING_MD_BLOCK_LABEL, {
        agent_id: agentId,
        value: content,
    });
    return {
        agentId,
        content: block?.value ?? content,
        limit: block?.limit ?? WRITING_MD_BLOCK_LIMIT,
    };
}

export default {
    getLettaClient,
    createWritingAgent,
    getWritingMd,
    saveWritingMd,
    WRITING_MD_BLOCK_LABEL,
    WRITING_MD_BLOCK_LIMIT,
    DEFAULT_WRITING_MD,
};
