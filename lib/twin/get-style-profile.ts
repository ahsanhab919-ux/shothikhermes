import { twinApi, createTwinClient } from "@/lib/twin-convex";
import type { StyleProfile } from "./style-extractor";

export async function getStyleProfile(
  convex: ReturnType<typeof createTwinClient>,
  userId: string
): Promise<StyleProfile | null> {
  try {
    const knowledge = await convex.query(twinApi.twin.getKnowledgeByUser, { userId });
    const styleEntries = (knowledge as Array<Record<string, unknown>>)
      .filter((k) => k.summary === "__style_profile__")
      .sort((a, b) => (Number(b.addedAt) || 0) - (Number(a.addedAt) || 0));
    if (styleEntries.length > 0 && styleEntries[0].content) {
      return JSON.parse(styleEntries[0].content as string) as StyleProfile;
    }
  } catch {}
  return null;
}
