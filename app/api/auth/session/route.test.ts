import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server-auth", () => ({
  getAuthenticatedUser: vi.fn(),
}));

import { getAuthenticatedUser } from "@/lib/server-auth";
import { GET } from "./route";

const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser);

describe("GET /api/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no authenticated user is available", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Authentication required");
  });

  it("returns the authenticated user when a session exists", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      _id: "user-1",
      id: "user-1",
      name: "Ahsan",
      email: "user@example.com",
      authProvider: "insforge",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user._id).toBe("user-1");
  });
});
