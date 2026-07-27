import { generateOpenApiSpec } from "@/lib/api-validation";
import { NextResponse } from "next/server";

export async function GET() {
  const spec = generateOpenApiSpec();
  return NextResponse.json(spec);
}
