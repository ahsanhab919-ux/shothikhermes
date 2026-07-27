import { describe, it, expect } from 'vitest';
import {
  paraphraseRequestSchema,
  grammarCheckSchema,
  humanizeRequestSchema,
  humanizerV5Schema,
  aiDetectionSchema,
  summarizeSchema,
  loginSchema,
  registerSchema,
  exportRequestSchema,
  validateInput,
  sanitizeHtml,
  sanitizeText,
} from '../validation';

describe('validation schemas', () => {
  describe('paraphraseRequestSchema', () => {
    it('validates valid input', () => {
      const result = paraphraseRequestSchema.safeParse({ text: 'Hello world' });
      expect(result.success).toBe(true);
    });

    it('rejects empty text', () => {
      const result = paraphraseRequestSchema.safeParse({ text: '' });
      expect(result.success).toBe(false);
    });

    it('applies defaults', () => {
      const result = paraphraseRequestSchema.parse({ text: 'Hello world!!!' });
      expect(result.mode).toBe('standard');
      expect(result.strength).toBe('medium');
      expect(result.language).toBe('en');
    });
  });

  describe('grammarCheckSchema', () => {
    it('validates valid input', () => {
      const result = grammarCheckSchema.safeParse({ text: 'Check this.' });
      expect(result.success).toBe(true);
    });

    it('rejects text over 10000 chars', () => {
      const result = grammarCheckSchema.safeParse({ text: 'x'.repeat(10001) });
      expect(result.success).toBe(false);
    });
  });

  describe('humanizeRequestSchema', () => {
    it('validates with valid mode and intensity', () => {
      const result = humanizeRequestSchema.safeParse({
        text: 'Test',
        mode: 'natural',
        intensity: 'light',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid mode', () => {
      const result = humanizeRequestSchema.safeParse({
        text: 'Test',
        mode: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('aiDetectionSchema', () => {
    it('validates valid input with defaults', () => {
      const result = aiDetectionSchema.parse({ text: 'Some text' });
      expect(result.detailed).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('validates valid credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates valid registration', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('exportRequestSchema', () => {
    it('validates valid export config', () => {
      const result = exportRequestSchema.safeParse({
        format: 'pdf',
        options: { includeTableOfContents: true },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid format', () => {
      const result = exportRequestSchema.safeParse({ format: 'exe' });
      expect(result.success).toBe(false);
    });
  });
});

describe('validateInput', () => {
  it('returns success for valid data', () => {
    const result = validateInput(loginSchema, {
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('returns errors for invalid data', () => {
    const result = validateInput(loginSchema, {
      email: 'invalid',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('');
  });

  it('removes event handlers', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">text</div>');
    expect(result).not.toContain('onclick');
  });

  it('removes javascript: protocol', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">link</a>');
    expect(result).not.toContain('javascript:');
  });

  it('preserves normal HTML', () => {
    expect(sanitizeHtml('<p>Hello</p>')).toBe('<p>Hello</p>');
  });
});

describe('sanitizeText', () => {
  it('removes null bytes', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld');
  });

  it('removes control characters', () => {
    expect(sanitizeText('hello\x01\x02world')).toBe('helloworld');
  });

  it('preserves normal text', () => {
    expect(sanitizeText('Hello World!')).toBe('Hello World!');
  });

  it('preserves newlines and tabs', () => {
    expect(sanitizeText('line1\nline2\ttab')).toBe('line1\nline2\ttab');
  });
});
