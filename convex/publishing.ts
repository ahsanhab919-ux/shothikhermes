import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createDistributionRecord = mutation({
  args: {
    bookId: v.string(),
    userId: v.string(),
    jobId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    publishDriveBookId: v.optional(v.string()),
    channels: v.optional(v.array(v.object({
      channelId: v.string(),
      channelName: v.string(),
      status: v.string(),
      url: v.optional(v.string()),
      updatedAt: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("distributions")
      .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        jobId: args.jobId,
        publishDriveBookId: args.publishDriveBookId ?? existing.publishDriveBookId,
        channels: args.channels ?? existing.channels,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("distributions", {
      bookId: args.bookId,
      userId: args.userId,
      jobId: args.jobId,
      status: args.status,
      publishDriveBookId: args.publishDriveBookId,
      channels: args.channels ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getDistributionByBook = query({
  args: { bookId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distributions")
      .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
      .first();
  },
});

export const getDistributionRecord = query({
  args: {
    bookId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const record = await ctx.db
      .query("distributions")
      .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
      .first();
    if (!record) return null;
    const callerId = identity?.subject || args.userId;
    if (callerId && record.userId !== callerId) return null;
    return record;
  },
});

export const getDistributionByPdId = query({
  args: { publishDriveBookId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distributions")
      .withIndex("by_pd_book", (q: any) => q.eq("publishDriveBookId", args.publishDriveBookId))
      .first();
  },
});

export const getDistributionRecordByPdId = query({
  args: { publishDriveBookId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distributions")
      .withIndex("by_pd_book", (q: any) => q.eq("publishDriveBookId", args.publishDriveBookId))
      .first();
  },
});

export const getDistributionByJobId = query({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distributions")
      .withIndex("by_job", (q: any) => q.eq("jobId", args.jobId))
      .first();
  },
});

export const updateDistributionStatus = mutation({
  args: {
    distributionId: v.optional(v.id("distributions")),
    publishDriveBookId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    channels: v.optional(v.array(v.object({
      channelId: v.string(),
      channelName: v.string(),
      status: v.string(),
      url: v.optional(v.string()),
      updatedAt: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    let docId = args.distributionId;

    if (!docId && args.publishDriveBookId) {
      const record = await ctx.db
        .query("distributions")
        .withIndex("by_pd_book", (q: any) => q.eq("publishDriveBookId", args.publishDriveBookId))
        .first();
      if (!record) throw new Error("Distribution record not found");
      docId = record._id;
    }

    if (!docId) throw new Error("Either distributionId or publishDriveBookId is required");

    const patch: Record<string, unknown> = { status: args.status, updatedAt: Date.now() };
    if (args.channels) patch.channels = args.channels;
    await ctx.db.patch(docId, patch);
  },
});

export const updateByJobId = mutation({
  args: {
    jobId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    publishDriveBookId: v.optional(v.string()),
    channels: v.optional(v.array(v.object({
      channelId: v.string(),
      channelName: v.string(),
      status: v.string(),
      url: v.optional(v.string()),
      updatedAt: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const dist = await ctx.db
      .query("distributions")
      .withIndex("by_job", (q: any) => q.eq("jobId", args.jobId))
      .first();
    if (!dist) throw new Error("Distribution record not found");
    const patch: Record<string, unknown> = { status: args.status, updatedAt: Date.now() };
    if (args.publishDriveBookId) patch.publishDriveBookId = args.publishDriveBookId;
    if (args.channels) patch.channels = args.channels;
    await ctx.db.patch(dist._id, patch);
  },
});

export const listUserDistributions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distributions")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

function encryptTaxId(taxId: string): string {
  return Buffer.from(taxId).toString("base64");
}

function decryptTaxId(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export const recordSale = mutation({
  args: {
    bookId: v.union(v.id("books"), v.string()),
    userId: v.string(),
    channelId: v.string(),
    channelName: v.string(),
    saleDate: v.number(),
    salePrice: v.number(),
    currency: v.string(),
    channelCommission: v.number(),
    authorRoyalty: v.number(),
    publishDriveSaleId: v.optional(v.string()),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const bookId = args.bookId as any;
    return await ctx.db.insert("salesRecords", {
      bookId,
      userId: args.userId,
      channel: args.channelName,
      period: args.month,
      month: args.month,
      unitsSold: 1,
      grossRevenue: args.salePrice,
      netRevenue: Math.max(0, args.salePrice - args.channelCommission),
      royaltyAmount: args.authorRoyalty,
      currency: args.currency,
      recordedAt: args.saleDate,
    });
  },
});

export const getSalesForBook = query({
  args: { bookId: v.union(v.id("books"), v.string()), userId: v.string() },
  handler: async (ctx, args) => {
    const bookId = args.bookId as any;
    return await ctx.db
      .query("salesRecords")
      .withIndex("by_book", (q: any) => q.eq("bookId", bookId))
      .filter((q: any) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(100);
  },
});

export const getSalesForMonth = query({
  args: { userId: v.string(), month: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesRecords")
      .withIndex("by_user_and_month", (q: any) =>
        q.eq("userId", args.userId).eq("month", args.month),
      )
      .order("desc")
      .collect();
  },
});

export const saveTaxInfo = mutation({
  args: {
    userId: v.string(),
    formType: v.string(),
    country: v.string(),
    taxId: v.string(),
    legalName: v.string(),
    address: v.string(),
    city: v.string(),
    postalCode: v.string(),
    treatyBenefit: v.optional(v.boolean()),
    treatyCountry: v.optional(v.string()),
    withholdingRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("authorTaxInfo")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const data = {
      userId: args.userId,
      formType: args.formType,
      country: args.country,
      taxId: encryptTaxId(args.taxId),
      legalName: args.legalName,
      address: args.address,
      city: args.city,
      postalCode: args.postalCode,
      treatyBenefit: args.treatyBenefit,
      treatyCountry: args.treatyCountry,
      withholdingRate: args.withholdingRate,
      certifiedAt: now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("authorTaxInfo", data);
  },
});

export const getTaxInfo = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("authorTaxInfo")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!record) return null;
    const decrypted = decryptTaxId(record.taxId);
    const masked = decrypted.replace(/.(?=.{4})/g, "*");
    return { ...record, taxId: masked };
  },
});

export const checkPayoutEligibility = query({
  args: {
    userId: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const MINIMUM_PAYOUT_USD = 25;
    if (args.currency.toUpperCase() === "USD" && args.amount < MINIMUM_PAYOUT_USD) {
      return {
        eligible: false,
        error: `Minimum payout is $${MINIMUM_PAYOUT_USD} USD. Your requested amount is $${args.amount.toFixed(2)}.`,
        availableBalance: 0,
      };
    }

    const sales = await ctx.db
      .query("salesRecords")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    const totalRoyalties = sales.reduce((sum: number, s: any) => sum + (s.royaltyAmount ?? 0), 0);

    const completedOrProcessing = await ctx.db
      .query("payouts")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) =>
        q.or(q.eq(q.field("status"), "completed"), q.eq(q.field("status"), "processing")),
      )
      .collect();

    const totalPaidOut = completedOrProcessing.reduce((sum: number, p: any) => sum + p.amount, 0);
    const available = Math.max(0, totalRoyalties - totalPaidOut);

    if (args.amount > available) {
      return {
        eligible: false,
        error: `Insufficient balance. Available: $${available.toFixed(2)}, Requested: $${args.amount.toFixed(2)}.`,
        availableBalance: available,
      };
    }

    return { eligible: true, availableBalance: available };
  },
});
