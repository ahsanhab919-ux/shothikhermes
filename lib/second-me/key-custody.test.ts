import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

// Mock the Convex transport (the ported storage seam). The real crypto-vault is
// used (not mocked) so we exercise the true seal/open path end-to-end.
vi.mock('./convex-second-me-client', () => ({
  runSecondMeQuery: vi.fn(),
  runSecondMeMutation: vi.fn(),
}));

import { runSecondMeQuery, runSecondMeMutation } from './convex-second-me-client';
import {
  storeByokKey,
  getByokCustody,
  listCustody,
  deleteByokKey,
  useByokKey,
  byokPurpose,
  KeyCustodyError,
} from './key-custody';
import { seal } from './crypto-vault';

const query = runSecondMeQuery as unknown as Mock;
const mutation = runSecondMeMutation as unknown as Mock;

const GOOD_SECRET = 'test-vault-secret-abcdefghij';
const USER = 'user-123';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SECOND_ME_VAULT_SECRET = GOOD_SECRET;
});
afterEach(() => {
  delete process.env.SECOND_ME_VAULT_SECRET;
});

describe('byokPurpose', () => {
  it('namespaces the provider', () => {
    expect(byokPurpose('openai')).toBe('byok:openai');
    expect(byokPurpose('anthropic')).toBe('byok:anthropic');
  });
});

describe('storeByokKey (validation, before any DB/crypto)', () => {
  it('rejects a missing userId', async () => {
    await expect(storeByokKey('', 'openai', 'sk-x')).rejects.toThrow(KeyCustodyError);
    expect(mutation).not.toHaveBeenCalled();
  });

  it('rejects an unknown provider', async () => {
    await expect(storeByokKey(USER, 'cohere', 'sk-x')).rejects.toThrow(/must be one of/);
    expect(mutation).not.toHaveBeenCalled();
  });

  it('rejects an empty key', async () => {
    await expect(storeByokKey(USER, 'openai', '')).rejects.toThrow(KeyCustodyError);
    expect(mutation).not.toHaveBeenCalled();
  });

  it('rejects when the vault secret is not configured', async () => {
    delete process.env.SECOND_ME_VAULT_SECRET;
    await expect(storeByokKey(USER, 'openai', 'sk-x')).rejects.toThrow(/unavailable/);
    expect(mutation).not.toHaveBeenCalled();
  });
});

describe('storeByokKey (persist)', () => {
  it('seals the key and writes ONLY ciphertext, returning a non-secret view', async () => {
    mutation.mockImplementation(async (_path, args) => ({
      userId: USER,
      purpose: 'byok:openai',
      provider: 'openai',
      sealedKey: args.sealedKey,
    }));

    const apiKey = 'sk-live-super-secret-000';
    const view = await storeByokKey(USER, 'openai', apiKey);

    expect(view).toEqual({
      userId: USER,
      purpose: 'byok:openai',
      provider: 'openai',
      present: true,
    });

    // The written envelope must NOT be the plaintext, and must be a vault envelope.
    const [path, args] = mutation.mock.calls[0];
    expect(path).toBe('secondMePersistence:upsertKeyCustody');
    expect(args.sealedKey).not.toContain(apiKey);
    expect(args.sealedKey.startsWith('v1.')).toBe(true);
    // upsert keyed by (userId, purpose) — never a twinId.
    expect(args).toMatchObject({ userId: USER, purpose: 'byok:openai', provider: 'openai' });
    expect(args).not.toHaveProperty('twinId');
  });

  it('is idempotent via upsert (re-store overwrites)', async () => {
    mutation.mockImplementation(async (_path, args) => ({
      userId: USER,
      purpose: 'byok:anthropic',
      provider: 'anthropic',
      sealedKey: args.sealedKey,
    }));
    await storeByokKey(USER, 'anthropic', 'first');
    await storeByokKey(USER, 'anthropic', 'second');
    expect(mutation).toHaveBeenCalledTimes(2);
    expect(mutation.mock.calls[0][0]).toBe('secondMePersistence:upsertKeyCustody');
  });
});

describe('getByokCustody', () => {
  it('returns undefined when there is no row', async () => {
    query.mockResolvedValue(null);
    expect(await getByokCustody(USER, 'openai')).toBeUndefined();
  });

  it('returns a non-secret view WITHOUT opening the envelope', async () => {
    query.mockResolvedValue({
      userId: USER,
      purpose: 'byok:openai',
      provider: 'openai',
      sealedKey: seal('should-not-be-returned'),
    });
    const view = await getByokCustody(USER, 'openai');
    expect(view).toEqual({
      userId: USER,
      purpose: 'byok:openai',
      provider: 'openai',
      present: true,
    });
    // The view carries no plaintext and no sealedKey field.
    expect(JSON.stringify(view)).not.toContain('should-not-be-returned');
    expect((view as unknown as Record<string, unknown>).sealedKey).toBeUndefined();
  });
});

describe('listCustody', () => {
  it('returns [] for a missing userId without hitting the DB', async () => {
    expect(await listCustody('')).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it('maps rows to non-secret views and NEVER leaks the sealed envelope', async () => {
    query.mockResolvedValue([
      { userId: USER, purpose: 'byok:openai', provider: 'openai', sealedKey: seal('a') },
      { userId: USER, purpose: 'byok:anthropic', provider: 'anthropic', sealedKey: seal('b') },
    ]);
    const views = await listCustody(USER);
    expect(views).toHaveLength(2);
    expect(views.every((v) => v.present)).toBe(true);
    // No envelope (v1.*) and no sealedKey field ever leaves this function.
    expect(JSON.stringify(views)).not.toContain('v1.');
    expect(views.every((v) => (v as unknown as Record<string, unknown>).sealedKey === undefined)).toBe(true);
  });

  it('handles an undefined transport result', async () => {
    query.mockResolvedValue(undefined);
    expect(await listCustody(USER)).toEqual([]);
  });
});

describe('deleteByokKey', () => {
  it('returns true when a row was removed', async () => {
    mutation.mockResolvedValue({ deleted: true });
    expect(await deleteByokKey(USER, 'openai')).toBe(true);
    expect(mutation).toHaveBeenCalledWith('secondMePersistence:deleteKeyCustody', {
      userId: USER,
      purpose: 'byok:openai',
    });
  });
  it('returns false when nothing matched', async () => {
    mutation.mockResolvedValue({ deleted: false });
    expect(await deleteByokKey(USER, 'openai')).toBe(false);
  });
  it('returns false for a missing userId without hitting the DB', async () => {
    expect(await deleteByokKey('', 'openai')).toBe(false);
    expect(mutation).not.toHaveBeenCalled();
  });
});

describe('useByokKey (point-of-use, fails closed)', () => {
  it('recovers the plaintext key from a sealed row (seal→open round-trip)', async () => {
    const apiKey = 'sk-recover-me-777';
    query.mockResolvedValue({
      userId: USER,
      purpose: 'byok:openai',
      provider: 'openai',
      sealedKey: seal(apiKey),
    });
    expect(await useByokKey(USER, 'openai')).toBe(apiKey);
  });

  it('returns undefined when there is no row', async () => {
    query.mockResolvedValue(null);
    expect(await useByokKey(USER, 'openai')).toBeUndefined();
  });

  it('returns undefined (fails closed) when the vault secret is absent', async () => {
    delete process.env.SECOND_ME_VAULT_SECRET;
    expect(await useByokKey(USER, 'openai')).toBeUndefined();
    // Should short-circuit before querying.
    expect(query).not.toHaveBeenCalled();
  });

  it('returns undefined (fails closed) when the secret rotated / open fails', async () => {
    const sealedUnderOldSecret = seal('key-under-old-secret');
    query.mockResolvedValue({
      userId: USER,
      purpose: 'byok:openai',
      provider: 'openai',
      sealedKey: sealedUnderOldSecret,
    });
    // Rotate the secret so open() can no longer recover it.
    process.env.SECOND_ME_VAULT_SECRET = 'rotated-secret-different-value';
    expect(await useByokKey(USER, 'openai')).toBeUndefined();
  });

  it('returns undefined for a missing userId', async () => {
    expect(await useByokKey('', 'openai')).toBeUndefined();
  });
});
