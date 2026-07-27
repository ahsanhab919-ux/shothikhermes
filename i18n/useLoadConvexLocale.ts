"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslation } from "./index";
import type { Locale } from "./index";

function isValidLocale(value: unknown): value is Locale {
  return value === "en" || value === "bn";
}

export function useLoadConvexLocale(userId: string | null | undefined) {
  const { setLocale } = useTranslation();
  const hasLoadedRef = useRef(false);

  const prefs = useQuery(
    api.users.getUserPreferences,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (hasLoadedRef.current || !prefs) return;
    if (isValidLocale(prefs.locale)) {
      hasLoadedRef.current = true;
      setLocale(prefs.locale);
    }
  }, [prefs, setLocale]);
}
