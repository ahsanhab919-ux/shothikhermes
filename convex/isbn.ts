import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const getPoolStats = query({
  args: {},
  returns: v.object({
    available: v.number(),
    assigned: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("isbnPool").collect();
    const available = all.filter((i) => i.status === "available").length;
    const assigned = all.filter((i) => i.status === "assigned").length;
    return { available, assigned, total: all.length };
  },
});

export const getAssignedIsbn = query({
  args: { bookId: v.string(), format: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { bookId, format }) => {
    await requireAdmin(ctx);
    const record = await ctx.db
      .query("isbnPool")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", bookId))
      .filter((q) => q.eq(q.field("format"), format))
      .first();
    return record?.isbn ?? null;
  },
});

export const getAssignedIsbns = query({
  args: { bookId: v.string() },
  returns: v.array(
    v.object({
      isbn: v.string(),
      format: v.string(),
      assignedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, { bookId }) => {
    await requireAdmin(ctx);
    const records = await ctx.db
      .query("isbnPool")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", bookId))
      .collect();
    return records.map((r) => ({
      isbn: r.isbn,
      format: r.format,
      assignedAt: r.assignedAt,
    }));
  },
});

export const assignIsbn = mutation({
  args: {
    bookId: v.string(),
    format: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, { bookId, format }) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("isbnPool")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", bookId))
      .filter((q) => q.eq(q.field("format"), format))
      .first();

    if (existing) return existing.isbn;

    const available = await ctx.db
      .query("isbnPool")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .filter((q) => q.eq(q.field("format"), format))
      .first();

    if (!available) {
      throw new Error(
        `No available ISBNs in pool for format: ${format}. Contact admin to add more ISBNs.`,
      );
    }

    await ctx.db.patch(available._id, {
      status: "assigned",
      assignedTo: bookId,
      assignedAt: Date.now(),
    });

    return available.isbn;
  },
});

export const releaseIsbn = mutation({
  args: { isbn: v.string() },
  returns: v.null(),
  handler: async (ctx, { isbn }) => {
    await requireAdmin(ctx);
    const record = await ctx.db
      .query("isbnPool")
      .withIndex("by_isbn", (q) => q.eq("isbn", isbn))
      .first();

    if (!record) throw new Error(`ISBN not found: ${isbn}`);
    if (record.status !== "assigned") throw new Error(`ISBN is not assigned: ${isbn}`);

    await ctx.db.patch(record._id, {
      status: "available",
      assignedTo: undefined,
      assignedAt: undefined,
    });

    return null;
  },
});

export const seedIsbnPool = mutation({
  args: {
    isbns: v.array(
      v.object({
        isbn: v.string(),
        format: v.string(),
        registrant: v.optional(v.string()),
        prefix: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({ added: v.number(), skipped: v.number() }),
  handler: async (ctx, { isbns }) => {
    await requireAdmin(ctx);
    let added = 0;
    let skipped = 0;

    for (const entry of isbns) {
      const existing = await ctx.db
        .query("isbnPool")
        .withIndex("by_isbn", (q) => q.eq("isbn", entry.isbn))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("isbnPool", {
        isbn: entry.isbn,
        format: entry.format,
        status: "available",
        registrant: entry.registrant ?? "Shothik AI Ltd",
        prefix: entry.prefix,
      });
      added++;
    }

    return { added, skipped };
  },
});

export const seedTestPool = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const testIsbns = [
      { isbn: "978-1-00-000001-0", format: "epub" },
      { isbn: "978-1-00-000002-7", format: "epub" },
      { isbn: "978-1-00-000003-4", format: "epub" },
      { isbn: "978-1-00-000004-1", format: "pdf" },
      { isbn: "978-1-00-000005-8", format: "pdf" },
      { isbn: "978-1-00-000006-5", format: "pdf" },
      { isbn: "978-1-00-000007-2", format: "print" },
      { isbn: "978-1-00-000008-9", format: "print" },
    ];

    for (const entry of testIsbns) {
      const existing = await ctx.db
        .query("isbnPool")
        .withIndex("by_isbn", (q) => q.eq("isbn", entry.isbn))
        .first();

      if (!existing) {
        await ctx.db.insert("isbnPool", {
          isbn: entry.isbn,
          format: entry.format,
          status: "available",
          registrant: "Shothik AI Ltd (TEST)",
          prefix: "978-1-00",
        });
      }
    }

    return null;
  },
});

