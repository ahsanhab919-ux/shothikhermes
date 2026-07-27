const REQUIRED_SERVER_VARS = [
  'PUBLISHDRIVE_WEBHOOK_SECRET',
  'ADMIN_USER_IDS',
] as const;

const REQUIRED_SERVICE_VARS = [
  'PARAPHRASE_SERVICE_URL',
  'NLP_SERVICE_URL',
  'AI_DETECTOR_URL',
  'RESEARCH_SERVICE_URL',
  'COGNEE_API_URL',
  'COGNEE_API_KEY',
] as const;

export function assertCriticalEnv(): void {
  const missing = REQUIRED_SERVER_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `[env-guard] Missing required environment variables: ${missing.join(', ')}. ` +
        'Server cannot start safely.'
    );
  }
}

export function warnMissingServiceEnv(): string[] {
  const missing = REQUIRED_SERVICE_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `[env-guard] Service env vars not set (will fall back to localhost): ${missing.join(', ')}`
    );
  }
  return missing;
}

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`[env-guard] Required environment variable "${key}" is not set.`);
  }
  return val;
}
