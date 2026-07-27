import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { seal, open, vaultAvailable, VaultError } from './crypto-vault';

// crypto-vault is pure over node:crypto + one env var — no mocks needed. We just
// control SECOND_ME_VAULT_SECRET around each test.
const GOOD_SECRET = 'test-vault-secret-abcdefghij';

describe('crypto-vault', () => {
    const original = process.env.SECOND_ME_VAULT_SECRET;

    beforeEach(() => {
        process.env.SECOND_ME_VAULT_SECRET = GOOD_SECRET;
    });
    afterEach(() => {
        if (original === undefined) delete process.env.SECOND_ME_VAULT_SECRET;
        else process.env.SECOND_ME_VAULT_SECRET = original;
    });

    describe('vaultAvailable', () => {
        it('is true with a long-enough secret', () => {
            expect(vaultAvailable()).toBe(true);
        });
        it('is false when the secret is absent', () => {
            delete process.env.SECOND_ME_VAULT_SECRET;
            expect(vaultAvailable()).toBe(false);
        });
        it('is false when the secret is too short', () => {
            process.env.SECOND_ME_VAULT_SECRET = 'short';
            expect(vaultAvailable()).toBe(false);
        });
    });

    describe('seal / open roundtrip', () => {
        it('recovers the exact plaintext', () => {
            const pt = 'sk-live-1234567890-secretkey';
            expect(open(seal(pt))).toBe(pt);
        });

        it('roundtrips unicode and empty-ish content', () => {
            const pt = 'café — 秘密鍵 🔑';
            expect(open(seal(pt))).toBe(pt);
            expect(open(seal(''))).toBe('');
        });

        it('produces the versioned 4-part envelope shape', () => {
            const env = seal('abc');
            const parts = env.split('.');
            expect(parts).toHaveLength(4);
            expect(parts[0]).toBe('v1');
        });

        it('is non-deterministic: same plaintext seals to different envelopes', () => {
            const a = seal('same-input');
            const b = seal('same-input');
            expect(a).not.toBe(b); // fresh IV each time
            expect(open(a)).toBe('same-input');
            expect(open(b)).toBe('same-input');
        });
    });

    describe('fail closed', () => {
        it('seal throws VaultError when the secret is missing', () => {
            delete process.env.SECOND_ME_VAULT_SECRET;
            expect(() => seal('x')).toThrow(VaultError);
        });

        it('seal throws VaultError when the secret is too short', () => {
            process.env.SECOND_ME_VAULT_SECRET = 'tooshort';
            expect(() => seal('x')).toThrow(/at least/);
        });

        it('open throws on a wrong key (different secret)', () => {
            const env = seal('secret-payload');
            process.env.SECOND_ME_VAULT_SECRET = 'a-completely-different-secret!!';
            expect(() => open(env)).toThrow(VaultError);
        });

        it('open detects tampering with the ciphertext', () => {
            const env = seal('secret-payload');
            const parts = env.split('.');
            // Flip the ciphertext to a different valid-base64 value.
            const tamperedCt = Buffer.from('tampered-bytes-here').toString('base64');
            const tampered = [parts[0], parts[1], parts[2], tamperedCt].join('.');
            expect(() => open(tampered)).toThrow(/decryption failed/);
        });

        it('open detects tampering with the auth tag', () => {
            const env = seal('secret-payload');
            const parts = env.split('.');
            const badTag = Buffer.alloc(16, 0).toString('base64');
            const tampered = [parts[0], parts[1], badTag, parts[3]].join('.');
            expect(() => open(tampered)).toThrow(/decryption failed/);
        });

        it('open rejects a malformed envelope (wrong part count)', () => {
            expect(() => open('v1.only.three')).toThrow(/malformed/);
        });

        it('open rejects an unsupported version', () => {
            const env = seal('x');
            const parts = env.split('.');
            const bad = ['v2', parts[1], parts[2], parts[3]].join('.');
            expect(() => open(bad)).toThrow(/unsupported envelope version/);
        });

        it('open rejects a bad iv/tag length', () => {
            const env = seal('x');
            const parts = env.split('.');
            const shortIv = Buffer.alloc(4, 1).toString('base64');
            const bad = [parts[0], shortIv, parts[2], parts[3]].join('.');
            expect(() => open(bad)).toThrow(/bad iv\/tag length/);
        });

        it('open rejects an empty envelope', () => {
            expect(() => open('')).toThrow(VaultError);
        });
    });

    describe('never leaks plaintext in errors', () => {
        it('the wrong-key error message does not contain the plaintext', () => {
            const secretPlaintext = 'TOP-SECRET-VALUE-9999';
            const env = seal(secretPlaintext);
            process.env.SECOND_ME_VAULT_SECRET = 'another-different-secret-xyz';
            try {
                open(env);
                throw new Error('expected open to throw');
            } catch (e) {
                expect(String((e as Error).message)).not.toContain(secretPlaintext);
            }
        });
    });
});
