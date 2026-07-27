import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

const PLATFORM_TAKE = 0.30;
const MASTER_TAKE = 0.70;
const REVIEWER_FUND_RATE = 0.40;

export const purchaseBook = mutation({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.status !== "published") throw new Error("Book is not available for purchase");
    if (!book.creditPrice || book.creditPrice <= 0) throw new Error("This book is free");

    if (book.userId === userId) throw new Error("Cannot purchase your own book");

    const existingPurchase = await ctx.db
      .query("contentPurchases")
      .withIndex("by_user_book", (q) =>
        q.eq("userId", userId).eq("bookId", args.bookId)
      )
      .first();
    if (existingPurchase) {
      return { success: true, alreadyPurchased: true };
    }

    const buyerBalance = await ctx.db
      .query("starBalances")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!buyerBalance || buyerBalance.balance < book.creditPrice) {
      throw new Error("Insufficient credit balance");
    }

    const creditAmount = book.creditPrice;
    const masterAmount = Math.floor(creditAmount * MASTER_TAKE);
    const platformAmount = creditAmount - masterAmount;

    await ctx.db.patch(buyerBalance._id, {
      balance: buyerBalance.balance - creditAmount,
      totalSent: buyerBalance.totalSent + creditAmount,
      updatedAt: Date.now(),
    });

    const masterId = book.userId;
    const masterBalance = await ctx.db
      .query("starBalances")
      .withIndex("by_user", (q) => q.eq("userId", masterId))
      .first();

    if (masterBalance) {
      await ctx.db.patch(masterBalance._id, {
        balance: masterBalance.balance + masterAmount,
        totalReceived: masterBalance.totalReceived + masterAmount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("starBalances", {
        userId: masterId,
        balance: masterAmount,
        totalPurchased: 0,
        totalSent: 0,
        totalReceived: masterAmount,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("contentPurchases", {
      userId,
      bookId: args.bookId,
      creditAmount,
      masterAmount,
      platformAmount,
      purchasedAt: Date.now(),
    });

    await ctx.db.insert("starTransactions", {
      userId,
      type: "content_purchase",
      amount: creditAmount,
      referenceId: args.bookId,
      description: `Purchased "${book.title}" for ${creditAmount} Credits`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("starTransactions", {
      userId: masterId,
      type: "content_sale",
      amount: masterAmount,
      referenceId: args.bookId,
      description: `Sale of "${book.title}": ${masterAmount} Credits (70% of ${creditAmount})`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("starTransactions", {
      userId: "platform",
      type: "platform_fee",
      amount: platformAmount,
      referenceId: args.bookId,
      description: `Platform fee: ${platformAmount} Credits (30% of ${creditAmount})`,
      createdAt: Date.now(),
    });

    const fundAmount = Math.floor(platformAmount * REVIEWER_FUND_RATE);
    if (fundAmount > 0) {
      const pools = await ctx.db.query("reviewerFundPool").collect();
      const pool = pools[0];
      if (pool) {
        await ctx.db.patch(pool._id, {
          balance: pool.balance + fundAmount,
          totalAccumulated: pool.totalAccumulated + fundAmount,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("reviewerFundPool", {
          balance: fundAmount,
          totalAccumulated: fundAmount,
          totalDistributed: 0,
          distributionCount: 0,
          updatedAt: Date.now(),
        });
      }
    }

    const updatedSalesCount = (book.salesCount ?? 0) + 1;
    const updatedEarnings = (book.totalEarnings ?? 0) + masterAmount;
    await ctx.db.patch(args.bookId, {
      salesCount: updatedSalesCount,
      totalEarnings: updatedEarnings,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      creditAmount,
      masterReceived: masterAmount,
      platformFee: platformAmount,
      fundContribution: fundAmount,
      newBalance: buyerBalance.balance - creditAmount,
    };
  },
});

export const hasAccess = query({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return { hasAccess: false, isAuthor: false };

    const userId = identity.subject;

    const book = await ctx.db.get(args.bookId);
    if (!book) return { hasAccess: false, isAuthor: false };

    if (book.userId === userId) {
      return { hasAccess: true, isAuthor: true };
    }

    if (!book.creditPrice || book.creditPrice <= 0) {
      return { hasAccess: true, isAuthor: false, isFree: true };
    }

    const purchase = await ctx.db
      .query("contentPurchases")
      .withIndex("by_user_book", (q) =>
        q.eq("userId", userId).eq("bookId", args.bookId)
      )
      .first();

    if (purchase) {
      return {
        hasAccess: true,
        isAuthor: false,
        purchase: {
          creditAmount: purchase.creditAmount,
          purchasedAt: purchase.purchasedAt,
        },
      };
    }

    return { hasAccess: false, isAuthor: false };
  },
});

export const getMyPurchases = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];

    const purchases = await ctx.db
      .query("contentPurchases")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const results = [];
    for (const purchase of purchases) {
      const book = await ctx.db.get(purchase.bookId);
      if (book) {
        const bookCoverUrl = book.coverStorageId ? await ctx.storage.getUrl(book.coverStorageId) : undefined;
        results.push({
          ...purchase,
          bookTitle: book.title,
          bookSubtitle: book.subtitle,
          bookCoverUrl,
          bookAuthor: book.userId,
        });
      }
    }

    return results.sort((a, b) => b.purchasedAt - a.purchasedAt);
  },
});

export const getBookSales = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return { totalSales: 0, totalEarned: 0, books: [] };

    const userId = identity.subject;

    const myBooks = await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const booksWithSales = [];
    let totalSales = 0;
    let totalEarned = 0;

    for (const book of myBooks) {
      const purchases = await ctx.db
        .query("contentPurchases")
        .withIndex("by_book", (q) => q.eq("bookId", book._id))
        .collect();

      const bookEarned = purchases.reduce((sum, p) => sum + p.masterAmount, 0);
      totalSales += purchases.length;
      totalEarned += bookEarned;

      const coverUrl = book.coverStorageId ? await ctx.storage.getUrl(book.coverStorageId) : undefined;
      booksWithSales.push({
        bookId: book._id,
        title: book.title,
        coverUrl,
        creditPrice: book.creditPrice ?? 0,
        salesCount: purchases.length,
        totalEarned: bookEarned,
      });
    }

    return {
      totalSales,
      totalEarned,
      books: booksWithSales.sort((a, b) => b.totalEarned - a.totalEarned),
    };
  },
});

export const setCreditPrice = mutation({
  args: {
    bookId: v.id("books"),
    creditPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.userId !== userId) throw new Error("You can only set prices on your own books");
    if (book.status !== "published") throw new Error("Can only set prices on published books");

    if (args.creditPrice < 0) throw new Error("Price cannot be negative");
    if (args.creditPrice !== Math.floor(args.creditPrice)) throw new Error("Price must be a whole number");

    await ctx.db.patch(args.bookId, {
      creditPrice: args.creditPrice,
      updatedAt: Date.now(),
    });

    return { success: true, creditPrice: args.creditPrice };
  },
});
