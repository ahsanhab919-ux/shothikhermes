"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function useAuthFromRedux() {
  const accessToken = useSelector((state) => state.auth?.accessToken);
  const user = useSelector((state) => state.auth?.user);
  const [convexToken, setConvexToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastTokenRef = useRef(null);
  const lastUserIdRef = useRef(null);

  const isAuthenticated = !!accessToken && !!user?._id;

  useEffect(() => {
    if (!accessToken || !user?._id) {
      setConvexToken(null);
      lastTokenRef.current = null;
      lastUserIdRef.current = null;
      return;
    }

    const tokenKey = `${accessToken}:${user._id}`;
    if (tokenKey === lastTokenRef.current) return;

    let cancelled = false;
    setIsLoading(true);

    async function exchangeToken() {
      try {
        const res = await fetch("/api/auth/convex-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, user }),
        });

        if (!res.ok) {
          console.error("Convex token exchange failed:", res.status);
          if (!cancelled) {
            setConvexToken(null);
            setIsLoading(false);
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setConvexToken(data.token);
          lastTokenRef.current = tokenKey;
          lastUserIdRef.current = user._id;
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Convex token exchange error:", err);
        if (!cancelled) {
          setConvexToken(null);
          setIsLoading(false);
        }
      }
    }

    exchangeToken();
    return () => { cancelled = true; };
  }, [accessToken, user?._id]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      if (forceRefreshToken) {
        lastTokenRef.current = null;
      }
      if (!convexToken) return null;
      return convexToken;
    },
    [convexToken]
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: isAuthenticated && !!convexToken,
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, convexToken, fetchAccessToken]
  );
}

export default function ConvexClientProvider({ children }) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromRedux}>
      {children}
    </ConvexProviderWithAuth>
  );
}
