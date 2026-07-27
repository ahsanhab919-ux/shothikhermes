import { NextRequest } from "next/server";

import { getChatSyncSnapshotForUser } from "@/lib/chat/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import type { ChatSurface } from "@/lib/chat/types";

function unauthorized() {
  return Response.json(
    {
      error: "Authentication required",
      code: "INSFORGE_SESSION_REQUIRED",
      message: "Please sign in again to continue using chat.",
    },
    { status: 401 },
  );
}

export async function GET(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const sinceValue = Number(searchParams.get("since") ?? "0");
    const conversationLimit = Number(searchParams.get("conversationLimit") ?? "");
    const messageLimit = Number(searchParams.get("messageLimit") ?? "");
    const surface = searchParams.get("surface") as ChatSurface | null;

    const snapshot = await getChatSyncSnapshotForUser({
      userId: String(user._id),
      since: Number.isFinite(sinceValue) ? sinceValue : 0,
      ...(surface ? { surface } : {}),
      ...(Number.isFinite(conversationLimit) ? { conversationLimit } : {}),
      ...(Number.isFinite(messageLimit) ? { messageLimit } : {}),
    });

    return Response.json({ data: snapshot });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to build chat sync snapshot.";
    return Response.json(
      {
        error: "Unable to build chat sync snapshot.",
        code: "CHAT_SYNC_FAILED",
        message,
      },
      { status: 500 },
    );
  }
}
