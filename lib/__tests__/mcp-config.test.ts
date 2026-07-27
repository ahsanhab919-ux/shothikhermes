import { describe, expect, it } from 'vitest';

import {
  buildMcpHeaders,
  resolvePublicMcpServerUrl,
  resolveStitchConfig,
  safeJsonParse,
} from '../mcp/config';

describe('mcp config helpers', () => {
  it('allows localhost MCP urls', () => {
    const url = resolvePublicMcpServerUrl({
      NEXT_PUBLIC_MCP_SERVER_URL: 'http://localhost:3001',
    } as unknown as NodeJS.ProcessEnv);

    expect(url).toBe('http://localhost:3001');
  });

  it('rejects insecure remote MCP urls', () => {
    expect(() =>
      resolvePublicMcpServerUrl({
        NEXT_PUBLIC_MCP_SERVER_URL: 'http://remote.example.com',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/must use https/i);
  });

  it('builds auth headers only when an api key exists', () => {
    expect(buildMcpHeaders('')).toEqual({});
    expect(buildMcpHeaders('secret-token')).toEqual({
      Authorization: 'Bearer secret-token',
      'x-api-key': 'secret-token',
    });
  });

  it('resolves stitch config with defaults', () => {
    const config = resolveStitchConfig({} as NodeJS.ProcessEnv);

    expect(config.baseUrl).toBe('https://api-demo.stitch-ai.co');
    expect(config.timeoutMs).toBe(10000);
  });

  it('parses json safely with fallback', () => {
    expect(safeJsonParse('{"ok":true}', { ok: false })).toEqual({ ok: true });
    expect(safeJsonParse('{bad', { ok: false })).toEqual({ ok: false });
  });
});
