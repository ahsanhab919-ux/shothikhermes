import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  withApiProtection,
  type AuthenticatedUser,
} from "@/lib/api-middleware";
import logger from "@/lib/logger";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function handlePortal(
  _req: NextRequest,
  user: AuthenticatedUser | null,
) {
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const subscription = await convex.query(
    api.subscriptions.getUserSubscription,
    { userId: user.userId },
  );

  const stripeCustomerId = subscription?.stripeCustomerId;
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 },
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/account/billing`,
  });

  return NextResponse.json({ portalUrl: portalSession.url });
}

export const POST = withApiProtection(handlePortal, { requireAuth: true });
