export type WritingStudioSeedIntent = "book" | "research" | "assignment";

export interface WritingStudioSeed {
  source: "twin" | "tool";
  title?: string;
  description?: string;
  intent: WritingStudioSeedIntent;
  createdAt: number;
}

export interface WritingStudioSeedInput {
  source: "twin" | "tool";
  title?: string;
  description?: string;
  intent: WritingStudioSeedIntent;
}

const WRITING_STUDIO_SEED_KEY = "shothik_writing_studio_seed";

export function saveWritingStudioSeed(seed: WritingStudioSeedInput) {
  if (typeof window === "undefined") return;
  const payload: WritingStudioSeed = {
    ...seed,
    createdAt: Date.now(),
  };
  window.sessionStorage.setItem(WRITING_STUDIO_SEED_KEY, JSON.stringify(payload));
}

export function getWritingStudioSeed(): WritingStudioSeed | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(WRITING_STUDIO_SEED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WritingStudioSeed;
  } catch {
    return null;
  }
}

export function clearWritingStudioSeed() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(WRITING_STUDIO_SEED_KEY);
}
