"use client";

import { useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useSyncLocaleToConvex() {
  const updateLocale = useMutation(api.users.updateUserLocale);
  const lastSyncedRef = useRef<string | null>(null);

  return useCallback(
    (userId: string, locale: string) => {
      if (lastSyncedRef.current === `${userId}:${locale}`) {
        return;
      }
      lastSyncedRef.current = `${userId}:${locale}`;
      updateLocale({ userId, locale }).catch((err: unknown) => {
        lastSyncedRef.current = null;
        if (process.env.NODE_ENV === "development") {
          console.warn("[i18n] Failed to sync locale to Convex:", err);
        }
      });
    },
    [updateLocale]
  );
}
