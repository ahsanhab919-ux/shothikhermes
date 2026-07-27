import { NextRequest } from "next/server";
import { listMessagesForConversation } from "@/lib/chat/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) {
    return Response.json(
      {
        error: "Authentication required",
        code: "INSFORGE_SESSION_REQUIRED",
        message: "Please sign in again to continue using chat.",
      },
      { status: 401 },
    );
  }

  const { conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const limitValue = Number(searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitValue) ? limitValue : undefined;

  try {
    const messages = await listMessagesForConversation({
      conversationId,
      userId: String(user._id),
      ...(typeof limit === "number" ? { limit } : {}),
    });
    return Response.json({ data: messages });
  } catch {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
}
