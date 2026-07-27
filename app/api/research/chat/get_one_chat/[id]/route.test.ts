
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { GET } from './route';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/lib/dbConnect', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/server-auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

const { mockFindById, mockFindOne } = vi.hoisted(() => {
  return {
    mockFindById: vi.fn(),
    mockFindOne: vi.fn(),
  };
});

// Mock Mongoose model
vi.mock('@/models/ResearchChat', () => {
  return {
    default: {
      findById: mockFindById,
      findOne: mockFindOne,
    },
  };
});

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ data, options, status: options?.status || 200 })),
  },
}));

import { getAuthenticatedUser } from '@/lib/server-auth';
import ResearchChat from '@/models/ResearchChat';

const mockedGetAuthenticatedUser = getAuthenticatedUser as Mock;

describe('GET /api/research/chat/get_one_chat/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    // This test expects the NEW behavior (secure)
    // Currently, the code does NOT check auth, so this test would fail if the code isn't updated.
    // However, for reproduction, we want to show that unauthenticated users CAN access the chat (status 200).
    // BUT, the plan says "Create a reproduction test case... Assert that the response status is 404 or 403 (this test is expected to fail initially)".

    mockedGetAuthenticatedUser.mockResolvedValue(null);
    mockFindById.mockResolvedValue({ _id: 'chat1', userId: 'user1', name: 'Chat 1' });

    const response = await GET(
        new Request('http://localhost/api/research/chat/get_one_chat/chat1'),
        { params: Promise.resolve({ id: 'chat1' }) }
    );

    // Current behavior: 200 (returns chat)
    // Desired behavior: 401 (Unauthorized)
    expect(response.status).toBe(401);
  });

  it('should return 404 if chat belongs to another user', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue({ _id: 'user2' });

    // The db returns a chat belonging to user1
    // In the insecure implementation, findById returns it regardless of user.
    mockFindById.mockResolvedValue({ _id: 'chat1', userId: 'user1', name: 'Chat 1' });

    // In the secure implementation, findOne({ _id: id, userId: user._id }) will be called.
    // We need to mock findOne behavior if the code changes to use findOne.
    // But initially, it uses findById.

    // If the code is fixed to use findOne, findById won't be called.
    // So for the reproduction to fail (and pass later), we should mock findOne too?
    // No, if the code calls findById, it returns the chat. Status 200.
    // If the code calls findOne, we should make findOne return null (simulation of not found for that user).

    mockFindOne.mockResolvedValue(null);

    const response = await GET(
        new Request('http://localhost/api/research/chat/get_one_chat/chat1'),
        { params: Promise.resolve({ id: 'chat1' }) }
    );

    // Current behavior: 200 (returns chat found by findById)
    // Desired behavior: 404 (Not Found via findOne)
    expect(response.status).toBe(404);
  });
});
