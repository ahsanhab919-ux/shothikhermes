import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  withApiProtection,
  type AuthenticatedUser,
} from "@/lib/api-middleware";
import logger from "@/lib/logger";
import {
  SUBSCRIPTION_TIERS,
  getStripePriceId,
  type SubscriptionTier,
  type CurrencyCode,
} from "@/lib/subscription-tiers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function handleCheckout(
  req: NextRequest,
  user: AuthenticatedUser | null,
) {
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = await req.json();
  const {
    tier,
    interval = "month",
    currency = "usd",
  } = body as {
    tier: SubscriptionTier;
    interval?: "month" | "year";
    currency?: CurrencyCode;
  };

  const validTiers: SubscriptionTier[] = ["student", "researcher", "pro"];
  if (!tier || !validTiers.includes(tier)) {
    return NextResponse.json(
      { error: "Invalid subscription tier" },
      { status: 400 },
    );
  }

  const validIntervals = ["month", "year"];
  if (!validIntervals.includes(interval)) {
    return NextResponse.json(
      { error: "Invalid billing interval" },
      { status: 400 },
    );
  }

  const validCurrencies: CurrencyCode[] = ["usd", "bdt", "inr"];
  if (!validCurrencies.includes(currency)) {
    return NextResponse.json(
      { error: "Invalid currency" },
      { status: 400 },
    );
  }

  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const configuredPriceId = getStripePriceId(tier, currency, interval);

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

  if (configuredPriceId) {
    lineItems = [{ price: configuredPriceId, quantity: 1 }];
  } else {
    const priceAmount =
      interval === "year"
        ? tierConfig.pricing[currency].yearly
        : tierConfig.pricing[currency].monthly;

    if (priceAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid pricing configuration" },
        { status: 500 },
      );
    }

    const stripeCurrency =
      currency === "bdt" ? "bdt" : currency === "inr" ? "inr" : "usd";

    logger.warn("Using inline price_data for checkout — configure STRIPE_PRICE_* env vars for production", {
      tier, currency, interval,
    });

    lineItems = [
      {
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: `Shothik AI ${tierConfig.name} Plan`,
            description: tierConfig.description,
          },
          unit_amount: priceAmount,
          recurring: { interval },
        },
        quantity: 1,
      },
    ];
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "subscription",
    metadata: {
      userId: user.userId,
      tier,
      interval,
      currency,
      platform: "shothik",
      type: "subscription",
    },
    customer_email: user.email || undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/account/billing?subscription=success&tier=${tier}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/account/billing?subscription=cancelled`,
    subscription_data: {
      metadata: {
        userId: user.userId,
        tier,
        currency,
      },
    },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}

export const POST = withApiProtection(handleCheckout, { requireAuth: true });
