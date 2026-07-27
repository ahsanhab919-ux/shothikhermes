import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any, passedUserId?: string): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) return identity.subject;
  if (passedUserId) return passedUserId;
  throw new Error("Authentication required");
}

export const getEarningsSummary = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);

    const books = await ctx.db
      .query("books")
      .withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "published"))
      .collect();

    const salesRecords = await ctx.db
      .query("salesRecords")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const totalRevenue = salesRecords.reduce((s: number, r: any) => s + (r.netRevenue || 0), 0);
    const totalSales = salesRecords.reduce((s: number, r: any) => s + (r.unitsSold || 0), 0);
    const totalRoyalties = salesRecords.reduce((s: number, r: any) => s + (r.royaltyAmount || 0), 0);

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const paid = payouts
      .filter((p: any) => p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    const processingOrPending = payouts
      .filter((p: any) => p.status === "processing" || p.status === "pending")
      .reduce((s: number, p: any) => s + p.amount, 0);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const last30 = salesRecords.filter((r: any) => r.recordedAt > thirtyDaysAgo);
    const last7 = salesRecords.filter((r: any) => r.recordedAt > sevenDaysAgo);

    const salesByBook = books.map((book: any) => {
      const bookSales = salesRecords.filter((r: any) => String(r.bookId) === String(book._id));
      return {
        bookId: book._id,
        title: book.title,
        totalSales: bookSales.reduce((s: number, r: any) => s + (r.unitsSold || 0), 0),
        totalRevenue: bookSales.reduce((s: number, r: any) => s + (r.netRevenue || 0), 0),
        totalRoyalties: bookSales.reduce((s: number, r: any) => s + (r.royaltyAmount || 0), 0),
      };
    });

    const perBookEarnings = salesByBook.map((b: any) => ({
      bookId: b.bookId,
      title: b.title,
      units: b.totalSales,
      revenue: b.totalRevenue,
      royalties: b.totalRoyalties,
    }));

    const monthlyMap = new Map<string, { period: string; revenue: number; royalties: number; units: number }>();
    for (const r of salesRecords) {
      const period = typeof r.month === "string" && r.month.length > 0 ? r.month : r.period;
      if (!period) continue;
      const existing = monthlyMap.get(period) ?? { period, revenue: 0, royalties: 0, units: 0 };
      existing.revenue += r.netRevenue || 0;
      existing.royalties += r.royaltyAmount || 0;
      existing.units += r.unitsSold || 0;
      monthlyMap.set(period, existing);
    }

    const monthlyBreakdown = Array.from(monthlyMap.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12)
      .map((m) => ({
        period: m.period,
        revenue: m.revenue,
        royalties: m.royalties,
        units: m.units,
      }));

    const availableBalance = Math.max(0, totalRoyalties - paid - processingOrPending);

    return {
      totalEarnings: totalRoyalties,
      totalUnitsSold: totalSales,
      lifetimeRevenue: totalRevenue,
      availableBalance,
      totalPaidOut: paid,
      pendingPayouts: processingOrPending,
      publishedBooksCount: books.length,
      monthlyBreakdown,
      perBookEarnings,
      totalRevenue,
      totalSales,
      totalRoyalties,
      paidBalance: paid,
      pendingBalance: totalRoyalties - paid,
      publishedBooks: books.length,
      last30DaysRevenue: last30.reduce((s: number, r: any) => s + (r.netRevenue || 0), 0),
      last7DaysRevenue: last7.reduce((s: number, r: any) => s + (r.netRevenue || 0), 0),
      salesByBook,
    };
  },
});

export const getAvailableBalance = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    const sales = await ctx.db
      .query("salesRecords")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const totalRoyalties = sales.reduce((sum: number, r: any) => sum + (r.royaltyAmount ?? 0), 0);
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const reserved = payouts
      .filter((p: any) => p.status === "completed" || p.status === "processing" || p.status === "pending")
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    return Math.max(0, totalRoyalties - reserved);
  },
});

export const getEarningsByBook = query({
  args: { userId: v.optional(v.string()), bookId: v.optional(v.id("books")) },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    const sales = args.bookId
      ? await ctx.db
          .query("salesRecords")
          .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
          .take(200)
      : await ctx.db
          .query("salesRecords")
          .withIndex("by_user", (q: any) => q.eq("userId", userId))
          .take(500);

    const byBook = new Map<string, any>();
    for (const sale of sales) {
      const key = String(sale.bookId);
      const existing = byBook.get(key) ?? {
        bookId: sale.bookId,
        totalSales: 0,
        totalRevenue: 0,
        totalRoyalties: 0,
      };
      existing.totalSales += sale.unitsSold || 0;
      existing.totalRevenue += sale.netRevenue || 0;
      existing.totalRoyalties += sale.royaltyAmount || 0;
      byBook.set(key, existing);
    }

    const ids = Array.from(byBook.values()).map((b) => b.bookId);
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    const titleMap = new Map(ids.map((id, i) => [String(id), (docs[i] as any)?.title ?? "Unknown"]));

    return Array.from(byBook.values()).map((b) => ({
      ...b,
      title: titleMap.get(String(b.bookId)) ?? "Unknown",
    }));
  },
});

export const getMonthlyEarnings = query({
  args: { userId: v.optional(v.string()), months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    const months = args.months ?? 12;
    const records = await ctx.db
      .query("earningsRecords")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(Math.max(12, months));
    return records.slice(0, months);
  },
});

export const createEarningsRecord = internalMutation({
  args: {
    userId: v.string(),
    period: v.string(),
    amount: v.number(),
    holdback: v.number(),
    bookCount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("earningsRecords")
      .withIndex("by_user_period", (q: any) => q.eq("userId", args.userId).eq("period", args.period))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        holdback: args.holdback,
        bookCount: args.bookCount,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("earningsRecords", {
      userId: args.userId,
      period: args.period,
      amount: args.amount,
      holdback: args.holdback,
      bookCount: args.bookCount,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deductBalance = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
  },
  handler: async () => true,
});

export const refundBalance = internalMutation({
  args: { stripeTransferId: v.string() },
  handler: async (ctx, args) => {
    const payout = await ctx.db
      .query("payouts")
      .withIndex("by_stripe_transfer", (q: any) => q.eq("stripeTransferId", args.stripeTransferId))
      .first();
    if (!payout) return false;
    await ctx.db.patch(payout._id, { status: "failed", updatedAt: Date.now() });
    return true;
  },
});

export const releaseHoldbacks = internalMutation({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("earningsRecords")
      .withIndex("by_period", (q: any) => q.eq("period", args.period))
      .take(500);
    let released = 0;
    for (const record of records) {
      if (record.holdback > 0) {
        await ctx.db.patch(record._id, {
          amount: record.amount + record.holdback,
          holdback: 0,
          status: "released",
          updatedAt: Date.now(),
        });
        released++;
      }
    }
    return released;
  },
});

export const getSalesHistory = query({
  args: {
    userId: v.optional(v.string()),
    bookId: v.optional(v.id("books")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    if (args.bookId) {
      return await ctx.db
        .query("salesRecords")
        .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("salesRecords")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getPayoutHistory = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    return await ctx.db
      .query("payouts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getPayoutAccounts = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    return await ctx.db
      .query("payoutAccounts")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
  },
});

export const savePayoutAccount = mutation({
  args: {
    userId: v.optional(v.string()),
    method: v.union(v.literal("stripe"), v.literal("payoneer"), v.literal("bank_transfer")),
    isDefault: v.optional(v.boolean()),
    stripeConnectAccountId: v.optional(v.string()),
    stripeOnboardingComplete: v.optional(v.boolean()),
    payoneerAccountEmail: v.optional(v.string()),
    payoneerPayeeId: v.optional(v.string()),
    bankDetails: v.optional(v.object({
      accountHolder: v.string(),
      bankName: v.string(),
      lastFourDigits: v.string(),
      country: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    const { userId: _u, ...data } = args;

    const existing = await ctx.db
      .query("payoutAccounts")
      .withIndex("by_user_method", (q: any) => q.eq("userId", userId).eq("method", args.method))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...data, updatedAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("payoutAccounts", {
      userId,
      ...data,
      isDefault: data.isDefault ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const requestPayout = mutation({
  args: {
    userId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    method: v.union(v.literal("stripe"), v.literal("payoneer"), v.literal("bank_transfer")),
    periodStart: v.string(),
    periodEnd: v.string(),
    bookBreakdown: v.optional(v.array(v.object({
      bookId: v.string(),
      bookTitle: v.string(),
      amount: v.number(),
      unitsSold: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx, args.userId);
    if (args.amount < 10) throw new Error("Minimum payout amount is $10");

    const { userId: _u, ...rest } = args;
    return await ctx.db.insert("payouts", {
      userId,
      ...rest,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const recordSale = mutation({
  args: {
    bookId: v.id("books"),
    userId: v.string(),
    channel: v.string(),
    period: v.string(),
    unitsSold: v.number(),
    grossRevenue: v.number(),
    netRevenue: v.number(),
    royaltyAmount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, ...rest } = args;
    const id = await ctx.db.insert("salesRecords", {
      userId,
      ...rest,
      month: args.period,
      recordedAt: Date.now(),
    });
    const book = await ctx.db.get(args.bookId);
    if (book) {
      await ctx.db.patch(args.bookId, {
        salesCount: (book.salesCount || 0) + args.unitsSold,
        totalEarnings: (book.totalEarnings || 0) + args.royaltyAmount,
        updatedAt: Date.now(),
      });
    }
    return id;
  },
});
