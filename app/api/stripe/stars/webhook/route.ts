import { NextRequest } from "next/server";
import { POST as creditsWebhook } from "@/app/api/stripe/credits/webhook/route";

export async function POST(req: NextRequest) {
  return creditsWebhook(req, {});
}
