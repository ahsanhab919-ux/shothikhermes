import { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { hashAgentKey, isAgentKey } from "./agent-auth";
import { ConvexHttpClient } from "convex/browser";
import { buildTwinAbility } from "./twin-permissions";
import { twinApi, type TwinRecord } from "./twin-convex";
import type { Id } from "@/convex/_generated/dataModel";

function asTwinRecord(doc: Record<string, unknown>): TwinRecord {
  return doc as unknown as TwinRecord;
}

const JWKS_URL = process.env.NEXT_PUBLIC_CONVEX_URL
  ? `${process.env.NEXT_PUBLIC_CONVEX_URL}/.well-known/jwks.json`
  : null;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
if (JWKS_URL) {
  jwks = createRemoteJWKSet(new URL(JWKS_URL));
}

export interface TwinAuthResult {
  authenticated: boolean;
  userId?: string;
  twinId?: Id<"twins">;
  authType: "jwt" | "twin_key" | "none";
  error?: string;
  twin?: TwinRecord;
  ability?: ReturnType<typeof buildTwinAbility>;
  token?: string;
  keyHash?: string;
}

export async function authenticateTwinRequest(
  req: NextRequest
): Promise<TwinAuthResult> {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("jwt_token")?.value;

  if (authHeader?.startsWith("Bearer shothik_agent_")) {
    const apiKey = authHeader.slice(7).trim();
    return authenticateWithTwinKey(apiKey);
  }

  const bearerToken =
    authHeader?.startsWith("Bearer ") && !authHeader.startsWith("Bearer shothik_")
      ? authHeader.slice(7).trim()
      : null;
  const token = cookieToken ?? bearerToken;

  if (token) {
    return authenticateWithJWT(token);
  }

  return { authenticated: false, authType: "none", error: "No authentication provided" };
}

async function authenticateWithJWT(token: string): Promise<TwinAuthResult> {
  if (!jwks) {
    return { authenticated: false, authType: "jwt", error: "JWKS not configured" };
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["RS256"],
      issuer: process.env.NEXT_PUBLIC_CONVEX_URL,
    });

    const userId = payload.sub;
    if (!userId) {
      return { authenticated: false, authType: "jwt", error: "No subject in JWT" };
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);

    try {
      const twin = await convex.query(twinApi.twin.getByMaster, { masterId: userId });
      if (twin) {
        const twinRecord = asTwinRecord(twin as Record<string, unknown>);
        const ability = buildTwinAbility({
          lifecycleState: twinRecord.lifecycleState,
          allowedSkills: twinRecord.allowedSkills ?? [],
          blockedSkills: twinRecord.blockedSkills ?? [],
          approvalRequiredActions: twinRecord.approvalRequiredActions ?? [],
        });
        return {
          authenticated: true,
          userId,
          authType: "jwt",
          token,
          twinId: twinRecord._id,
          twin: twinRecord,
          ability,
        };
      }
    } catch {
    }

    return { authenticated: true, userId, authType: "jwt", token };
  } catch (err) {
    return { authenticated: false, authType: "jwt", error: (err as Error).message };
  }
}

async function authenticateWithTwinKey(apiKey: string): Promise<TwinAuthResult> {
  if (!isAgentKey(apiKey)) {
    return { authenticated: false, authType: "twin_key", error: "Invalid key format" };
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const keyHash = hashAgentKey(apiKey);

  try {
    const result = await convex.query(twinApi.twin.getByKeyHash, { keyHash });
    if (!result) {
      return { authenticated: false, authType: "twin_key", error: "Twin not found" };
    }

    const twin = asTwinRecord(result as Record<string, unknown>);
    const ability = buildTwinAbility({
      lifecycleState: twin.lifecycleState,
      allowedSkills: twin.allowedSkills ?? [],
      blockedSkills: twin.blockedSkills ?? [],
      approvalRequiredActions: twin.approvalRequiredActions ?? [],
    });

    return {
      authenticated: true,
      twinId: twin._id,
      userId: twin.masterId,
      authType: "twin_key",
      twin,
      ability,
      keyHash,
    };
  } catch (err) {
    return { authenticated: false, authType: "twin_key", error: (err as Error).message };
  }
}

export function requireAuth(auth: TwinAuthResult): auth is TwinAuthResult & { authenticated: true; userId: string } {
  return auth.authenticated && auth.authType === "jwt" && !!auth.userId;
}

export function requireAnyAuth(auth: TwinAuthResult): auth is TwinAuthResult & { authenticated: true; userId: string } {
  if (auth.authType === "twin_key") {
    return auth.authenticated && !!auth.userId && !!auth.twinId;
  }
  return auth.authenticated && auth.authType === "jwt" && !!auth.userId;
}

export function needsApproval(twin: TwinRecord, action: string): boolean {
  return (twin.approvalRequiredActions ?? []).includes(action);
}

export function requireTwinKey(auth: TwinAuthResult): auth is TwinAuthResult & { authenticated: true; twinId: Id<"twins">; twin: TwinRecord } {
  return auth.authenticated && auth.authType === "twin_key" && !!auth.twinId;
}
