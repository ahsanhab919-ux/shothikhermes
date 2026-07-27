import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { decodeJwt } from "jose";
import { CREDIT_PACKS, type PackId } from "@/lib/payment-config";

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

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const { packId } = await req.json();
    const pack = CREDIT_PACKS[packId as PackId];

    if (!pack) {
      return NextResponse.json(
        { error: "Invalid pack ID" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: `${pack.credits} Credits for Shothik Agent Hub`,
            },
            unit_amount: pack.usd.cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId,
        packId,
        creditAmount: String(pack.credits),
        platform: "shothik",
        type: "credit_purchase",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/account/settings?section=wallet&credit_purchase=success&credits=${pack.credits}&provider=stripe&pack=${packId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/account/settings?section=wallet&credit_purchase=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    logger.error("Credit checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
