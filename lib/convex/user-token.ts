import { ConvexHttpClient } from "convex/browser";
import { SignJWT, importPKCS8 } from "jose";
import {
  diagnoseConvexJwtConfig,
  getConvexSiteUrl,
} from "@/lib/convex/auth-diagnostics";
import {
  CONVEX_APPLICATION_ID,
  CONVEX_JWT_KID,
} from "@/lib/convex/jwt-config";

export interface ConvexAuthUser {
  _id: string;
  email?: string;
  name?: string;
}

let cachedPrivateKey: CryptoKey | null = null;

async function getPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;

  const pemRaw = process.env.JWT_PRIVATE_KEY;
  if (!pemRaw) {
    throw new Error("JWT_PRIVATE_KEY environment variable is not set");
  }

  let pem = pemRaw.replace(/\\n/g, "\n").trim();
  if (!pem.startsWith("-----BEGIN")) {
    pem = `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`;
  }

  cachedPrivateKey = await importPKCS8(pem, "RS256");
  return cachedPrivateKey;
}

export async function mintConvexUserToken(user: ConvexAuthUser): Promise<string> {
  const diagnostics = diagnoseConvexJwtConfig();
  if (diagnostics.status !== "healthy") {
    throw new Error(diagnostics.message);
  }

  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const siteUrl = getConvexSiteUrl();

  return new SignJWT({
    sub: user._id,
    email: user.email || undefined,
    name: user.name || undefined,
  })
    .setProtectedHeader({
      alg: "RS256",
      kid: CONVEX_JWT_KID,
      typ: "JWT",
    })
    .setIssuer(siteUrl)
    .setAudience(CONVEX_APPLICATION_ID)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
}

export async function createConvexClientForUser(user: ConvexAuthUser) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  }

  const client = new ConvexHttpClient(url);
  client.setAuth(await mintConvexUserToken(user));
  return client;
}
