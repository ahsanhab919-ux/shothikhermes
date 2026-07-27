import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("book"), v.literal("research"), v.literal("assignment"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    const userId = identity.subject;
    if (args.type) {
      return await ctx.db
        .query("projects")
        .withIndex("by_user_type", (q: any) => q.eq("userId", userId).eq("type", args.type))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    const project = await ctx.db.get(args.id);
    if (!project) return null;
    if (project.userId && project.userId !== identity.subject) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("book"), v.literal("research"), v.literal("assignment")),
    template: v.optional(v.string()),
    description: v.optional(v.string()),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.optional(v.string()),
      order: v.number(),
      children: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        content: v.optional(v.string()),
        order: v.number(),
        status: v.optional(v.string()),
      }))),
    }))),
    settings: v.optional(v.object({
      citationStyle: v.optional(v.string()),
      targetJournal: v.optional(v.string()),
      deadline: v.optional(v.string()),
      dailyGoal: v.optional(v.number()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      trimSize: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    return await ctx.db.insert("projects", {
      ...args,
      userId,
      content: "",
      wordCount: 0,
      progress: 0,
      lastEditedAt: Date.now(),
      starred: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    sections: v.optional(v.any()),
    settings: v.optional(v.any()),
    wordCount: v.optional(v.number()),
    progress: v.optional(v.number()),
    starred: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const { id, ...updates } = args;
    const project = await ctx.db.get(id);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== userId) throw new Error("Unauthorized");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    (filtered as any).lastEditedAt = Date.now();
    await ctx.db.patch(id, filtered);
  },
});

export const updateContent = mutation({
  args: {
    projectId: v.id("projects"),
    content: v.string(),
    wordCount: v.optional(v.number()),
    sections: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== userId) throw new Error("Unauthorized");
    const patch: Record<string, unknown> = { content: args.content, lastEditedAt: Date.now() };
    if (typeof args.wordCount === "number") patch.wordCount = args.wordCount;
    if (args.sections !== undefined) patch.sections = args.sections;
    await ctx.db.patch(args.projectId, patch);
    return { success: true, savedAt: Date.now() };
  },
});

export const restoreVersion = mutation({
  args: {
    projectId: v.id("projects"),
    versionId: v.id("projectVersions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== userId) throw new Error("Unauthorized");

    const version = await ctx.db.get(args.versionId);
    if (!version || String(version.projectId) !== String(args.projectId)) {
      throw new Error("Version not found");
    }

    await ctx.db.patch(args.projectId, {
      content: version.content,
      sections: version.sections,
      lastEditedAt: Date.now(),
    });

    await ctx.db.insert("projectVersions", {
      projectId: args.projectId,
      content: version.content,
      sections: version.sections,
      label: `Restored ${args.versionId}`,
      savedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateSettings = mutation({
  args: {
    projectId: v.id("projects"),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== userId) throw new Error("Unauthorized");
    const merged = { ...(project.settings ?? {}), ...(args.settings ?? {}) };
    await ctx.db.patch(args.projectId, { settings: merged, lastEditedAt: Date.now() });
    return { success: true };
  },
});

export const getStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== identity.subject) throw new Error("Unauthorized");

    const versions = await ctx.db
      .query("projectVersions")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .take(100);

    const totalVersions = versions.length;
    const wordsWritten = project.wordCount ?? 0;
    const targetWords = 50000;
    const progress = Math.min(100, Math.round((wordsWritten / Math.max(1, targetWords)) * 100));

    const sorted = versions.slice().sort((a: any, b: any) => a.savedAt - b.savedAt);
    const first = sorted[0];
    const daysSinceStart = first
      ? Math.max(1, Math.floor((Date.now() - first.savedAt) / (1000 * 60 * 60 * 24)))
      : 1;
    const velocity = Math.round(wordsWritten / daysSinceStart);
    const remainingWords = Math.max(0, targetWords - wordsWritten);
    const estimatedDays = velocity > 0 ? Math.ceil(remainingWords / velocity) : null;

    return {
      totalVersions,
      wordsWritten,
      targetWords,
      progress,
      velocity,
      estimatedDays,
      lastEdited: project.lastEditedAt,
    };
  },
});

export const saveVersion = mutation({
  args: {
    projectId: v.id("projects"),
    content: v.string(),
    sections: v.optional(v.any()),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== userId) throw new Error("Unauthorized");
    return await ctx.db.insert("projectVersions", {
      projectId: args.projectId,
      content: args.content,
      sections: args.sections,
      label: args.label,
      savedAt: Date.now(),
    });
  },
});

export const getVersions = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];
    if (project.userId && project.userId !== identity.subject) return [];
    return await ctx.db
      .query("projectVersions")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");
    if (project.userId && project.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
