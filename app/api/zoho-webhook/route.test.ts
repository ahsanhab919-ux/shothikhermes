import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import axios from 'axios';
import { POST } from './route';

vi.mock('axios');

const mockedPost = axios.post as Mock;

describe('Zoho Webhook API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.ZOHO_WEBHOOK_SECRET = 'test-secret';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 401 if secret header is missing', async () => {
    const request = new Request('http://localhost/api/zoho-webhook', {
      method: 'POST',
      body: JSON.stringify({ event: { some: 'data' } }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 500 if ZOHO_WEBHOOK_URL is not defined', async () => {
    delete process.env.ZOHO_WEBHOOK_URL;

    const request = new Request('http://localhost/api/zoho-webhook', {
      method: 'POST',
      headers: { 'x-zoho-secret': 'test-secret' },
      body: JSON.stringify({ event: { some: 'data' } }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it('should post to ZOHO_WEBHOOK_URL and return 200 on success', async () => {
    const mockUrl = 'https://mock-zoho.com/webhook';
    process.env.ZOHO_WEBHOOK_URL = mockUrl;

    mockedPost.mockResolvedValue({ data: { success: true } });

    const request = new Request('http://localhost/api/zoho-webhook', {
      method: 'POST',
      headers: { 'x-zoho-secret': 'test-secret' },
      body: JSON.stringify({ event: { some: 'data' } }),
    });

    const response = await POST(request);

    expect(axios.post).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({ event: { some: 'data' } }),
    );
    expect(response.status).toBe(200);
  });
});
