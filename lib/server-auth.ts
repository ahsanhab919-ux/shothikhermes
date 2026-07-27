import { cookies } from 'next/headers';
import AuthService from '@/services/auth.service';
import { createInsforgeServerClient } from "@/lib/insforge/server";
import {
  type AuthenticatedUser,
  normalizeInsforgeUser,
  normalizeLegacyUser,
} from "@/lib/insforge/user";

export type User = AuthenticatedUser;

export async function getAuthenticatedUser(): Promise<User | null> {
  const insforgeUser = await getInsforgeAuthenticatedUser();
  if (insforgeUser) {
    return insforgeUser;
  }

  return getLegacyAuthenticatedUser();
}

export async function getChatAuthenticatedUser(): Promise<User | null> {
  return getInsforgeAuthenticatedUser();
}

async function getInsforgeAuthenticatedUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const hasInsforgeAccessToken = Boolean(cookieStore.get("insforge_access_token")?.value);
    const hasInsforgeRefreshToken = Boolean(cookieStore.get("insforge_refresh_token")?.value);

    // #region debug-point B:server-auth-cookie-state
    void fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "chat-auth-session",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "lib/server-auth.ts:getInsforgeAuthenticatedUser:cookie-state",
        msg: "[DEBUG] Server auth inspected Insforge cookies",
        data: {
          hasInsforgeAccessToken,
          hasInsforgeRefreshToken,
        },
        ts: Date.now(),
      }),
    }).catch(() => undefined);
    // #endregion

    const insforge = await createInsforgeServerClient();
    const { data, error } = await insforge.auth.getCurrentUser();

    // #region debug-point B:server-auth-current-user
    void fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "chat-auth-session",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "lib/server-auth.ts:getInsforgeAuthenticatedUser:current-user",
        msg: "[DEBUG] Server auth resolved Insforge current user",
        data: {
          hasError: Boolean(error),
          errorMessage: error?.message ?? null,
          hasUser: Boolean(data?.user),
        },
        ts: Date.now(),
      }),
    }).catch(() => undefined);
    // #endregion

    if (error || !data?.user) {
      return null;
    }

    return normalizeInsforgeUser(data.user);
  } catch (error) {
    return null;
  }
}

async function getLegacyAuthenticatedUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const authService = new AuthService();
    const response = await authService.getUser(token);

    if (response.data && response.data.data) {
      return normalizeLegacyUser(response.data.data);
    }
    return null;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
