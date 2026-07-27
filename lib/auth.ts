import { NextRequest } from "next/server";

/**
 * Extract the Bearer token from the Authorization header of a Next.js request.
 * Returns null if the header is missing or malformed.
 */
export function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length >= 10 ? token : null;
}
