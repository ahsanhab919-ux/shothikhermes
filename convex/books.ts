import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required: valid JWT token is needed");
  return identity.subject;
}

export const createDraft = mutation({
  args: {
    title: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("books", {
      userId,
      projectId: args.projectId,
      status: "draft",
      title: args.title,
      language: "en",
      currency: "USD",
      listPrice: "9.99",
      keywords: [],
      completedSteps: [],
      currentStep: 0,
      agreementAccepted: false,
      agreementScrolled: false,
      agreementName: "",
      salesCount: 0,
      totalEarnings: 0,
      timestamps: { draft: new Date(now).toISOString() },
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDraft = mutation({
  args: {
    id: v.id("books"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    listPrice: v.optional(v.string()),
    currency: v.optional(v.string()),
    agreementAccepted: v.optional(v.boolean()),
    agreementName: v.optional(v.string()),
    agreementScrolled: v.optional(v.boolean()),
    currentStep: v.optional(v.number()),
    completedSteps: v.optional(v.array(v.string())),
    manuscriptName: v.optional(v.string()),
    manuscriptSize: v.optional(v.number()),
    manuscriptFormat: v.optional(v.string()),
    coverDimensions: v.optional(v.object({ width: v.number(), height: v.number() })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const { id, ...updates } = args;
    const book = await ctx.db.get(id);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    if (book.status !== "draft" && book.status !== "rejected") {
      throw new Error("Can only update books in draft or rejected status");
    }
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }
    filtered.updatedAt = Date.now();
    await ctx.db.patch(id, filtered);
  },
});

export const saveManuscriptFile = mutation({
  args: {
    bookId: v.id("books"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    format: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.bookId, {
      manuscriptStorageId: args.storageId,
      manuscriptName: args.fileName,
      manuscriptSize: args.fileSize,
      manuscriptFormat: args.format,
      updatedAt: Date.now(),
    });
  },
});

export const saveCoverFile = mutation({
  args: {
    bookId: v.id("books"),
    storageId: v.id("_storage"),
    dimensions: v.object({ width: v.number(), height: v.number() }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.bookId, {
      coverStorageId: args.storageId,
      coverDimensions: args.dimensions,
      updatedAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateUploadUrlInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createDraftInternal = internalMutation({
  args: {
    title: v.string(),
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("books", {
      userId: args.userId,
      projectId: args.projectId,
      status: "draft",
      title: args.title,
      language: "en",
      currency: "USD",
      listPrice: "9.99",
      keywords: [],
      completedSteps: [],
      currentStep: 0,
      agreementAccepted: false,
      agreementScrolled: false,
      agreementName: "",
      salesCount: 0,
      totalEarnings: 0,
      timestamps: { draft: new Date(now).toISOString() },
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDraftInternal = internalMutation({
  args: {
    id: v.id("books"),
    userId: v.string(),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    listPrice: v.optional(v.string()),
    currency: v.optional(v.string()),
    manuscriptName: v.optional(v.string()),
    manuscriptSize: v.optional(v.number()),
    manuscriptFormat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;
    const book = await ctx.db.get(id);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    if (book.status !== "draft" && book.status !== "rejected") {
      throw new Error("Can only update books in draft or rejected status");
    }
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }
    filtered.updatedAt = Date.now();
    await ctx.db.patch(id, filtered);
  },
});

export const saveManuscriptFileInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    format: v.string(),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.bookId, {
      manuscriptStorageId: args.storageId,
      manuscriptName: args.fileName,
      manuscriptSize: args.fileSize,
      manuscriptFormat: args.format,
      updatedAt: Date.now(),
    });
  },
});

export const saveCoverFileInternal = internalMutation({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
    storageId: v.id("_storage"),
    dimensions: v.object({ width: v.number(), height: v.number() }),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.bookId, {
      coverStorageId: args.storageId,
      coverDimensions: args.dimensions,
      updatedAt: Date.now(),
    });
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const submitForReview = mutation({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    if (book.status !== "draft" && book.status !== "rejected") {
      throw new Error("Can only submit books in draft or rejected status");
    }
    if (!book.manuscriptStorageId) throw new Error("Manuscript file is required");
    if (!book.title || book.title.trim().length < 3) throw new Error("Valid title is required");
    if (!book.description || book.description.trim().length < 50) throw new Error("Description must be at least 50 characters");
    if (!book.keywords || book.keywords.length < 3) throw new Error("At least 3 keywords are required");
    if (!book.category) throw new Error("Category is required");
    if (!book.coverStorageId) throw new Error("Cover image is required");
    if (!book.agreementAccepted) throw new Error("Agreement must be accepted");
    const now = new Date().toISOString();
    const existingTimestamps = book.timestamps || {};
    await ctx.db.patch(args.bookId, {
      status: "submitted",
      timestamps: { ...existingTimestamps, submitted: now },
      updatedAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.id);
    if (!book) return null;
    let manuscriptUrl: string | null = null;
    let coverUrl: string | null = null;
    if (book.manuscriptStorageId) manuscriptUrl = await ctx.storage.getUrl(book.manuscriptStorageId);
    if (book.coverStorageId) coverUrl = await ctx.storage.getUrl(book.coverStorageId);
    return { ...book, manuscriptUrl, coverUrl };
  },
});

export const listByUser = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    const userId = identity.subject;
    let books: any[];
    if (args.status) {
      books = await ctx.db
        .query("books")
        .withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", args.status))
        .order("desc")
        .collect();
    } else {
      books = await ctx.db
        .query("books")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }
    return await Promise.all(books.map(async (book: any) => {
      let coverUrl: string | null = null;
      if (book.coverStorageId) coverUrl = await ctx.storage.getUrl(book.coverStorageId);
      return { ...book, coverUrl };
    }));
  },
});

export const updateStatus = mutation({
  args: {
    bookId: v.id("books"),
    status: v.union(
      v.literal("draft"), v.literal("submitted"), v.literal("in_review"),
      v.literal("approved"), v.literal("rejected"), v.literal("uploading"), v.literal("published")
    ),
    rejectionReason: v.optional(v.string()),
    rejectionCategory: v.optional(v.string()),
    googlePlayUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    distributionOptIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: args.status,
      timestamps: { ...(book.timestamps || {}), [args.status]: now },
      updatedAt: Date.now(),
    };
    if (args.rejectionReason) patch.rejectionReason = args.rejectionReason;
    if (args.rejectionCategory) patch.rejectionCategory = args.rejectionCategory;
    if (args.googlePlayUrl) patch.googlePlayUrl = args.googlePlayUrl;
    if (args.isbn) patch.isbn = args.isbn;
    if (args.distributionOptIn !== undefined) patch.distributionOptIn = args.distributionOptIn;
    await ctx.db.patch(args.bookId, patch);
  },
});

export const resubmitForReview = mutation({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    if (book.status !== "rejected") throw new Error("Can only resubmit rejected books");
    if (!book.manuscriptStorageId) throw new Error("Manuscript file is required");
    if (!book.title || book.title.trim().length < 3) throw new Error("Valid title is required");
    if (!book.description || book.description.trim().length < 50) throw new Error("Description must be at least 50 characters");
    if (!book.coverStorageId) throw new Error("Cover image is required");
    const now = new Date().toISOString();
    const existingTimestamps = book.timestamps || {};
    const previousRejections = book.previousRejections || [];
    if (book.rejectionReason) {
      previousRejections.push({
        reason: book.rejectionReason,
        category: book.rejectionCategory || "other",
        reviewNotes: book.reviewNotes,
        rejectedAt: existingTimestamps.rejected || now,
        reviewedBy: book.reviewedBy,
      });
    }
    await ctx.db.patch(args.bookId, {
      status: "submitted",
      resubmissionCount: (book.resubmissionCount || 0) + 1,
      previousRejections,
      rejectionReason: undefined,
      rejectionCategory: undefined,
      reviewNotes: undefined,
      timestamps: { ...existingTimestamps, submitted: now },
      updatedAt: Date.now(),
    });
  },
});

export const markNotificationsRead = mutation({
  args: {
    bookId: v.id("books"),
    notificationIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    const notifications = (book.notifications || []).map((n: any) =>
      args.notificationIds.includes(n.id) ? { ...n, read: true } : n
    );
    await ctx.db.patch(args.bookId, { notifications, updatedAt: Date.now() });
  },
});

export const getUnreadNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    const books = await ctx.db
      .query("books")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .collect();
    const unread: any[] = [];
    for (const book of books) {
      for (const notif of book.notifications || []) {
        if (!notif.read) {
          unread.push({ bookId: book._id, bookTitle: book.title, notification: notif });
        }
      }
    }
    return unread.sort((a: any, b: any) =>
      new Date(b.notification.createdAt).getTime() - new Date(a.notification.createdAt).getTime()
    );
  },
});

export const remove = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);
    const book = await ctx.db.get(args.id);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("Unauthorized");
    if (book.status !== "draft" && book.status !== "rejected") {
      throw new Error("Can only delete books in draft or rejected status");
    }
    await ctx.db.delete(args.id);
  },
});

export const getPublishedBooks = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let books = await ctx.db
      .query("books")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .order("desc")
      .collect();
    if (args.category) {
      books = books.filter((b: any) => b.category === args.category);
    }
    const limit = args.limit ?? 100;
    books = books.slice(0, limit);
    return await Promise.all(
      books.map(async (book: any) => {
        let coverUrl: string | null = null;
        if (book.coverStorageId) {
          try { coverUrl = await ctx.storage.getUrl(book.coverStorageId); } catch {}
        }
        return {
          _id: book._id,
          title: book.title,
          subtitle: book.subtitle,
          description: book.description,
          coverUrl,
          listPrice: book.listPrice,
          currency: book.currency,
          category: book.category,
          keywords: book.keywords,
          language: book.language,
          userId: book.userId,
          googlePlayUrl: book.googlePlayUrl,
          isbn: book.isbn,
          publishedAt: book.timestamps?.published ?? null,
          createdAt: book._creationTime,
        };
      })
    );
  },
});

export const getPublishedBookById = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.id);
    if (!book || book.status !== "published") return null;
    let coverUrl: string | null = null;
    if (book.coverStorageId) {
      try { coverUrl = await ctx.storage.getUrl(book.coverStorageId); } catch {}
    }
    return {
      _id: book._id,
      title: book.title,
      subtitle: book.subtitle,
      description: book.description,
      coverUrl,
      listPrice: book.listPrice,
      currency: book.currency,
      category: book.category,
      keywords: book.keywords,
      language: book.language,
      userId: book.userId,
      googlePlayUrl: book.googlePlayUrl,
      isbn: book.isbn,
      creditPrice: book.creditPrice ?? null,
      salesCount: book.salesCount ?? 0,
      publishedAt: book.timestamps?.published ?? null,
      createdAt: book._creationTime,
    };
  },
});

export const getManuscriptUrl = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const book = await ctx.db.get(args.bookId);
    if (!book || book.status !== "published") throw new Error("Book not found");

    const userId = identity.subject;
    const isAuthor = book.userId === userId;
    const isFree = !book.creditPrice || book.creditPrice <= 0;

    if (!isAuthor && !isFree) {
      const purchase = await ctx.db
        .query("contentPurchases")
        .withIndex("by_user_book", (q) =>
          q.eq("userId", userId).eq("bookId", args.bookId)
        )
        .first();
      if (!purchase) throw new Error("You must purchase this book to download it");
    }

    if (!book.manuscriptStorageId) throw new Error("No manuscript available");

    const url = await ctx.storage.getUrl(book.manuscriptStorageId);
    return {
      url,
      format: book.manuscriptFormat ?? "epub",
      name: book.manuscriptName ?? `${book.title}.epub`,
    };
  },
});
