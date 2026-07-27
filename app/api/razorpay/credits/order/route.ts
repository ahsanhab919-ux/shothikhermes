import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuthToken } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { decodeJwt } from "jose";
import { CREDIT_PACKS, type PackId } from "@/lib/payment-config";

function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

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
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return NextResponse.json(
        { error: "Razorpay is not configured" },
        { status: 503 },
      );
    }

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

    if (!pack.inr?.amount || pack.inr.amount <= 0) {
      return NextResponse.json({ error: "INR pricing is not configured" }, { status: 500 });
    }

    const order = await razorpay.orders.create({
      amount: pack.inr.amount * 100,
      currency: "INR",
      receipt: `credit_${userId}_${Date.now()}`,
      notes: {
        userId,
        packId,
        creditAmount: String(pack.credits),
        type: "credit_purchase",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    logger.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
