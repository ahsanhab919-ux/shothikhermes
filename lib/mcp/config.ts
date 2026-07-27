const DEFAULT_STITCH_BASE_URL = 'https://api-demo.stitch-ai.co';
const DEFAULT_STITCH_TIMEOUT_MS = 10000;
const DEFAULT_PUBLIC_MCP_SERVER_URL = 'http://localhost:3001';

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function normalizeUrl(rawUrl: string, fallback: string, label: string): string {
  const candidate = rawUrl.trim() || fallback;
  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }

  if (!isLocalHostname(parsed.hostname) && parsed.protocol !== 'https:') {
    throw new Error(`${label} must use https unless it targets localhost`);
  }

  return parsed.toString().replace(/\/$/, '');
}

function parseTimeout(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function buildMcpHeaders(apiKey?: string): Record<string, string> {
  if (!apiKey?.trim()) {
    return {};
  }

  const trimmed = apiKey.trim();
  return {
    Authorization: `Bearer ${trimmed}`,
    'x-api-key': trimmed,
  };
}

export function resolveStitchConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    baseUrl: normalizeUrl(
      env.NEXT_PUBLIC_STITCH_BASE_URL ?? DEFAULT_STITCH_BASE_URL,
      DEFAULT_STITCH_BASE_URL,
      'NEXT_PUBLIC_STITCH_BASE_URL',
    ),
    apiKey: env.NEXT_PUBLIC_STITCH_API_KEY?.trim() || '',
    timeoutMs: parseTimeout(env.NEXT_PUBLIC_STITCH_TIMEOUT_MS, DEFAULT_STITCH_TIMEOUT_MS),
  };
}

export function resolvePublicMcpServerUrl(env: NodeJS.ProcessEnv = process.env): string {
  return normalizeUrl(
    env.NEXT_PUBLIC_MCP_SERVER_URL ?? DEFAULT_PUBLIC_MCP_SERVER_URL,
    DEFAULT_PUBLIC_MCP_SERVER_URL,
    'NEXT_PUBLIC_MCP_SERVER_URL',
  );
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_STITCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function safeJsonParse<T>(rawValue: string | null, fallback: T): T {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}
