"use client";

import { useSelector } from "react-redux";
import { useLoadConvexLocale } from "./useLoadConvexLocale";

export function LocaleSync() {
  const user = useSelector((state: any) => state.auth?.user);
  useLoadConvexLocale(user?._id ?? null);
  return null;
}
