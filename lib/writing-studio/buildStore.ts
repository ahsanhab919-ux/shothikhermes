import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export interface BuildRecord {
  buildId: string;
  userId?: string;
  status: "queued" | "processing" | "completed" | "failed";
  content?: string;
  pdfUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

const STORE_DIR = "/tmp/writing-studio-builds";

function ensureDir() {
  if (!existsSync(STORE_DIR)) {
    mkdirSync(STORE_DIR, { recursive: true });
  }
}

function buildPath(buildId: string): string {
  return path.join(STORE_DIR, `${buildId}.json`);
}

function getConvexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export function createBuild(buildId: string, content: string, metadata?: Record<string, any>, userId?: string): BuildRecord {
  ensureDir();
  const record: BuildRecord = {
    buildId,
    userId,
    status: "queued",
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata,
  };
  writeFileSync(buildPath(buildId), JSON.stringify(record), "utf-8");

  const convex = getConvexClient();
  if (convex) {
    convex.mutation(api.latex.createBuild, { buildId, userId: userId || "anonymous" }).catch((err) =>
      console.warn("[buildStore] Convex createBuild failed:", err)
    );
  }

  return record;
}

export function getBuild(buildId: string): BuildRecord | undefined {
  const fp = buildPath(buildId);
  if (!existsSync(fp)) return undefined;
  try {
    return JSON.parse(readFileSync(fp, "utf-8"));
  } catch {
    return undefined;
  }
}

export function updateBuild(buildId: string, updates: Partial<BuildRecord>): BuildRecord | undefined {
  const existing = getBuild(buildId);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  writeFileSync(buildPath(buildId), JSON.stringify(updated), "utf-8");

  if (updates.status) {
    const convex = getConvexClient();
    if (convex) {
      convex.mutation(api.latex.updateBuild, {
        buildId,
        status: updates.status,
        pdfUrl: updates.pdfUrl,
        error: updates.error,
      }).catch((err) => console.warn("[buildStore] Convex updateBuild failed:", err));
    }
  }

  return updated;
}

export async function getBuildWithConvexFallback(buildId: string): Promise<BuildRecord | undefined> {
  const local = getBuild(buildId);
  if (local) return local;

  const convex = getConvexClient();
  if (!convex) return undefined;

  try {
    const remote = await convex.query(api.latex.getBuild, { buildId });
    if (!remote) return undefined;
    return {
      buildId: remote.buildId,
      userId: remote.userId,
      status: remote.status as BuildRecord["status"],
      pdfUrl: remote.pdfUrl,
      error: remote.error,
      createdAt: new Date(remote.createdAt).toISOString(),
      updatedAt: new Date(remote.updatedAt).toISOString(),
    };
  } catch (err) {
    console.warn("[buildStore] Convex getBuild fallback failed:", err);
    return undefined;
  }
}
