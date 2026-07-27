import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { decodeJwt } from "jose";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = decodeJwt(token);
    const sub = payload.sub || (payload as Record<string, unknown>).userId;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authenticatedUserId = getUserIdFromToken(token);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
    }

    if (userId !== authenticatedUserId) {
      logger.warn("Stripe Connect userId mismatch", {
        tokenUserId: authenticatedUserId,
        bodyUserId: userId,
      });
      return NextResponse.json(
        { error: "Forbidden: userId does not match authenticated user" },
        { status: 403 }
      );
    }

    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: { transfers: { requested: true } },
      business_type: "individual",
      metadata: { userId: authenticatedUserId, platform: "shothik" },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payouts/onboarding?success=true`,
      type: "account_onboarding",
    });

    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        const convex = new ConvexHttpClient(convexUrl);
        convex.setAuth(token);
        await convex.mutation(api.earnings.savePayoutAccount, {
          method: "stripe",
          isDefault: true,
          stripeConnectAccountId: account.id,
          stripeOnboardingComplete: false,
        });
      }
    } catch (e) {
      logger.warn("Failed to persist Stripe Connect account to Convex", {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (error) {
    logger.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Failed to create Connect account" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID required" },
        { status: 400 }
      );
    }

    const authenticatedUserId = getUserIdFromToken(token);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const account = await stripe.accounts.retrieve(accountId);
    if ((account as any).deleted) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if ((account as any).metadata?.userId && (account as any).metadata.userId !== authenticatedUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        const convex = new ConvexHttpClient(convexUrl);
        convex.setAuth(token);
        await convex.mutation(api.earnings.savePayoutAccount, {
          method: "stripe",
          isDefault: true,
          stripeConnectAccountId: account.id,
          stripeOnboardingComplete: Boolean((account as any).payouts_enabled),
        });
      }
    } catch (e) {
      logger.warn("Failed to sync Stripe Connect status to Convex", {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    return NextResponse.json({
      accountId: account.id,
      payoutsEnabled: (account as any).payouts_enabled,
      chargesEnabled: (account as any).charges_enabled,
      requirements: (account as any).requirements?.currently_due || [],
    });
  } catch (error) {
    logger.error("Stripe account status error:", error);
    return NextResponse.json(
      { error: "Failed to get account status" },
      { status: 500 }
    );
  }
}
