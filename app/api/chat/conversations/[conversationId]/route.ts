import { NextRequest } from "next/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";
import {
  getConversationForUser,
  softDeleteConversationForUser,
  updateConversationForUser,
} from "@/lib/chat/server";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { conversationId } = await params;
  try {
    const conversation = await getConversationForUser(conversationId, String(user._id));
    return Response.json({ data: conversation });
  } catch {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { conversationId } = await params;
  const body = await request.json();

  try {
    const conversation = await updateConversationForUser({
      conversationId,
      userId: String(user._id),
      title: body.title,
      pinned: body.pinned,
      archived: body.archived,
    });
    return Response.json({ data: conversation });
  } catch {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getChatAuthenticatedUser();
  if (!user?._id) return unauthorized();

  const { conversationId } = await params;
  try {
    const result = await softDeleteConversationForUser(conversationId, String(user._id));
    return Response.json({ data: result });
  } catch {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }
}
