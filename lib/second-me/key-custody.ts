/**
 * Second Me — key custody service (BYOK-at-rest).
 *
 * The persistent, encrypted-at-rest complement to the per-request BYOK path
 * (lib/re-educator/byok.ts). Where byok.ts takes a key that arrives on a single
 * request and is never persisted, this lets a user store a BYOK provider key
 * ONCE, sealed, so later runs reuse it without the key crossing the wire again.
 *
 * Layering: this file owns the "what purposes are legal" policy and the row
 * lifecycle. The actual encryption is delegated to crypto-vault.ts, and the row
 * lives on the additive Convex `secondMeKeyCustody` table (reached through the
 * mockable `convex-second-me-client` transport). The row only ever holds a vault
 * envelope; plaintext exists only transiently inside `storeByokKey` (input) and
 * `useByokKey` (output at point of use).
 *
 * SECURITY:
 *   - The plaintext key is sealed BEFORE any DB write and is never logged.
 *   - Custody is keyed by {userId, purpose} — NEVER by twinId. A twin ownership
 *     transfer can therefore never carry the previous owner's keys.
 *   - Retrieval returns metadata (provider, presence) freely; the plaintext is
 *     handed back ONLY by `useByokKey`, and ONLY to its caller. No other path
 *     returns it, and `listCustody` never returns the sealed envelope.
 *   - Fail CLOSED: a missing vault secret, absent row, or failed open surfaces
 *     as "no usable key" (undefined) at the use site, never a thrown 500.
 *     Storage, being an explicit user action, DOES throw on bad input.
 */
import { seal, open, vaultAvailable, VaultError } from './crypto-vault';
import { runSecondMeQuery, runSecondMeMutation } from './convex-second-me-client';
import { BYOK_PROVIDERS, isByokProvider, type ByokProviderName } from '@/lib/re-educator/byok';

/** Custody purpose namespace for a BYOK provider key. */
export function byokPurpose(provider: ByokProviderName): string {
  return `byok:${provider}`;
}

/** Thrown for a rejected custody STORE (bad input). Never contains the key. */
export class KeyCustodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyCustodyError';
  }
}

/** Non-secret view of a custody row — safe to return/log. Never holds plaintext. */
export interface CustodyRecordView {
  userId: string;
  purpose: string;
  provider?: string;
  /** True — the row exists and holds sealed material. Presence, not the key. */
  present: true;
}

/** Shape of a `secondMeKeyCustody` Convex doc as returned by the transport. */
interface CustodyDoc {
  userId: string;
  purpose: string;
  provider?: string;
  sealedKey: string;
}

function toView(doc: CustodyDoc): CustodyRecordView {
  return {
    userId: doc.userId,
    purpose: doc.purpose,
    provider: doc.provider,
    present: true,
  };
}

/**
 * Store (or replace) a user's sealed BYOK key for one provider. Idempotent per
 * (userId, provider): re-storing overwrites the sealed envelope in place.
 *
 * Validates BEFORE any crypto or DB work (byok.ts validation idiom): unknown
 * provider or empty key is rejected with KeyCustodyError. The plaintext key is
 * sealed and only the envelope is written — the DB never sees the key.
 */
export async function storeByokKey(
  userId: string,
  provider: string,
  apiKey: string
): Promise<CustodyRecordView> {
  if (!userId) {
    throw new KeyCustodyError('storeByokKey: userId is required');
  }
  if (!isByokProvider(provider)) {
    throw new KeyCustodyError(
      `storeByokKey: provider must be one of ${BYOK_PROVIDERS.join(', ')}`
    );
  }
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new KeyCustodyError('storeByokKey: apiKey must be a non-empty string');
  }
  if (!vaultAvailable()) {
    // Storing without a vault secret would mean persisting something we can
    // never open — reject loudly rather than write a dead envelope.
    throw new KeyCustodyError(
      'storeByokKey: key custody is unavailable (vault secret not configured)'
    );
  }

  // Seal FIRST — the plaintext never reaches the DB layer.
  const sealedKey = seal(apiKey);
  const purpose = byokPurpose(provider);

  const doc = await runSecondMeMutation<CustodyDoc>('secondMePersistence:upsertKeyCustody', {
    userId,
    purpose,
    sealedKey,
    provider,
  });
  return toView(doc);
}

/**
 * List a user's stored BYOK providers as non-secret views. Never opens any
 * envelope and never returns the sealed material. Returns [] when none.
 */
export async function listCustody(userId: string): Promise<CustodyRecordView[]> {
  if (!userId) return [];
  const docs = await runSecondMeQuery<CustodyDoc[]>('secondMePersistence:listKeyCustody', {
    userId,
  });
  return (docs ?? []).map(toView);
}

/**
 * Return the non-secret view of a user's stored key for a provider, or
 * `undefined` if none. Does NOT open the envelope — use `useByokKey` for that.
 */
export async function getByokCustody(
  userId: string,
  provider: ByokProviderName
): Promise<CustodyRecordView | undefined> {
  if (!userId) return undefined;
  const doc = await runSecondMeQuery<CustodyDoc | null>('secondMePersistence:getKeyCustody', {
    userId,
    purpose: byokPurpose(provider),
  });
  return doc ? toView(doc) : undefined;
}

/**
 * Delete a user's stored key for a provider. Idempotent — returns true iff a row
 * was removed. Lets the user revoke a stored key.
 */
export async function deleteByokKey(
  userId: string,
  provider: ByokProviderName
): Promise<boolean> {
  if (!userId) return false;
  const res = await runSecondMeMutation<{ deleted: boolean }>(
    'secondMePersistence:deleteKeyCustody',
    { userId, purpose: byokPurpose(provider) }
  );
  return res?.deleted === true;
}

/**
 * THE point-of-use accessor: recover a user's plaintext BYOK key for a provider,
 * or `undefined` if there is nothing usable. This is the ONLY function that
 * returns plaintext, and it does so only to its direct caller (which builds a
 * provider and discards it).
 *
 * Fails CLOSED to `undefined` — never throws — on: no row, vault unavailable, or
 * a failed open (tampered/rotated secret). A run then proceeds as if the user
 * supplied no key (deterministic-only), exactly like the per-request BYOK path.
 */
export async function useByokKey(
  userId: string,
  provider: ByokProviderName
): Promise<string | undefined> {
  if (!userId) return undefined;
  if (!vaultAvailable()) return undefined;

  const doc = await runSecondMeQuery<CustodyDoc | null>('secondMePersistence:getKeyCustody', {
    userId,
    purpose: byokPurpose(provider),
  });
  if (!doc) return undefined;

  try {
    return open(doc.sealedKey);
  } catch (err) {
    // Fail closed: a VaultError here means we cannot recover the key (wrong
    // secret or tampered row). Treat as "no key" — never propagate.
    if (err instanceof VaultError) return undefined;
    // Any other unexpected error also fails closed to preserve the invariant.
    return undefined;
  }
}
