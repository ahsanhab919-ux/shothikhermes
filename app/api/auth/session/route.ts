import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user?._id) {
    return Response.json(
      {
        error: "Authentication required",
      },
      { status: 401 },
    );
  }

  return Response.json({ user });
}
