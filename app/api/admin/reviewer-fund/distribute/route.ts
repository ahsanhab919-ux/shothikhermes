import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { decodeJwt } from "jose";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = decodeJwt(token);
    const sub = payload.sub || (payload as Record<string, unknown>).userId;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
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

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    convex.setAuth(token);

    const [poolStatus, eligibleReviewers] = await Promise.all([
      convex.query(api.reviewerFund.getPoolStatus, {}),
      convex.query(api.reviewerFund.getEligibleReviewers, { limit: 100 }),
    ]);

    const preview = eligibleReviewers.map((r) => ({
      userId: r.userId,
      rank: r.rank,
      sharePercent: r.sharePercent,
      projectedAmount: Math.floor((r.sharePercent / 100) * poolStatus.balance),
      weightedScore: r.weightedScore,
      reviewCount: r.reviewCount,
      helpfulnessScore: r.helpfulnessScore,
      level: r.level,
    }));

    return NextResponse.json({
      poolBalance: poolStatus.balance,
      totalAccumulated: poolStatus.totalAccumulated,
      totalDistributed: poolStatus.totalDistributed,
      distributionCount: poolStatus.distributionCount,
      lastDistributionAt: poolStatus.lastDistributionAt,
      eligibleReviewerCount: eligibleReviewers.length,
      preview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Admin access denied")) {
      return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch distribution preview", details: message },
      { status: 500 }
    );
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
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let periodLabel = body.periodLabel;

    if (!periodLabel || typeof periodLabel !== "string") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      periodLabel = `${year}-${month}`;
    }

    convex.setAuth(token);

    const result = await convex.mutation(api.reviewerFund.distributePool, {
      periodLabel,
    });

    return NextResponse.json({
      success: true,
      periodLabel: result.periodLabel,
      totalDistributed: result.totalDistributed,
      recipientCount: result.recipientCount,
      remainingPool: result.remainingPool,
      distributions: result.distributions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Admin access denied")) {
      return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
    }

    if (message.includes("No funds available")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes("No eligible reviewers")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("No reviewers with positive")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to distribute fund", details: message },
      { status: 500 }
    );
  }
}
