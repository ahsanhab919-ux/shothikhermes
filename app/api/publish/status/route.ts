import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { decodeJwt } from "jose";
import { getDistributionStatus } from "@/services/publishDriveService";

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
  const token = getAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const callerId = getUserIdFromToken(token);
  if (!callerId) {
    return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  }

  try {
    convex.setAuth(token);

    const distRecord = await convex.query(api.publishing.getDistributionRecord, { bookId });
    if (!distRecord) {
      return NextResponse.json({ error: "No distribution record found" }, { status: 404 });
    }

    if (distRecord.userId !== callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!distRecord.publishDriveBookId) {
      return NextResponse.json({
        success: true,
        status: distRecord.status,
        channels: distRecord.channels || [],
        updatedAt: distRecord.updatedAt,
        source: "local",
      });
    }

    const pdStatus = await getDistributionStatus(distRecord.publishDriveBookId);

    if (!pdStatus.success || !pdStatus.channels || pdStatus.channels.length === 0) {
      return NextResponse.json({
        success: true,
        status: distRecord.status,
        channels: distRecord.channels || [],
        updatedAt: distRecord.updatedAt,
        source: "local",
      });
    }

    const pdChannelMap: Record<string, { status: string; url?: string }> = {};
    for (const ch of pdStatus.channels as Array<{ id: string; status: string; url?: string }>) {
      pdChannelMap[ch.id] = { status: ch.status, url: ch.url };
    }

    const existingChannels: Array<{
      channelId: string;
      channelName: string;
      status: string;
      url?: string;
      updatedAt: number;
    }> = distRecord.channels || [];

    let changed = false;
    const updatedChannels = existingChannels.map((ch) => {
      const pdCh = pdChannelMap[ch.channelId];
      if (pdCh && pdCh.status !== ch.status) {
        changed = true;
        return {
          ...ch,
          status: pdCh.status,
          url: pdCh.url || ch.url,
          updatedAt: Date.now(),
        };
      }
      return ch;
    });

    if (changed) {
      const allLive = updatedChannels.every((ch) => ch.status === "live" || ch.status === "removed");
      const anyFailed = updatedChannels.some((ch) => ch.status === "failed");
      const overallStatus = allLive ? "completed" : anyFailed ? "failed" : "processing";

      await convex.mutation(api.publishing.updateDistributionStatus, {
        publishDriveBookId: distRecord.publishDriveBookId,
        status: overallStatus,
        channels: updatedChannels,
      });

      return NextResponse.json({
        success: true,
        status: overallStatus,
        channels: updatedChannels,
        updatedAt: Date.now(),
        source: "publishdrive",
      });
    }

    return NextResponse.json({
      success: true,
      status: distRecord.status,
      channels: updatedChannels,
      updatedAt: distRecord.updatedAt,
      source: "publishdrive",
    });
  } catch (error) {
    logger.error("Distribution status check error:", error);
    return NextResponse.json({ error: "Failed to check distribution status" }, { status: 500 });
  }
}
