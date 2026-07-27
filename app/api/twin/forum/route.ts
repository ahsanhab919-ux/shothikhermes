import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireTwinKey } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";

export async function GET(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  try {
    const convex = createTwinClient();
    const forums = await convex.query(twinApi.forums.getOpenForums, { limit: 20 });
    return NextResponse.json({
      forums: (forums as Array<Record<string, unknown>>).map((f) => ({
        forumId: f._id,
        title: f.title,
        description: f.description,
        postCount: f.postCount ?? 0,
        participantType: f.participantType,
        lastActivityAt: f.lastActivityAt,
        votingMode: f.votingMode,
        citationRequired: f.citationRequired,
      })),
    });
  } catch (err) {
    console.error("[twin/forum GET]", err);
    return NextResponse.json({ error: "Failed to fetch forums" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireTwinKey(auth)) {
    return NextResponse.json({ error: "Twin API key required" }, { status: 401 });
  }

  if (!auth.ability?.can("create", "forum")) {
    return NextResponse.json({ error: "Twin does not have forum:create permission" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  try {
    const twin = auth.twin;
    const convex = createTwinClient();
    const needsApproval = (twin.approvalRequiredActions ?? []).includes("forum:create");

    if (needsApproval && twin.masterId) {
      const approvalId = await convex.mutation(twinApi.twin.createPendingApproval, {
        twinId: auth.twinId,
        masterId: twin.masterId,
        action: "forum:create",
        payload: { title: body.title, description: body.description },
        keyHash: auth.keyHash,
      });
      return NextResponse.json({
        success: true,
        requiresApproval: true,
        approvalId,
        message: "Forum creation queued for master approval.",
      });
    }

    const forumId = await convex.mutation(twinApi.twin.twinCreateForum, {
      twinId: auth.twinId,
      title: body.title as string,
      description: body.description as string | undefined,
      participantType: (body.participantType as "agent_only" | "human_only" | "both") ?? "both",
      category: body.category as string | undefined,
      language: body.language as string | undefined,
      votingMode: body.votingMode as "balance_of_probabilities" | "beyond_reasonable_doubt" | undefined,
      citationRequired: body.citationRequired as boolean | undefined,
      agentBrief: body.agentBrief as string | undefined,
      agentOpinion: body.agentOpinion as string | undefined,
      keyHash: auth.keyHash,
    });

    await convex.mutation(twinApi.twin.logActivity, {
      twinId: auth.twinId,
      action: "forum_created",
      targetResource: `forum:${forumId}`,
      metadata: { title: body.title as string },
      keyHash: auth.keyHash,
    });

    return NextResponse.json({
      success: true,
      requiresApproval: false,
      forumId,
      message: "Forum created successfully.",
    });
  } catch (err) {
    console.error("[twin/forum POST]", err);
    return NextResponse.json({ error: "Failed to create forum" }, { status: 500 });
  }
}
