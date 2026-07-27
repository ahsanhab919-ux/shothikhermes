import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

async function upsertRecord(ctx: any, localProjectId: string, userId: string, content: string, wordCount = 0) {
  const existing = await ctx.db
    .query("writingAutosaves")
    .withIndex("by_project_user", (q: any) =>
      q.eq("localProjectId", localProjectId).eq("userId", userId)
    )
    .first();

  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { content, wordCount, savedAt: now, updatedAt: now });
    return existing._id;
  }
  return await ctx.db.insert("writingAutosaves", {
    localProjectId,
    userId,
    content,
    wordCount,
    savedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

async function getRecord(ctx: any, localProjectId: string, userId: string) {
  return await ctx.db
    .query("writingAutosaves")
    .withIndex("by_project_user", (q: any) =>
      q.eq("localProjectId", localProjectId).eq("userId", userId)
    )
    .first();
}

export const autosave = mutation({
  args: {
    localProjectId: v.string(),
    content: v.string(),
    wordCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    return await upsertRecord(ctx, args.localProjectId, userId, args.content, args.wordCount);
  },
});

export const getAutosave = query({
  args: {
    localProjectId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    const record = await getRecord(ctx, args.localProjectId, identity.subject);
    if (!record) return null;
    return { content: record.content, wordCount: record.wordCount, savedAt: record.savedAt };
  },
});

export const deleteAutosave = mutation({
  args: { localProjectId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const record = await getRecord(ctx, args.localProjectId, userId);
    if (record) await ctx.db.delete(record._id);
  },
});

export const listAutosaves = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    return await ctx.db
      .query("writingAutosaves")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .order("desc")
      .take(50);
  },
});

export const saveSections = mutation({
  args: {
    localProjectId: v.string(),
    sections: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const key = `${args.localProjectId}/sections`;
    return await upsertRecord(ctx, key, userId, JSON.stringify(args.sections), 0);
  },
});

export const getSections = query({
  args: { localProjectId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    const key = `${args.localProjectId}/sections`;
    const record = await getRecord(ctx, key, identity.subject);
    if (!record) return null;
    try {
      return JSON.parse(record.content);
    } catch {
      return null;
    }
  },
});

export const saveCharacters = mutation({
  args: {
    localProjectId: v.string(),
    characters: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const key = `${args.localProjectId}/characters`;
    return await upsertRecord(ctx, key, userId, JSON.stringify(args.characters), 0);
  },
});

export const getCharacters = query({
  args: { localProjectId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    const key = `${args.localProjectId}/characters`;
    const record = await getRecord(ctx, key, identity.subject);
    if (!record) return null;
    try {
      return JSON.parse(record.content);
    } catch {
      return null;
    }
  },
});
