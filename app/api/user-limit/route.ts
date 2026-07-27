import { defineRoute, z } from "@/lib/api-validation";
import { NextResponse } from "next/server";

export const GET = defineRoute({
  method: "get",
  path: "/api/user-limit",
  summary: "Get User Limits",
  description: "Returns the word limit and remaining balance for the current user.",
  tags: ["User"],
  config: {
    rateLimit: { requests: 60, windowMs: 60000 },
    requireAuth: false, // Currently mock, so auth false
  },
  schemas: {
    response: z.object({
      totalWordLimit: z.number().nullable().openapi({ example: null }),
      remainingWord: z.number().nullable().openapi({ example: null }),
      unlimited: z.boolean().openapi({ example: true }),
    }),
  },
  handler: async () => {
    return NextResponse.json({
      totalWordLimit: null,
      remainingWord: null,
      unlimited: true,
    });
  },
});
