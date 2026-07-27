import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthToken } from "@/lib/auth";
import { checkIdempotency, storeIdempotency, markIdempotencyPending } from "@/lib/security/idempotency";
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

    const body = await req.json();
    const { userId, amount, currency = "usd", stripeAccountId, periodStart, periodEnd } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (userId !== authenticatedUserId) {
      logger.warn("Payout userId mismatch", {
        tokenUserId: authenticatedUserId,
        bodyUserId: userId,
      });
      return NextResponse.json(
        { error: "Forbidden: userId does not match authenticated user" },
        { status: 403 }
      );
    }

    if (!amount || typeof amount !== "number" || amount < 2500) {
      return NextResponse.json(
        { error: "Minimum payout is $25" },
        { status: 400 }
      );
    }

    const idempotencyKey = req.headers.get("idempotency-key");
    if (idempotencyKey) {
      const existing = await checkIdempotency(idempotencyKey, authenticatedUserId, "payout");
      if (existing?.status === "completed") {
        return NextResponse.json(existing.response, {
          headers: { "Idempotency-Replay": "true" },
        });
      }
      if (existing?.status === "pending") {
        return NextResponse.json(
          { error: "Payout already in progress" },
          { status: 409 }
        );
      }
      await markIdempotencyPending(idempotencyKey, authenticatedUserId, "payout");
    }

    let resolvedStripeAccountId: string | null = typeof stripeAccountId === "string" ? stripeAccountId : null;
    if (!resolvedStripeAccountId) {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        try {
          const convex = new ConvexHttpClient(convexUrl);
          convex.setAuth(token);
          const accounts = await convex.query(api.earnings.getPayoutAccounts, {});
          const stripeAccounts = (accounts ?? []).filter((a: any) => a.method === "stripe" && typeof a.stripeConnectAccountId === "string");
          const preferred = stripeAccounts.find((a: any) => a.isDefault) ?? stripeAccounts[0];
          resolvedStripeAccountId = preferred?.stripeConnectAccountId ?? null;
        } catch (e) {
          logger.warn("Failed to resolve Stripe Connect account from Convex", {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    if (!resolvedStripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected. Complete onboarding first." },
        { status: 400 }
      );
    }

    const account = await stripe.accounts.retrieve(resolvedStripeAccountId);
    if ((account as any).deleted) {
      return NextResponse.json(
        { error: "Stripe account not found" },
        { status: 404 }
      );
    }
    if ((account as any).metadata?.userId && (account as any).metadata.userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: "Forbidden: Stripe account does not belong to authenticated user" },
        { status: 403 }
      );
    }
    if (!(account as any).payouts_enabled) {
      return NextResponse.json(
        { error: "Payouts not enabled for this account" },
        { status: 400 }
      );
    }

    const transfer = (await stripe.transfers.create({
      amount,
      currency: currency.toLowerCase(),
      destination: resolvedStripeAccountId,
      description: `Shothik royalty payout`,
      metadata: { userId: authenticatedUserId, platform: "shothik" },
    })) as unknown as Stripe.Transfer;

    const estimatedArrival = Date.now() + 2 * 24 * 60 * 60 * 1000;

    const responseBody = {
      transferId: transfer.id,
      status: (transfer as any).status,
      amount: transfer.amount,
      currency: transfer.currency,
      estimatedArrival,
    };

    const now = new Date();
    const computedPeriodStart = typeof periodStart === "string" && periodStart.length > 0
      ? periodStart
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const computedPeriodEnd = typeof periodEnd === "string" && periodEnd.length > 0
      ? periodEnd
      : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        const convex = new ConvexHttpClient(convexUrl);
        await convex.mutation(api.payouts.recordStripeTransfer, {
          userId: authenticatedUserId,
          stripeTransferId: transfer.id,
          amount: transfer.amount,
          currency: transfer.currency,
          estimatedArrival,
          periodStart: computedPeriodStart,
          periodEnd: computedPeriodEnd,
        });
      }
    } catch (e) {
      logger.warn("Failed to record payout to Convex", { error: e instanceof Error ? e.message : String(e) });
    }

    if (idempotencyKey) {
      await storeIdempotency(idempotencyKey, authenticatedUserId, "payout", responseBody);
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    logger.error("Payout error:", error);
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
