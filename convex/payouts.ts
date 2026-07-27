import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const recordStripeTransfer = mutation({
  args: {
    userId: v.string(),
    stripeTransferId: v.string(),
    amount: v.number(),
    currency: v.string(),
    estimatedArrival: v.optional(v.number()),
    periodStart: v.string(),
    periodEnd: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payouts", {
      userId: args.userId,
      amount: args.amount,
      currency: args.currency,
      status: "completed",
      method: "stripe",
      stripePayoutId: args.stripeTransferId,
      stripeTransferId: args.stripeTransferId,
      processedAt: Date.now(),
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
