"use client";

import { createBrowserClient } from "@insforge/sdk/ssr";
import { getInsforgePublicConfig } from "@/lib/insforge/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getInsforgeBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(getInsforgePublicConfig());
  }

  return browserClient;
}
