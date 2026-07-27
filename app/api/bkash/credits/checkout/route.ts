import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { decodeJwt } from "jose";
import { createHmac } from "crypto";
import { CREDIT_PACKS, type PackId } from "@/lib/payment-config";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL!;
const BKASH_APP_KEY = process.env.BKASH_APP_KEY!;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET!;
const BKASH_USERNAME = process.env.BKASH_USERNAME!;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD!;

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = decodeJwt(token);
    const sub = payload.sub || (payload as Record<string, unknown>).userId;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

function signCallbackData(userId: string, packId: string, credits: number): string {
  const secret = process.env.CREDIT_PURCHASE_SECRET || process.env.BKASH_APP_SECRET || "";
  const payload = `${userId}|${packId}|${credits}`;
  return createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
}

async function getBkashToken(): Promise<string> {
  const res = await fetch(
    `${BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
      },
      body: JSON.stringify({
        app_key: BKASH_APP_KEY,
        app_secret: BKASH_APP_SECRET,
      }),
    }
  );

  const data = await res.json();
  if (!data.id_token) {
    throw new Error(`bKash token grant failed: ${JSON.stringify(data)}`);
  }
  return data.id_token;
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

    const idToken = await getBkashToken();

    const sig = signCallbackData(userId, packId, pack.credits);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const callbackURL = `${appUrl}/api/bkash/credits/callback?userId=${encodeURIComponent(userId)}&packId=${encodeURIComponent(packId)}&credits=${pack.credits}&sig=${sig}`;
    const merchantInvoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const createRes = await fetch(
      `${BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "X-APP-Key": BKASH_APP_KEY,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: userId,
          callbackURL,
          amount: String(pack.bdt.amount),
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber,
        }),
      }
    );

    const createData = await createRes.json();

    if (!createData.bkashURL) {
      logger.error("bKash payment creation failed", { response: createData });
      return NextResponse.json(
        { error: "Failed to create bKash payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bkashURL: createData.bkashURL });
  } catch (error) {
    logger.error("bKash credit checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create bKash checkout" },
      { status: 500 }
    );
  }
}

export { signCallbackData };
