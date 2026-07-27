import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";
import { getInsforgePublicConfig } from "@/lib/insforge/config";

export async function createInsforgeServerClient() {
  return createServerClient({
    cookies: await cookies(),
    ...getInsforgePublicConfig(),
  });
}
