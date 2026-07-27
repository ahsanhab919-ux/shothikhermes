import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import {
  createPersistedConversation,
  listConversationsForUser,
} from "@/lib/chat/server";
import type { ChatSurface, ConversationStatus } from "@/lib/chat/types";

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

function persistenceUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : "Chat persistence is unavailable.";
  const isConvexPermissionError =
    message.includes("runInternalQueries") ||
    message.includes("runInternalMutations") ||
    message.includes("actAsUser");

  return Response.json(
    {
      error: isConvexPermissionError
        ? "Chat persistence is unavailable for this deployment."
        : "Unable to load chat conversations.",
      code: isConvexPermissionError
        ? "CHAT_PERSISTENCE_UNAVAILABLE"
        : "CHAT_CONVERSATIONS_FAILED",
      message,
    },
    { status: isConvexPermissionError ? 503 : 500 },
  );
}

export async function GET(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const surface = searchParams.get("surface") as ChatSurface | null;
    const status = searchParams.get("status") as ConversationStatus | null;
    const includeTemporary = searchParams.get("includeTemporary") === "true";
    const query = searchParams.get("query")?.trim();
    const limitValue = Number(searchParams.get("limit") ?? "");
    const limit = Number.isFinite(limitValue) ? limitValue : undefined;

    const conversations = await listConversationsForUser({
      userId: String(user._id),
      ...(surface ? { surface } : {}),
      ...(status ? { status } : {}),
      includeTemporary,
      ...(typeof limit === "number" ? { limit } : {}),
      ...(query ? { query } : {}),
    });

    return Response.json({ data: conversations });
  } catch (error) {
    return persistenceUnavailable(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  try {
    const body = await request.json();
    const conversation = await createPersistedConversation({
      userId: String(user._id),
      surface: body.surface,
      title: body.title,
      modelHandle: body.modelHandle,
      temporary: body.temporary,
      contextRef: body.contextRef,
    });

    return Response.json({ data: conversation });
  } catch (error) {
    return persistenceUnavailable(error);
  }
}
