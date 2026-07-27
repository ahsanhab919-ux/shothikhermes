"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AuthService from "@/services/auth.service";
import { getInsforgeBrowserClient } from "@/lib/insforge/client";
import {
  type AuthenticatedUser,
  normalizeInsforgeUser,
  normalizeLegacyUser,
} from "@/lib/insforge/user";

interface AuthContextProps {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    country: string,
  ) => Promise<{ requiresEmailVerification: boolean }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const authService = new AuthService();
const AUTH_PROBE_TIMEOUT_MS = 5000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateAuth() {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      let resolved = false;

      // #region debug-point A:hydrate-start
      fetch("http://127.0.0.1:7777/event", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "chat-auth-session",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "providers/AuthProvider.tsx:hydrateAuth:start",
          msg: "[DEBUG] Auth hydration started",
          data: {
            hasLegacyToken: Boolean(localStorage.getItem("jwt_token")),
            path: window.location.pathname,
          },
          ts: Date.now(),
        }),
      }).catch(() => undefined);
      // #endregion

      try {
        const sessionResponse = await withTimeout(
          fetch("/api/auth/session", {
            credentials: "same-origin",
            cache: "no-store",
          }).catch(() => null),
          AUTH_PROBE_TIMEOUT_MS,
        );

        if (sessionResponse?.ok) {
          const sessionPayload = await sessionResponse.json().catch(() => null);
          const sessionUser = normalizeInsforgeUser(
            sessionPayload?.user ?? null,
          ) ?? normalizeLegacyUser(sessionPayload?.user ?? null);

          if (!cancelled && sessionUser?._id) {
            localStorage.removeItem("jwt_token");
            setUser(sessionUser);
            setIsAuthenticated(true);
            setIsLoading(false);
            resolved = true;
            return;
          }
        }

        const insforge = getInsforgeBrowserClient();
        const resolveInsforgeUser = async () => {
          const current = await withTimeout(
            insforge.auth.getCurrentUser(),
            AUTH_PROBE_TIMEOUT_MS,
          );
          let resolvedUser = !current.error
            ? normalizeInsforgeUser(current.data?.user ?? null)
            : null;

          if (resolvedUser?._id) {
            return {
              user: resolvedUser,
              error: current.error,
              refreshed: false,
            };
          }

          const refreshResponse = await withTimeout(
            fetch("/api/auth/refresh", {
              method: "POST",
              cache: "no-store",
            }).catch(() => null),
            AUTH_PROBE_TIMEOUT_MS,
          );

          if (!refreshResponse?.ok) {
            return {
              user: null,
              error: current.error,
              refreshed: false,
            };
          }

          const refreshed = await withTimeout(
            insforge.auth.getCurrentUser(),
            AUTH_PROBE_TIMEOUT_MS,
          );
          resolvedUser = !refreshed.error
            ? normalizeInsforgeUser(refreshed.data?.user ?? null)
            : null;

          return {
            user: resolvedUser,
            error: refreshed.error ?? current.error,
            refreshed: true,
          };
        };

        const { user: insforgeUser, error, refreshed } = await resolveInsforgeUser();

        // #region debug-point A:insforge-current-user
        fetch("http://127.0.0.1:7777/event", {
          method: "POST",
          body: JSON.stringify({
            sessionId: "chat-auth-session",
            runId: "pre-fix",
            hypothesisId: "A",
            location: "providers/AuthProvider.tsx:hydrateAuth:insforge",
            msg: "[DEBUG] Insforge current user resolved in browser",
            data: {
              hasError: Boolean(error),
              errorMessage: error?.message ?? null,
              hasUser: Boolean(insforgeUser?._id),
              refreshed,
            },
            ts: Date.now(),
          }),
        }).catch(() => undefined);
        // #endregion

        if (!cancelled && insforgeUser) {
          localStorage.removeItem("jwt_token");
          setUser(insforgeUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          resolved = true;
          return;
        }
      } catch (error) {
        // Fall back to the legacy bridge while the rest of auth is still migrating.
      } finally {
        if (resolved) {
          return;
        }

        const token = localStorage.getItem("jwt_token");
        if (!token) {
          if (!cancelled) {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }

          // #region debug-point A:no-session-found
          fetch("http://127.0.0.1:7777/event", {
            method: "POST",
            body: JSON.stringify({
              sessionId: "chat-auth-session",
              runId: "pre-fix",
              hypothesisId: "A",
              location: "providers/AuthProvider.tsx:hydrateAuth:no-session",
              msg: "[DEBUG] Auth hydration found no usable browser session",
              data: {
                path: window.location.pathname,
              },
              ts: Date.now(),
            }),
          }).catch(() => undefined);
          // #endregion
          return;
        }

        try {
          const userData = await withTimeout(
            authService.validateToken(token),
            AUTH_PROBE_TIMEOUT_MS,
          );
          const legacyUser = normalizeLegacyUser(userData);

          if (!cancelled && legacyUser) {
            setUser(legacyUser);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }

          throw new Error("Invalid token");
        } catch (error) {
          localStorage.removeItem("jwt_token");
          if (!cancelled) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }

          // #region debug-point A:legacy-fallback-complete
          fetch("http://127.0.0.1:7777/event", {
            method: "POST",
            body: JSON.stringify({
              sessionId: "chat-auth-session",
              runId: "pre-fix",
              hypothesisId: "A",
              location: "providers/AuthProvider.tsx:hydrateAuth:legacy-complete",
              msg: "[DEBUG] Auth hydration completed legacy fallback path",
              data: {
                path: window.location.pathname,
              },
              ts: Date.now(),
            }),
          }).catch(() => undefined);
          // #endregion
        }
      }
    }

    void hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.user) {
        throw new Error(payload?.message || "Unable to sign in.");
      }

      localStorage.removeItem("jwt_token");
      setUser(payload.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = (): void => {
    void fetch("/api/auth/sign-out", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem("jwt_token");
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    country: string,
  ): Promise<{ requiresEmailVerification: boolean }> => {
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          country,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to create account.");
      }

      return {
        requiresEmailVerification: Boolean(payload?.requiresEmailVerification),
      };
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
