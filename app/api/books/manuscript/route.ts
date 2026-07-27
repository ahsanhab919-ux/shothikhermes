import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const bookId = req.nextUrl.searchParams.get("bookId");
    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);

    const result = await convex.query(api.books.getManuscriptUrl, {
      bookId: bookId as any,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("Manuscript download error:", error);
    return NextResponse.json(
      { error: error.message || "Download failed" },
      { status: 403 }
    );
  }
}
