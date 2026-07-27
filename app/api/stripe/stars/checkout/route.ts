import { NextRequest } from "next/server";
import { POST as creditsCheckout } from "@/app/api/stripe/credits/checkout/route";

export async function POST(req: NextRequest) {
  return creditsCheckout(req);
}
