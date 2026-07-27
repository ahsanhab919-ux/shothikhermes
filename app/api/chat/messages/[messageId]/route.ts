import { deleteMessageForUser } from "@/lib/chat/server";
import { getChatAuthenticatedUser } from "@/lib/server-auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> }
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

  const { messageId } = await params;
  try {
    const result = await deleteMessageForUser(messageId, String(user._id));
    return Response.json({ data: result });
  } catch {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }
}
