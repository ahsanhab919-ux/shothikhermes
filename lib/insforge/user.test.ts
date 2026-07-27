import { describe, expect, it } from "vitest";
import {
  normalizeInsforgeUser,
  normalizeLegacyUser,
} from "@/lib/insforge/user";

describe("normalizeInsforgeUser", () => {
  it("maps a native InsForge user into the shared auth shape", () => {
    expect(
      normalizeInsforgeUser({
        id: "if-user-1",
        email: "user@example.com",
        userMetadata: {
          full_name: "Ahsan Habib",
          role: "student",
          account_type: "pro",
        },
      }),
    ).toEqual({
      _id: "if-user-1",
      id: "if-user-1",
      email: "user@example.com",
      name: "Ahsan Habib",
      role: "student",
      accountType: "pro",
      authProvider: "insforge",
    });
  });

  it("falls back to the email prefix when no display name exists", () => {
    expect(
      normalizeInsforgeUser({
        id: "if-user-2",
        email: "writer@example.com",
      }),
    )?.toMatchObject({
      name: "writer",
      authProvider: "insforge",
    });
  });
});

describe("normalizeLegacyUser", () => {
  it("normalizes the legacy bridge user shape", () => {
    expect(
      normalizeLegacyUser({
        _id: "legacy-1",
        email: "legacy@example.com",
        name: "Legacy User",
        role: "student",
        accountType: "free",
      }),
    ).toEqual({
      _id: "legacy-1",
      id: "legacy-1",
      email: "legacy@example.com",
      name: "Legacy User",
      role: "student",
      accountType: "free",
      authProvider: "legacy",
    });
  });

  it("returns null when the legacy payload is incomplete", () => {
    expect(normalizeLegacyUser({ id: "missing-email" })).toBeNull();
  });
});
