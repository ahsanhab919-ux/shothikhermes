/**
 * Second Me — crypto vault (Step 4, encrypt-at-rest primitive).
 *
 * This is the small, pure crypto core the key-custody store is built on. It is
 * the FIRST at-rest encryption utility in the repo: everything the app persists
 * that must never be stored in the clear (BYOK provider keys today; the Second Me
 * private signing key later — the seam Step 1 deferred) is sealed through here.
 *
 * Construction (deliberately boring, standard, and auditable):
 *   - AES-256-GCM. Authenticated encryption: the 128-bit GCM tag is verified on
 *     open, so any tampering with the stored ciphertext (or a wrong key) fails
 *     LOUDLY with a thrown error rather than returning garbage plaintext.
 *   - A fresh random 96-bit IV per seal (never reused — GCM's one hard rule).
 *   - The 256-bit data key is derived from a single env secret
 *     (`SECOND_ME_VAULT_SECRET`) via scrypt with a fixed application salt, so the
 *     operator supplies one high-entropy secret and we stretch it to a key.
 *
 * On-disk shape is a self-describing, versioned string so the format can evolve
 * without a migration guessing game:
 *
 *     v1.<iv-b64>.<tag-b64>.<ciphertext-b64>
 *
 * SECURITY INVARIANTS (enforced by construction here, relied on by callers):
 *   - Plaintext is NEVER logged, NEVER put in an Error message, and NEVER
 *     returned except as the direct return value of `open`. There is no code path
 *     that emits key material to stdout/stderr or telemetry.
 *   - `seal`/`open` are pure w.r.t. process state apart from reading the env
 *     secret; no network, no disk, no globals mutated.
 *   - Fail CLOSED: a missing/short secret, malformed envelope, or failed tag
 *     check throws — callers must treat "cannot open" as "no key", never as ok.
 *
 * Spec: SECOND-ME-SPEC.md §5–§6 (identity/custody), RE-EDUCATOR-SPEC.md §8
 * (never log the key, fail closed).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/** Envelope format tag. Bump if the construction below ever changes. */
const VERSION = 'v1' as const;
const ALGORITHM = 'aes-256-gcm' as const;
const KEY_LEN = 32; // 256-bit data key
const IV_LEN = 12; // 96-bit nonce — GCM standard
const TAG_LEN = 16; // 128-bit auth tag
/** Minimum acceptable operator secret length. Short secrets defeat the point. */
const MIN_SECRET_LEN = 16;

/**
 * A fixed, application-scoped salt for the scrypt KDF. This is NOT secret — its
 * only job is to domain-separate this key derivation from any other scrypt use,
 * so the same operator secret can't accidentally yield the same key elsewhere.
 * The confidentiality comes entirely from `SECOND_ME_VAULT_SECRET`.
 */
const KDF_SALT = Buffer.from('second-me/crypto-vault/v1', 'utf8');

/** Thrown for any vault failure. Message NEVER contains plaintext or the secret. */
export class VaultError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VaultError';
    }
}

/**
 * Derive the 256-bit data key from the operator secret. Reads
 * `SECOND_ME_VAULT_SECRET` at call time (not module load) so tests and
 * deployments can set it without import-order games. Throws VaultError if the
 * secret is absent or too short — we never silently fall back to a weak key.
 */
function deriveKey(): Buffer {
    const secret = process.env.SECOND_ME_VAULT_SECRET;
    if (typeof secret !== 'string' || secret.length < MIN_SECRET_LEN) {
        throw new VaultError(
            `SECOND_ME_VAULT_SECRET must be set to a string of at least ${MIN_SECRET_LEN} characters`
        );
    }
    return scryptSync(secret, KDF_SALT, KEY_LEN);
}

/**
 * Encrypt `plaintext` into a self-describing envelope string. A fresh random IV
 * is generated per call, so sealing the same plaintext twice yields different
 * ciphertext (no deterministic-encryption leakage).
 *
 * SECURITY: `plaintext` is consumed here and never logged or echoed.
 */
export function seal(plaintext: string): string {
    if (typeof plaintext !== 'string') {
        // Note: we describe the FAULT, never the value.
        throw new VaultError('seal: plaintext must be a string');
    }
    const key = deriveKey();
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
        VERSION,
        iv.toString('base64'),
        tag.toString('base64'),
        ciphertext.toString('base64'),
    ].join('.');
}

/**
 * Decrypt an envelope produced by `seal`, verifying the GCM auth tag. Throws
 * VaultError on any malformed envelope, wrong key, or tampering. The recovered
 * plaintext is returned ONLY as the return value — never logged.
 */
export function open(envelope: string): string {
    if (typeof envelope !== 'string' || envelope.length === 0) {
        throw new VaultError('open: envelope must be a non-empty string');
    }
    const parts = envelope.split('.');
    if (parts.length !== 4) {
        throw new VaultError('open: malformed envelope (expected 4 parts)');
    }
    const [version, ivB64, tagB64, ctB64] = parts;
    if (version !== VERSION) {
        throw new VaultError(`open: unsupported envelope version`);
    }

    let iv: Buffer;
    let tag: Buffer;
    let ciphertext: Buffer;
    try {
        iv = Buffer.from(ivB64, 'base64');
        tag = Buffer.from(tagB64, 'base64');
        ciphertext = Buffer.from(ctB64, 'base64');
    } catch {
        throw new VaultError('open: malformed envelope (bad base64)');
    }
    if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
        throw new VaultError('open: malformed envelope (bad iv/tag length)');
    }

    const key = deriveKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    try {
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return plaintext.toString('utf8');
    } catch {
        // A failed tag check (tampering or wrong key) lands here. We deliberately
        // do NOT surface the underlying error — it carries no plaintext, but we
        // keep the message generic and fail closed.
        throw new VaultError('open: decryption failed (wrong key or tampered ciphertext)');
    }
}

/**
 * True iff the vault is usable in this process (secret present + long enough).
 * Lets callers decide up front whether custody is available without attempting
 * a real seal. Never throws, never reveals the secret.
 */
export function vaultAvailable(): boolean {
    const secret = process.env.SECOND_ME_VAULT_SECRET;
    return typeof secret === 'string' && secret.length >= MIN_SECRET_LEN;
}
