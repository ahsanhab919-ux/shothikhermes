import { defineRoute, z } from "@/lib/api-validation";
import { NextResponse } from "next/server";

export const GET = defineRoute({
  method: "get",
  path: "/api/health-check",
  summary: "Health Check API",
  description: "Returns the health status of the API",
  tags: ["System"],
  schemas: {
    response: z.object({
      status: z.string().openapi({ example: "ok" }),
      timestamp: z.string().openapi({ example: "2026-03-02T12:00:00Z" }),
    }),
  },
  handler: async () => {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  },
});
