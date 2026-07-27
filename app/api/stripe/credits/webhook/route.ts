import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { defineRoute, z } from "@/lib/api-validation";
import logger from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// We must read the raw body for Stripe signature verification
// so we bypass Zod body validation and read it directly in the handler.
export const POST = defineRoute({
  method: "post",
  path: "/api/stripe/credits/webhook",
  summary: "Stripe Credits Webhook",
  description: "Handles successful checkout sessions to grant credits.",
  tags: ["Webhooks"],
  config: {
    rateLimit: { requests: 50, windowMs: 60000 },
    requireAuth: false, // Stripe uses its own signature verification
  },
  schemas: {
    response: z.object({
      received: z.boolean(),
    }),
  },
  handler: async ({ req }) => {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    const webhookSecret = process.env.STRIPE_CREDITS_WEBHOOK_SECRET || process.env.STRIPE_STARS_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing signature or webhook secret" } },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      logger.error("Stripe webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: { code: "INVALID_SIGNATURE", message: "Invalid signature" } },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (
        (metadata?.type === "credit_purchase" || metadata?.type === "star_purchase") &&
        metadata.userId &&
        (metadata.creditAmount || metadata.starAmount)
      ) {
        const amount = parseInt(metadata.creditAmount || metadata.starAmount || "0", 10);
        const paymentId = (session.payment_intent as string) || session.id;

        if (amount <= 0) {
          logger.error("Invalid credit amount in webhook metadata", {
            sessionId: session.id,
            metadata,
          });
          return NextResponse.json(
            { error: { code: "INVALID_AMOUNT", message: "Invalid credit amount" } },
            { status: 400 }
          );
        }

        try {
          const result = await convex.mutation(api.credits.creditPurchase, {
            userId: metadata.userId,
            amount,
            stripePaymentId: paymentId,
            webhookSecret: process.env.CREDIT_PURCHASE_SECRET || "",
          });

          logger.info("Credits credited via webhook", {
            userId: metadata.userId,
            credits: amount,
            sessionId: session.id,
            paymentIntentId: paymentId,
            packId: metadata.packId,
            alreadyCredited: result.alreadyCredited ?? false,
          });
        } catch (err) {
          logger.error("Failed to credit via webhook", {
            error: err instanceof Error ? err.message : String(err),
            userId: metadata.userId,
            credits: amount,
            sessionId: session.id,
            paymentIntentId: paymentId,
          });
          return NextResponse.json(
            { error: { code: "CREDIT_FAILED", message: "Failed to credit purchase" } },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  }
});
