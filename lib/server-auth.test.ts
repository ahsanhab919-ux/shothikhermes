import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCookies,
  mockGetCurrentUser,
  mockLegacyGetUser,
} = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockLegacyGetUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@/lib/insforge/server", () => ({
  createInsforgeServerClient: vi.fn(async () => ({
    auth: {
      getCurrentUser: mockGetCurrentUser,
    },
  })),
}));

vi.mock("@/services/auth.service", () => ({
  default: class MockAuthService {
    getUser = mockLegacyGetUser;
  },
}));

import { getAuthenticatedUser, getChatAuthenticatedUser } from "@/lib/server-auth";

describe("getAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockCookies.mockResolvedValue({
      get: (name: string) => (name === "jwt_token" ? { value: "legacy-token" } : undefined),
    });
  });

  it("prefers the native InsForge session when present", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        user: {
          id: "if-user-1",
          email: "user@example.com",
          userMetadata: { name: "Native User" },
        },
      },
      error: null,
    });

    const user = await getAuthenticatedUser();

    expect(user).toMatchObject({
      _id: "if-user-1",
      authProvider: "insforge",
    });
    expect(mockLegacyGetUser).not.toHaveBeenCalled();
  });

  it("falls back to the legacy bridge when InsForge auth is absent", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockLegacyGetUser.mockResolvedValue({
      data: {
        data: {
          _id: "legacy-1",
          email: "legacy@example.com",
          name: "Legacy User",
        },
      },
    });

    const user = await getAuthenticatedUser();

    expect(user).toMatchObject({
      _id: "legacy-1",
      authProvider: "legacy",
    });
    expect(mockLegacyGetUser).toHaveBeenCalledWith("legacy-token");
  });

  it("returns null when no auth source resolves a user", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockLegacyGetUser.mockRejectedValue(new Error("unauthorized"));

    const user = await getAuthenticatedUser();

    expect(user).toBeNull();
  });
});

describe("getChatAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockCookies.mockResolvedValue({
      get: (name: string) => (name === "jwt_token" ? { value: "legacy-token" } : undefined),
    });
  });

  it("returns the native InsForge user when present", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        user: {
          id: "if-chat-1",
          email: "chat@example.com",
        },
      },
      error: null,
    });

    const user = await getChatAuthenticatedUser();

    expect(user).toMatchObject({
      _id: "if-chat-1",
      authProvider: "insforge",
    });
  });

  it("does not fall back to the legacy bridge for chat", async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockLegacyGetUser.mockResolvedValue({
      data: {
        data: {
          _id: "legacy-chat-1",
          email: "legacy@example.com",
          name: "Legacy User",
        },
      },
    });

    const user = await getChatAuthenticatedUser();

    expect(user).toBeNull();
    expect(mockLegacyGetUser).not.toHaveBeenCalled();
  });
});
