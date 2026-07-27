import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const listByStatus = query({
  args: {
    status: v.optional(v.union(
      v.literal("submitted"), v.literal("in_review"), v.literal("approved"),
      v.literal("rejected"), v.literal("uploading"), v.literal("published")
    )),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let books: any[];
    if (args.status) {
      books = await ctx.db
        .query("books")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .order("desc")
        .collect();
    } else {
      const submitted = await ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "submitted")).order("desc").collect();
      const inReview = await ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "in_review")).order("desc").collect();
      const approved = await ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "approved")).order("desc").collect();
      books = [...submitted, ...inReview, ...approved];
    }
    return await Promise.all(books.map(async (book: any) => {
      const coverUrl = book.coverStorageId ? await ctx.storage.getUrl(book.coverStorageId) : null;
      const manuscriptUrl = book.manuscriptStorageId ? await ctx.storage.getUrl(book.manuscriptStorageId) : null;
      return { ...book, coverUrl, manuscriptUrl };
    }));
  },
});

export const getBookForReview = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) return null;
    const manuscriptUrl = book.manuscriptStorageId ? await ctx.storage.getUrl(book.manuscriptStorageId) : null;
    const coverUrl = book.coverStorageId ? await ctx.storage.getUrl(book.coverStorageId) : null;
    return { ...book, manuscriptUrl, coverUrl };
  },
});

export const startReview = mutation({
  args: {
    bookId: v.id("books"),
    reviewerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminUserId = await requireAdmin(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.status !== "submitted") throw new Error("Can only start review on submitted books");
    const now = new Date().toISOString();
    const existingTimestamps = book.timestamps || {};
    const existingNotifications = book.notifications || [];
    await ctx.db.patch(args.bookId, {
      status: "in_review",
      reviewedBy: args.reviewerName || adminUserId,
      reviewedAt: now,
      timestamps: { ...existingTimestamps, in_review: now },
      notifications: [...existingNotifications, {
        id: `notif_${Date.now()}`,
        type: "in_review",
        message: `Your book "${book.title}" is now under review. We'll notify you of the decision.`,
        read: false,
        createdAt: now,
      }],
      updatedAt: Date.now(),
    });
  },
});

export const approveBook = mutation({
  args: {
    bookId: v.id("books"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.status !== "in_review") throw new Error("Can only approve books in review");
    const now = new Date().toISOString();
    const existingTimestamps = book.timestamps || {};
    const existingNotifications = book.notifications || [];
    await ctx.db.patch(args.bookId, {
      status: "approved",
      reviewNotes: args.reviewNotes,
      timestamps: { ...existingTimestamps, approved: now },
      notifications: [...existingNotifications, {
        id: `notif_${Date.now()}`,
        type: "approved",
        message: `Your book "${book.title}" has been approved and is being prepared for distribution.`,
        read: false,
        createdAt: now,
      }],
      updatedAt: Date.now(),
    });
  },
});

export const rejectBook = mutation({
  args: {
    bookId: v.id("books"),
    reason: v.string(),
    category: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.status !== "in_review" && book.status !== "submitted") {
      throw new Error("Can only reject books in review or submitted status");
    }
    const now = new Date().toISOString();
    const existingTimestamps = book.timestamps || {};
    const existingNotifications = book.notifications || [];
    await ctx.db.patch(args.bookId, {
      status: "rejected",
      rejectionReason: args.reason,
      rejectionCategory: args.category,
      reviewNotes: args.reviewNotes,
      timestamps: { ...existingTimestamps, rejected: now },
      notifications: [...existingNotifications, {
        id: `notif_${Date.now()}`,
        type: "rejected",
        message: `Your book "${book.title}" requires revisions before it can be published. Please review the feedback.`,
        read: false,
        createdAt: now,
      }],
      updatedAt: Date.now(),
    });
  },
});

export const markAsPublished = mutation({
  args: {
    bookId: v.id("books"),
    googlePlayUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    const now = new Date().toISOString();
    const existingTimestamps = book.timestamps || {};
    const existingNotifications = book.notifications || [];
    await ctx.db.patch(args.bookId, {
      status: "published",
      googlePlayUrl: args.googlePlayUrl,
      isbn: args.isbn,
      distributionEnabled: true,
      timestamps: { ...existingTimestamps, published: now },
      notifications: [...existingNotifications, {
        id: `notif_${Date.now()}`,
        type: "published",
        message: `Your book "${book.title}" is now live! ${args.googlePlayUrl ? `View it here: ${args.googlePlayUrl}` : ""}`,
        read: false,
        createdAt: now,
      }],
      updatedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [submitted, inReview, approved, published, rejected] = await Promise.all([
      ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "submitted")).collect(),
      ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "in_review")).collect(),
      ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "approved")).collect(),
      ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "published")).collect(),
      ctx.db.query("books").withIndex("by_status", (q: any) => q.eq("status", "rejected")).collect(),
    ]);
    return {
      submitted: submitted.length,
      inReview: inReview.length,
      approved: approved.length,
      published: published.length,
      rejected: rejected.length,
      total: submitted.length + inReview.length + approved.length + published.length + rejected.length,
    };
  },
});

export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.BOOTSTRAP_ADMIN_ENABLED !== "true") {
      throw new Error("Bootstrap admin is not enabled");
    }
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const existing = await ctx.db.query("admins").collect();
    if (existing.length > 0) {
      throw new Error("Admins already exist. Use admin management to add more.");
    }

    await ctx.db.insert("admins", {
      userId: identity.subject,
      email: identity.email ?? "",
      createdAt: Date.now(),
    });

    return { success: true, email: identity.email };
  },
});

export const addAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("Admin already exists");
    await ctx.db.insert("admins", {
      userId: "",
      email: args.email,
      createdAt: Date.now(),
    });
    return { success: true };
  },
});

export const removeAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email === args.email) throw new Error("Cannot remove yourself as admin");
    const record = await ctx.db
      .query("admins")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();
    if (!record) throw new Error("Admin not found");
    await ctx.db.delete(record._id);
    return { success: true };
  },
});
