import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeString(value: string | undefined | null): string | undefined {
  const s = value?.trim();
  return s ? s : undefined;
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const append = mutation({
  args: {
    requestId: v.optional(v.string()),
    timestamp: v.number(),
    actorType: v.union(
      v.literal("user"),
      v.literal("api_key"),
      v.literal("anonymous"),
      v.literal("system"),
    ),
    actorId: v.optional(v.string()),
    actorRole: v.optional(v.string()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    action: v.string(),
    outcome: v.union(v.literal("allow"), v.literal("deny"), v.literal("error")),
    method: v.optional(v.string()),
    path: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const last = await ctx.db.query("auditEvents").withIndex("by_time").order("desc").first();
    const prevHash = last?.hash as string | undefined;

    const canonical = JSON.stringify({
      requestId: normalizeString(args.requestId),
      timestamp: args.timestamp,
      actorType: args.actorType,
      actorId: normalizeString(args.actorId),
      actorRole: normalizeString(args.actorRole),
      ip: normalizeString(args.ip),
      userAgent: normalizeString(args.userAgent),
      action: args.action,
      outcome: args.outcome,
      method: normalizeString(args.method),
      path: normalizeString(args.path),
      details: args.details ?? null,
      prevHash: prevHash ?? null,
    });

    const hash = await sha256Hex(canonical);

    const id = await ctx.db.insert("auditEvents", {
      requestId: normalizeString(args.requestId),
      timestamp: args.timestamp,
      actorType: args.actorType,
      actorId: normalizeString(args.actorId),
      actorRole: normalizeString(args.actorRole),
      ip: normalizeString(args.ip),
      userAgent: normalizeString(args.userAgent),
      action: args.action,
      outcome: args.outcome,
      method: normalizeString(args.method),
      path: normalizeString(args.path),
      details: args.details,
      prevHash,
      hash,
    });

    return { id, hash };
  },
});

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    actorId: v.optional(v.string()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 500);

    const actorId = args.actorId;
    if (typeof actorId === "string" && actorId.length > 0) {
      return ctx.db
        .query("auditEvents")
        .withIndex("by_actor_time", (q) => q.eq("actorId", actorId))
        .order("desc")
        .take(limit);
    }

    const action = args.action;
    if (typeof action === "string" && action.length > 0) {
      return ctx.db
        .query("auditEvents")
        .withIndex("by_action_time", (q) => q.eq("action", action))
        .order("desc")
        .take(limit);
    }

    return ctx.db.query("auditEvents").withIndex("by_time").order("desc").take(limit);
  },
});
