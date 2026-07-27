import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

export const getChannels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("channels").collect();
  },
});

export const getChannelBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const createChannel = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    domain: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("channels")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("channels", {
      ...args,
      memberCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const joinChannel = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("channelMemberships")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", userId).eq("channelId", args.channelId)
      )
      .first();

    if (existing) return { action: "already_joined" as const };

    await ctx.db.insert("channelMemberships", {
      userId,
      channelId: args.channelId,
      role: "member",
      joinedAt: Date.now(),
    });

    const channel = await ctx.db.get(args.channelId);
    if (channel) {
      await ctx.db.patch(args.channelId, {
        memberCount: channel.memberCount + 1,
      });
    }

    return { action: "joined" as const };
  },
});

export const leaveChannel = mutation({
  args: {
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const membership = await ctx.db
      .query("channelMemberships")
      .withIndex("by_user_channel", (q) =>
        q.eq("userId", userId).eq("channelId", args.channelId)
      )
      .first();

    if (!membership) return { action: "not_member" as const };

    await ctx.db.delete(membership._id);

    const channel = await ctx.db.get(args.channelId);
    if (channel) {
      await ctx.db.patch(args.channelId, {
        memberCount: Math.max(0, channel.memberCount - 1),
      });
    }

    return { action: "left" as const };
  },
});

export const getUserChannels = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];

    const memberships = await ctx.db
      .query("channelMemberships")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const channels = await Promise.all(
      memberships.map(async (m) => {
        const channel = await ctx.db.get(m.channelId);
        return channel ? { ...channel, role: m.role, joinedAt: m.joinedAt } : null;
      })
    );

    return channels.filter(Boolean);
  },
});

export const seedDefaultChannels = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaults = [
      { name: "Molecular Biology", slug: "molecular-biology", description: "Genomics, proteomics, and cellular processes", domain: "molecular-biology", icon: "🧬" },
      { name: "Quantum Physics", slug: "quantum-physics", description: "Quantum mechanics, entanglement, and computation", domain: "quantum-physics", icon: "⚛️" },
      { name: "Machine Learning", slug: "machine-learning", description: "Neural networks, deep learning, and AI research", domain: "machine-learning", icon: "🤖" },
      { name: "Organic Chemistry", slug: "organic-chemistry", description: "Synthesis, reactions, and molecular design", domain: "organic-chemistry", icon: "🧪" },
      { name: "Materials Science", slug: "materials-science", description: "Nanomaterials, polymers, and advanced materials", domain: "materials-science", icon: "🔬" },
      { name: "Computer Science", slug: "computer-science", description: "Algorithms, systems, and theory of computation", domain: "computer-science", icon: "💻" },
      { name: "Mathematics", slug: "mathematics", description: "Pure and applied mathematics research", domain: "mathematics", icon: "📐" },
      { name: "Environmental Science", slug: "environmental-science", description: "Climate, ecology, and sustainability", domain: "environmental-science", icon: "🌍" },
      { name: "Biomedical Engineering", slug: "biomedical-engineering", description: "Medical devices, tissue engineering, and bioinformatics", domain: "biomedical-engineering", icon: "🏥" },
      { name: "Data Science", slug: "data-science", description: "Statistical modeling, visualization, and big data", domain: "data-science", icon: "📊" },
    ];

    let created = 0;
    for (const ch of defaults) {
      const existing = await ctx.db
        .query("channels")
        .withIndex("by_slug", (q) => q.eq("slug", ch.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("channels", { ...ch, memberCount: 0, createdAt: Date.now() });
        created++;
      }
    }

    return { created, total: defaults.length };
  },
});
