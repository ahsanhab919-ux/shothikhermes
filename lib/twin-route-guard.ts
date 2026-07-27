import { NextResponse } from "next/server";
import { twinApi, createTwinClient } from "./twin-convex";
import type { TwinAuthResult } from "./twin-api-auth";

export interface RouteGuardOptions {
  requiredAbility?: { action: string; subject: string };
  activityAction: string;
  activityTarget?: string;
  activityMetadata?: Record<string, string>;
  skipActivityLog?: boolean;
}

export function guardResponse(
  auth: TwinAuthResult,
  opts?: { requireTwinKey?: boolean }
): NextResponse | null {
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error ?? "Authentication required" },
      { status: 401 }
    );
  }

  if (opts?.requireTwinKey && auth.authType !== "twin_key") {
    return NextResponse.json(
      { error: "Twin API key required" },
      { status: 401 }
    );
  }

  if (opts?.requireTwinKey && !auth.twinId) {
    return NextResponse.json(
      { error: "Twin not found for key" },
      { status: 404 }
    );
  }

  return null;
}

export function checkAbility(
  auth: TwinAuthResult,
  action: string,
  subject: string
): NextResponse | null {
  if (!auth.ability) {
    return NextResponse.json(
      { error: "No Twin linked to account — permission check cannot be performed" },
      { status: 403 }
    );
  }

  if (!auth.ability.can(action, subject)) {
    return NextResponse.json(
      { error: `Twin does not have ${subject}:${action} permission` },
      { status: 403 }
    );
  }

  return null;
}

export async function logRouteActivity(
  auth: TwinAuthResult,
  opts: {
    action: string;
    targetResource?: string;
    metadata?: Record<string, string | undefined>;
  }
): Promise<void> {
  try {
    if (auth.twinId && auth.keyHash) {
      const convex = createTwinClient();
      await convex.mutation(twinApi.twin.logActivity, {
        twinId: auth.twinId,
        action: opts.action,
        targetResource: opts.targetResource,
        metadata: opts.metadata,
        keyHash: auth.keyHash,
      });
      return;
    }

    if (auth.userId && auth.token) {
      const convex = createTwinClient(auth.token);
      const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
      if (profile) {
        await convex.mutation(twinApi.twin.logActivity, {
          twinId: profile._id,
          masterId: auth.userId,
          action: opts.action,
          targetResource: opts.targetResource,
          metadata: opts.metadata,
        });
      }
    }
  } catch {
  }
}
