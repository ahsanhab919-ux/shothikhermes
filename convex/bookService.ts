/**
 * Convex data layer for the engine's book-service (ported from Mongoose).
 *
 * These are the storage primitives that `lib/book/book-service.ts` calls over
 * the Convex admin HTTP API (deploy key). They operate on the host `books` and
 * `chapters` tables (extended with additive engine fields) and the new
 * `chapterAttempts` table.
 *
 * Atomicity note: Convex mutations are transactional. Mongoose's
 * `findOneAndUpdate` atomic status claim is preserved by `claimBookForRun`
 * performing the read + conditional write inside a single mutation.
 */
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Server-side guard against runaway generation. Kept in sync with the service
// layer's MAX_CHAPTER_ATTEMPTS (lib/book/types.ts); enforced here as a
// defence-in-depth cap independent of any caller.
const MAX_CHAPTER_ATTEMPTS = 3;

const planValidator = v.array(
  v.object({
    index: v.number(),
    intent: v.string(),
    beats: v.array(v.string()),
  })
);

const kindValidator = v.union(v.literal("fiction"), v.literal("nonfiction"));
const sourceKindValidator = v.union(v.literal("outline"), v.literal("manuscript"));
const engineStatusValidator = v.union(
  v.literal("draft"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed")
);
const chapterStatusValidator = v.union(
  v.literal("draft"),
  v.literal("accepted"),
  v.literal("rejected")
);
const attemptStatusValidator = v.union(
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("failed")
);

export const createBook = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    author: v.optional(v.string()),
    kind: kindValidator,
    sourceKind: sourceKindValidator,
    plan: planValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("books", {
      userId: args.userId,
      title: args.title,
      subtitle: args.subtitle,
      author: args.author,
      kind: args.kind,
      sourceKind: args.sourceKind,
      plan: args.plan,
      status: "draft",
      engineStatus: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const listBooks = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    // The `books` table is shared with the host publishing workflow, whose rows
    // leave `engineStatus` undefined. Only surface engine-owned rows so host
    // books never leak into engine logic.
    return books.filter((book) => book.engineStatus !== undefined);
  },
});

export const getBook = internalQuery({
  args: { userId: v.string(), bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    // Reject host-owned rows (no engineStatus): the engine must not read a
    // publishing-workflow book through its own accessors.
    if (!book || book.userId !== args.userId || book.engineStatus === undefined) {
      return null;
    }
    return book;
  },
});

export const claimBookForRun = internalMutation({
  args: { userId: v.string(), bookId: v.id("books") },
  handler: async (ctx, args) => {
    // Atomic claim: read + conditional write in one transaction, mirroring
    // Mongoose findOneAndUpdate({_id, userId, engineStatus: 'draft'}).
    const book = await ctx.db.get(args.bookId);
    if (!book || book.userId !== args.userId) {
      return { status: "not_found" as const, book: null };
    }
    // Only an engine-owned draft is claimable. A host-owned book leaves
    // engineStatus undefined, which is (correctly) not "draft" — do NOT treat
    // it as an implicit draft the way the old `engineStatus ?? "draft"` did.
    if (book.engineStatus !== "draft") {
      return { status: "conflict" as const, book };
    }
    const now = Date.now();
    await ctx.db.patch(args.bookId, { engineStatus: "running", updatedAt: now });
    return { status: "claimed" as const, book: { ...book, engineStatus: "running", updatedAt: now } };
  },
});

export const resetBookToDraft = internalMutation({
  args: { userId: v.string(), bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    // Engine-ownership guard: a host publishing-workflow row leaves
    // engineStatus undefined. Reject it so a reset can never stamp
    // engineStatus:"draft" onto a host book and make it engine-claimable.
    if (!book || book.userId !== args.userId || book.engineStatus === undefined) {
      return { status: "not_found" as const, book: null };
    }
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId).eq("userId", args.userId))
      .collect();
    for (const chapter of chapters) {
      await ctx.db.delete(chapter._id);
    }
    // Also clear chapterAttempts; leaving them orphaned corrupts
    // getChapterProgress / listChapterAttempts after a reset.
    const attempts = await ctx.db
      .query("chapterAttempts")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId).eq("userId", args.userId))
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }
    const now = Date.now();
    await ctx.db.patch(args.bookId, { engineStatus: "draft", updatedAt: now });
    return { status: "ok" as const, book: { ...book, engineStatus: "draft", updatedAt: now } };
  },
});

export const getAcceptedChapters = internalQuery({
  args: { userId: v.string(), bookId: v.id("books") },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId).eq("userId", args.userId))
      .collect();
    return chapters
      .filter((c) => c.status === "accepted")
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  },
});

export const saveChapterRecord = internalMutation({
  args: {
    userId: v.string(),
    bookId: v.id("books"),
    index: v.number(),
    intent: v.string(),
    content: v.string(),
    status: chapterStatusValidator,
    attempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Upsert by {userId, bookId, index}, mirroring the Mongoose
    // findOne(...) then save() OR create(...) path.
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) =>
        q.eq("bookId", args.bookId).eq("userId", args.userId).eq("index", args.index)
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        intent: args.intent,
        content: args.content,
        status: args.status,
        attempts: args.attempts ?? existing.attempts ?? 1,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("chapters", {
      userId: args.userId,
      bookId: args.bookId,
      index: args.index,
      intent: args.intent,
      content: args.content,
      status: args.status,
      attempts: args.attempts ?? 1,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const recordChapterAttempt = internalMutation({
  args: {
    userId: v.string(),
    bookId: v.id("books"),
    index: v.number(),
    attempt: v.number(),
    status: attemptStatusValidator,
    gateIssues: v.array(v.string()),
    tokensUsed: v.optional(v.number()),
    modelHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Defence-in-depth cap: reject once this chapter already has
    // MAX_CHAPTER_ATTEMPTS recorded attempts, independent of the caller.
    const existing = await ctx.db
      .query("chapterAttempts")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId).eq("userId", args.userId))
      .collect();
    const countForIndex = existing.filter((a) => a.index === args.index).length;
    if (countForIndex >= MAX_CHAPTER_ATTEMPTS) {
      return { status: "limit_exceeded" as const, attempt: null };
    }
    const now = Date.now();
    const id = await ctx.db.insert("chapterAttempts", {
      userId: args.userId,
      bookId: args.bookId,
      index: args.index,
      attempt: args.attempt,
      status: args.status,
      gateIssues: args.gateIssues,
      tokensUsed: args.tokensUsed,
      modelHandle: args.modelHandle,
      createdAt: now,
      updatedAt: now,
    });
    return { status: "ok" as const, attempt: await ctx.db.get(id) };
  },
});

export const listChapterAttempts = internalQuery({
  args: { userId: v.string(), bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chapterAttempts")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId).eq("userId", args.userId))
      .collect();
  },
});

export const setBookStatus = internalMutation({
  args: { userId: v.string(), bookId: v.id("books"), status: engineStatusValidator },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    // Engine-ownership guard: reject host publishing-workflow rows (undefined
    // engineStatus) so a status change can never convert a host book into an
    // engine-owned one.
    if (!book || book.userId !== args.userId || book.engineStatus === undefined) {
      return { status: "not_found" as const, book: null };
    }
    const now = Date.now();
    await ctx.db.patch(args.bookId, { engineStatus: args.status, updatedAt: now });
    return { status: "ok" as const, book: { ...book, engineStatus: args.status, updatedAt: now } };
  },
});
