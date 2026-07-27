import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import logger from "@/lib/logger";
import { createHmac } from "crypto";
import { CREDIT_PACKS, type PackId, VALID_PACK_IDS } from "@/lib/payment-config";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL!;
const BKASH_APP_KEY = process.env.BKASH_APP_KEY!;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET!;
const BKASH_USERNAME = process.env.BKASH_USERNAME!;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD!;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function verifyCallbackSignature(userId: string, packId: string, credits: number, sig: string): boolean {
  const secret = process.env.CREDIT_PURCHASE_SECRET || process.env.BKASH_APP_SECRET || "";
  const payload = `${userId}|${packId}|${credits}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  return expected === sig;
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

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const cancelUrl = `${appUrl}/account/settings?section=wallet&credit_purchase=cancelled`;
  const searchParams = req.nextUrl.searchParams;

  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const packId = searchParams.get("packId");
  const creditsStr = searchParams.get("credits");
  const sig = searchParams.get("sig");

  if (status !== "success") {
    logger.error("bKash payment not successful", { status, paymentID });
    return NextResponse.redirect(cancelUrl);
  }

  if (!paymentID || !userId || !packId || !creditsStr || !sig) {
    logger.error("bKash callback missing required params", {
      paymentID, userId, packId, creditsStr, sig,
    });
    return NextResponse.redirect(cancelUrl);
  }

  const credits = parseInt(creditsStr, 10);

  if (!verifyCallbackSignature(userId, packId, credits, sig)) {
    logger.error("bKash callback signature verification failed", {
      paymentID, userId, packId, credits,
    });
    return NextResponse.redirect(cancelUrl);
  }

  if (!VALID_PACK_IDS.includes(packId as PackId)) {
    logger.error("bKash callback invalid packId", { packId, paymentID });
    return NextResponse.redirect(cancelUrl);
  }

  const expectedPack = CREDIT_PACKS[packId as PackId];
  if (expectedPack.credits !== credits) {
    logger.error("bKash callback credits mismatch", {
      expected: expectedPack.credits,
      received: credits,
      packId,
      paymentID,
    });
    return NextResponse.redirect(cancelUrl);
  }

  try {
    const idToken = await getBkashToken();

    const executeRes = await fetch(
      `${BKASH_BASE_URL}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "X-APP-Key": BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
      }
    );

    const executeData = await executeRes.json();

    const isCompleted =
      executeData.statusCode === "0000" ||
      executeData.transactionStatus === "Completed";

    if (!isCompleted) {
      logger.error("bKash payment execution failed", {
        response: executeData,
        paymentID,
      });
      return NextResponse.redirect(cancelUrl);
    }

    const executedAmount = parseFloat(executeData.amount || "0");
    if (executedAmount < expectedPack.bdt.amount) {
      logger.error("bKash executed amount mismatch", {
        expected: expectedPack.bdt.amount,
        executed: executedAmount,
        paymentID,
      });
      return NextResponse.redirect(cancelUrl);
    }

    const trxID = executeData.trxID || paymentID;

    await convex.mutation(api.credits.creditPurchase, {
      userId,
      amount: credits,
      stripePaymentId: `bkash_${trxID}`,
      webhookSecret: process.env.CREDIT_PURCHASE_SECRET || "",
    });

    logger.info("bKash credits credited successfully", {
      userId,
      credits,
      trxID,
      packId,
      paymentID,
      executedAmount,
    });

    return NextResponse.redirect(
      `${appUrl}/account/settings?section=wallet&credit_purchase=success&credits=${credits}&provider=bkash&pack=${packId}`
    );
  } catch (error) {
    logger.error("bKash callback processing error:", error);
    return NextResponse.redirect(cancelUrl);
  }
}
