import crypto from "node:crypto";
import {
  CONVEX_APPLICATION_ID,
  CONVEX_JWT_KID,
  getConfiguredConvexJwtPublicKeyN,
} from "@/lib/convex/jwt-config";

export type ConvexAuthIssueCode =
  | "CONVEX_JWT_PRIVATE_KEY_MISSING"
  | "CONVEX_JWT_PUBLIC_KEY_MISSING"
  | "CONVEX_JWT_PRIVATE_KEY_INVALID"
  | "CONVEX_JWT_KEY_MISMATCH"
  | "CONVEX_SITE_URL_MISSING";

export interface ConvexAuthDiagnostics {
  status: "healthy" | "degraded";
  issueCode?: ConvexAuthIssueCode;
  message: string;
  siteUrl?: string;
  publicKeyConfigured: boolean;
  privateKeyConfigured: boolean;
  keypairMatches: boolean;
}

export function getConvexSiteUrl(): string {
  if (process.env.CONVEX_SITE_URL) {
    return process.env.CONVEX_SITE_URL;
  }

  const cloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
  if (cloudUrl.includes(".convex.cloud")) {
    return cloudUrl.replace(".convex.cloud", ".convex.site");
  }

  throw new Error(
    "CONVEX_SITE_URL is not set and cannot be derived from NEXT_PUBLIC_CONVEX_URL. " +
      "Set CONVEX_SITE_URL in your environment variables.",
  );
}

function readPrivateKeyPem() {
  const pemRaw = process.env.JWT_PRIVATE_KEY;
  if (!pemRaw) {
    return null;
  }

  let pem = pemRaw.replace(/\\n/g, "\n").trim();
  if (!pem.startsWith("-----BEGIN")) {
    pem = `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`;
  }

  return pem;
}

export function diagnoseConvexJwtConfig(): ConvexAuthDiagnostics {
  const publicModulus = getConfiguredConvexJwtPublicKeyN().replace(/\s+/g, "");
  const privatePem = readPrivateKeyPem();

  let siteUrl: string | undefined;
  try {
    siteUrl = getConvexSiteUrl();
  } catch {
    return {
      status: "degraded",
      issueCode: "CONVEX_SITE_URL_MISSING",
      message: "Convex site URL is missing or cannot be derived.",
      publicKeyConfigured: Boolean(publicModulus),
      privateKeyConfigured: Boolean(privatePem),
      keypairMatches: false,
    };
  }

  if (!privatePem) {
    return {
      status: "degraded",
      issueCode: "CONVEX_JWT_PRIVATE_KEY_MISSING",
      message: "JWT_PRIVATE_KEY is not configured.",
      siteUrl,
      publicKeyConfigured: Boolean(publicModulus),
      privateKeyConfigured: false,
      keypairMatches: false,
    };
  }

  if (!publicModulus) {
    return {
      status: "degraded",
      issueCode: "CONVEX_JWT_PUBLIC_KEY_MISSING",
      message: "The configured Convex JWKS public key is missing.",
      siteUrl,
      publicKeyConfigured: false,
      privateKeyConfigured: true,
      keypairMatches: false,
    };
  }

  try {
    const privateKey = crypto.createPrivateKey(privatePem);
    const publicJwk = crypto.createPublicKey(privateKey).export({ format: "jwk" }) as {
      n?: string;
      e?: string;
    };
    const modulusMatches = publicJwk.n === publicModulus;

    if (!modulusMatches) {
      return {
        status: "degraded",
        issueCode: "CONVEX_JWT_KEY_MISMATCH",
        message: "JWT_PRIVATE_KEY does not match the configured Convex JWKS public key.",
        siteUrl,
        publicKeyConfigured: true,
        privateKeyConfigured: true,
        keypairMatches: false,
      };
    }

    return {
      status: "healthy",
      message: "Convex JWT keypair matches the configured public key.",
      siteUrl,
      publicKeyConfigured: true,
      privateKeyConfigured: true,
      keypairMatches: true,
    };
  } catch (error) {
    return {
      status: "degraded",
      issueCode: "CONVEX_JWT_PRIVATE_KEY_INVALID",
      message:
        error instanceof Error
          ? `JWT_PRIVATE_KEY could not be parsed: ${error.message}`
          : "JWT_PRIVATE_KEY could not be parsed.",
      siteUrl,
      publicKeyConfigured: true,
      privateKeyConfigured: true,
      keypairMatches: false,
    };
  }
}
