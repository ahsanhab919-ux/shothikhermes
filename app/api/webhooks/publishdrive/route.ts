import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createHmac, timingSafeEqual } from "crypto";
import { defineRoute, z } from "@/lib/api-validation";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const WEBHOOK_SECRET = process.env.PUBLISHDRIVE_WEBHOOK_SECRET || "";

function verifySignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  try {
    const expected = createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    const sigBuf = Buffer.from(signature.replace(/^sha256=/, ""));
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export const POST = defineRoute({
  method: "post",
  path: "/api/webhooks/publishdrive",
  summary: "PublishDrive Webhook",
  description: "Handles book distribution status updates from PublishDrive.",
  tags: ["Webhooks"],
  config: {
    rateLimit: { requests: 50, windowMs: 60000 },
    requireAuth: false, // Relies on HMAC signature
  },
  schemas: {
    response: z.object({
      received: z.boolean().optional(),
      error: z.string().optional(),
    }),
  },
  handler: async ({ req }) => {
    const rawBody = await req.text();
    const signature = req.headers.get("x-publishdrive-signature") || "";

    if (WEBHOOK_SECRET) {
      if (!verifySignature(rawBody, signature)) {
        logger.warn("PublishDrive webhook: invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { event, book_id: publishDriveBookId } = payload;

    if (!publishDriveBookId) {
      return NextResponse.json({ error: "Missing book_id" }, { status: 400 });
    }

    const record = await convex.query(api.publishing.getDistributionRecordByPdId, {
      publishDriveBookId,
    });

    if (!record) {
      logger.warn(`PublishDrive webhook: no record found for book_id=${publishDriveBookId}`);
      return NextResponse.json({ received: true });
    }

    try {
      switch (event) {
        case "book.channel.live":
        case "book.channel.failed":
        case "book.channel.removed": {
          const channelUpdates = payload.channels ||
            (payload.channel ? [payload.channel] : []);

          if (channelUpdates.length === 0) {
            return NextResponse.json({ received: true });
          }

          const statusMap: Record<string, { status: string; url?: string }> = {};
          for (const ch of channelUpdates) {
            statusMap[ch.id] = { status: ch.status, url: ch.url };
          }

          const existingChannels: Array<{
            channelId: string;
            channelName: string;
            status: string;
            url?: string;
            updatedAt: number;
          }> = record.channels || [];

          const updatedChannels = existingChannels.map((ch) => {
            if (statusMap[ch.channelId]) {
              return {
                ...ch,
                status: statusMap[ch.channelId].status,
                url: statusMap[ch.channelId].url || ch.url,
                updatedAt: Date.now(),
              };
            }
            return ch;
          });

          const allLive = updatedChannels.length > 0 &&
            updatedChannels.every((ch) => ch.status === "live" || ch.status === "removed");
          const anyFailed = updatedChannels.some((ch) => ch.status === "failed");
          const overallStatus = allLive ? "completed" : anyFailed ? "failed" : "processing";

          await convex.mutation(api.publishing.updateDistributionStatus, {
            publishDriveBookId,
            status: overallStatus,
            channels: updatedChannels,
          });

          const liveChannels = updatedChannels.filter((ch) => ch.status === "live");

          if (liveChannels.length > 0) {
            const channelNames = liveChannels.slice(0, 3).map((ch) => ch.channelName).join(", ");
            const more = liveChannels.length > 3 ? ` and ${liveChannels.length - 3} more` : "";

            await convex.mutation(api.notifications.createPublicNotification, {
              userId: record.userId,
              type: "book_distribution_update",
              title: allLive ? "Your book is live!" : "Distribution update",
              message: allLive
                ? `Your book is now live on ${channelNames}${more}.`
                : `Distribution update: now live on ${channelNames}${more}.`,
              data: {
                bookId: record.bookId,
                publishDriveBookId,
                liveCount: liveChannels.length,
              },
            });
          }

          const failedChannels = updatedChannels.filter((ch) => ch.status === "failed");
          if (failedChannels.length > 0) {
            const failedNames = failedChannels.slice(0, 3).map((ch) => ch.channelName).join(", ");
            await convex.mutation(api.notifications.createPublicNotification, {
              userId: record.userId,
              type: "book_distribution_failed",
              title: "Distribution issue",
              message: `Distribution failed on ${failedNames}. You can retry from your book's distribution panel.`,
              data: {
                bookId: record.bookId,
                publishDriveBookId,
                failedChannels: failedChannels.map((ch) => ch.channelId),
              },
            });
          }

          logger.info(
            `PublishDrive webhook: ${event} for book ${publishDriveBookId}, ` +
            `updated ${channelUpdates.length} channels, overall=${overallStatus}`
          );
          break;
        }

        default:
          logger.info(`PublishDrive webhook: unhandled event type '${event}'`);
      }
    } catch (err) {
      logger.error("PublishDrive webhook processing error:", err);
      return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }
});
