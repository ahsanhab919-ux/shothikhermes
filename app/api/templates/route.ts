import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/writing-studio/templates";

export async function GET() {
  return NextResponse.json(TEMPLATES);
}
