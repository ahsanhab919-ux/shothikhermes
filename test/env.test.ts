import { describe, it, expect, beforeEach } from 'vitest';
import { validateServerEnv } from '@/lib/config/env';

describe('Environment Validation', () => {
  beforeEach(() => {
    process.env.CONVEX_DEPLOYMENT = 'test-deployment';
    process.env.CLERK_SECRET_KEY = 'sk_test_valid';
    process.env.KIMI_API_KEY = 'valid-kimi-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_valid';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_valid';
  });

  it('should validate required environment variables', () => {
    expect(() => validateServerEnv()).not.toThrow();
  });
  
  it('should throw if required vars are missing', () => {
    delete process.env.CONVEX_DEPLOYMENT;
    
    expect(() => validateServerEnv()).toThrow();
  });
  
  it('should throw if no LLM provider is configured', () => {
    delete process.env.KIMI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    
    expect(() => validateServerEnv()).toThrow('At least one LLM provider');
  });
});
