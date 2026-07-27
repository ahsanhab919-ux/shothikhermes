import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { getInsforgePublicConfig } from "@/lib/insforge/config";

export const { POST } = createRefreshAuthRouter(getInsforgePublicConfig());
