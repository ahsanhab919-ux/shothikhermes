
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

const { mockFind, mockSelect, mockSort, mockLean } = vi.hoisted(() => {
  return {
    mockFind: vi.fn(),
    mockSelect: vi.fn(),
    mockSort: vi.fn(),
    mockLean: vi.fn(),
  };
});

// Mock Mongoose model
vi.mock('@/models/ResearchChat', () => {
  return {
    default: {
      find: mockFind,
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

const mockedGetAuthenticatedUser = getAuthenticatedUser as Mock;

describe('GET /api/research/chat/get_my_chats', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup generic mock chain
    mockLean.mockResolvedValue([{ _id: '1', name: 'Chat 1' }]);
    mockSort.mockReturnValue({ lean: mockLean });
    mockSelect.mockReturnValue({ sort: mockSort });

    // Default behavior for find: return object with select (and sort for backward compatibility if needed,
    // but the test will enforce select usage)
    mockFind.mockReturnValue({
        select: mockSelect,
        sort: mockSort // We include this so the UNOPTIMIZED code doesn't crash, allowing us to assert lack of select call
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockedGetAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/research/chat/get_my_chats'));

    expect(response.status).toBe(401);
  });

  it('should fetch chats with messages excluded for performance', async () => {
    const mockUser = { _id: 'user123' };
    mockedGetAuthenticatedUser.mockResolvedValue(mockUser);

    await GET(new Request('http://localhost/api/research/chat/get_my_chats'));

    expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });

    // THIS IS THE CRITICAL ASSERTION
    // It verifies that .select('-messages') was called
    expect(mockSelect).toHaveBeenCalledWith('-messages');

    // And ensure sort is called after select
    expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });

    // Verify lean is called
    expect(mockLean).toHaveBeenCalled();
  });
});
