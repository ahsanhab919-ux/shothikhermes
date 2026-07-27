import { z } from 'zod';

/**
 * Validates environment variables at build/startup time
 * Throws error if required vars are missing
 */

const serverEnvSchema = z.object({
  // Database
  CONVEX_DEPLOYMENT: z.string().min(1, 'Convex deployment name required'),
  
  // Auth
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key required'),
  
  // LLM APIs (at least one required)
  KIMI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Payments
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret required'),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Server-side environment validation
 */
export function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Server environment validation failed:\n${errors}`);
  }
  
  // Ensure at least one LLM provider
  if (!process.env.KIMI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('At least one LLM provider must be configured (KIMI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)');
  }
  
  return result.data;
}

/**
 * Client-side environment validation
 */
export function validateClientEnv() {
  const result = clientEnvSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Client environment validation failed:\n${errors}`);
  }
  
  return result.data;
}
