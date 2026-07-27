import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { decodeJwt } from "jose";

function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function getConvexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
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
    const convex = getConvexClient();
    if (!razorpay || !convex) {
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpaySecret) {
      return NextResponse.json({ error: "Razorpay is not configured" }, { status: 503 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      logger.error("Razorpay signature verification failed", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes as Record<string, string>;
    const orderUserId = notes?.userId;
    const creditAmount = parseInt(notes?.creditAmount || "0", 10);

    if (!orderUserId || creditAmount <= 0) {
      logger.error("Invalid order notes", {
        orderId: razorpay_order_id,
        notes,
      });
      return NextResponse.json(
        { error: "Invalid order data" },
        { status: 400 }
      );
    }

    if (orderUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await convex.mutation(api.credits.creditPurchase, {
      userId: orderUserId,
      amount: creditAmount,
      stripePaymentId: `razorpay_${razorpay_payment_id}`,
      webhookSecret: process.env.CREDIT_PURCHASE_SECRET || "",
    });

    logger.info("Credits credited via Razorpay", {
      userId: orderUserId,
      credits: creditAmount,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      packId,
      alreadyCredited: result.alreadyCredited ?? false,
    });

    return NextResponse.json({
      success: true,
      credits: creditAmount,
    });
  } catch (error) {
    logger.error("Razorpay verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
