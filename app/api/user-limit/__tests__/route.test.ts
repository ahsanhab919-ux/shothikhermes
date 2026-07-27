import { describe, it, expect } from 'vitest';
import { GET } from '../../user-limit/route';
import { NextRequest } from 'next/server';

describe('GET /api/user-limit', () => {
  it('returns unlimited word limit', async () => {
    const req = new NextRequest('http://localhost/api/user-limit');
    const response = await GET(req, {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.unlimited).toBe(true);
    expect(data.totalWordLimit).toBeNull();
    expect(data.remainingWord).toBeNull();
  });
});
