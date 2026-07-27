import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import logger from "@/lib/logger";
import { getTierByStripePriceId } from "@/lib/subscription-tiers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const CONVEX_WEBHOOK_SECRET = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || "";

function resolveTier(subscription: Stripe.Subscription, metadata: Stripe.Metadata | null): string {
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId) {
    const tierFromPrice = getTierByStripePriceId(priceId);
    if (tierFromPrice) return tierFromPrice;
  }
  return metadata?.tier || "free";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const stripeWebhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

  if (!sig || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(
      "Stripe subscription webhook signature verification failed:",
      message,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.type !== "subscription" || !metadata.userId) {
          break;
        }

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) break;

        const subscription = (await stripe.subscriptions.retrieve(
          subscriptionId,
        )) as unknown as Stripe.Subscription;

        const tier = resolveTier(subscription, metadata);
        const interval =
          subscription.items.data[0]?.plan?.interval || "month";
        const currentPeriodStart = Number((subscription as any).current_period_start ?? 0) * 1000;
        const currentPeriodEnd = Number((subscription as any).current_period_end ?? 0) * 1000;

        await convex.mutation(api.subscriptions.upsertSubscription, {
          userId: metadata.userId,
          tier,
          status: subscription.status,
          interval: interval as "month" | "year",
          currentPeriodStart,
          currentPeriodEnd,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price?.id || "",
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          webhookSecret: CONVEX_WEBHOOK_SECRET,
        });

        await convex.mutation(api.subscriptions.updateUserTier, {
          userId: metadata.userId,
          tier,
          expiresAt: currentPeriodEnd,
          webhookSecret: CONVEX_WEBHOOK_SECRET,
        });

        logger.info("Subscription created via webhook", {
          userId: metadata.userId,
          tier,
          subscriptionId: subscription.id,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata;
        const userId = metadata?.userId;

        if (!userId) {
          logger.warn("Subscription updated without userId in metadata", {
            subscriptionId: subscription.id,
          });
          break;
        }

        const tier = resolveTier(subscription, metadata);
        const interval =
          subscription.items.data[0]?.plan?.interval || "month";
        const currentPeriodStart = Number((subscription as any).current_period_start ?? 0) * 1000;
        const currentPeriodEnd = Number((subscription as any).current_period_end ?? 0) * 1000;

        await convex.mutation(api.subscriptions.upsertSubscription, {
          userId,
          tier,
          status: subscription.status,
          interval: interval as "month" | "year",
          currentPeriodStart,
          currentPeriodEnd,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price?.id || "",
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          webhookSecret: CONVEX_WEBHOOK_SECRET,
        });

        const ACTIVE_STATUSES = ["active", "trialing"];
        if (ACTIVE_STATUSES.includes(subscription.status)) {
          await convex.mutation(api.subscriptions.updateUserTier, {
            userId,
            tier,
            expiresAt: currentPeriodEnd,
            webhookSecret: CONVEX_WEBHOOK_SECRET,
          });
        } else {
          await convex.mutation(api.subscriptions.updateUserTier, {
            userId,
            tier: "free",
            webhookSecret: CONVEX_WEBHOOK_SECRET,
          });
        }

        logger.info("Subscription updated via webhook", {
          userId,
          tier,
          status: subscription.status,
          subscriptionId: subscription.id,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadata = subscription.metadata;
        const userId = metadata?.userId;

        if (!userId) {
          logger.warn("Subscription deleted without userId in metadata", {
            subscriptionId: subscription.id,
          });
          break;
        }

        await convex.mutation(api.subscriptions.cancelSubscription, {
          stripeSubscriptionId: subscription.id,
          webhookSecret: CONVEX_WEBHOOK_SECRET,
        });

        await convex.mutation(api.subscriptions.updateUserTier, {
          userId,
          tier: "free",
          webhookSecret: CONVEX_WEBHOOK_SECRET,
        });

        logger.info("Subscription cancelled via webhook", {
          userId,
          subscriptionId: subscription.id,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    logger.error("Error processing subscription webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
