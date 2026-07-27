import { NextResponse } from "next/server";

const JWKS = {
  keys: [
    {
      kty: "RSA",
      n: "1sx2Dz64sIk5ip5rU5_Ft4IuYqziSooeIsvC2iANhe3bwTq76itJWKK41zIGKf9uKqgWJFgNPrvcwuRBvb79UbWpPvZ2t0Hf7O8a0GZTlL4s30B7nQXA8wJOr8yQLhtM4ArYDMqzeij-4hD7Xgjlj-cXcwofXKBprMw-Ixcgawb_Jty_yDxZqFf48_EYIoPBBlSr8wWRELkrvpQYPCQ9GiBGQs-34O34uO3Wj9k_homElc_XEWYA7ijCAjZOoL95h7U2km3E684IWUimkXF8sMjP6NB87W9n80Flu1Ya7iyGm1OAx-R-nSKsOYQPtwJZe9U31UKoTKPUZpXjMbgpEQ",
      e: "AQAB",
      kid: "shothik-convex-1",
      use: "sig",
      alg: "RS256",
    },
  ],
};

export async function GET() {
  return NextResponse.json(JWKS, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
