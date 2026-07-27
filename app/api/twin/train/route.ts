import { NextRequest, NextResponse } from "next/server";
import { authenticateTwinRequest, requireAuth } from "@/lib/twin-api-auth";
import { twinApi, createTwinClient } from "@/lib/twin-convex";
import { checkAbility, logRouteActivity } from "@/lib/twin-route-guard";
import { extractStyleProfile, computeKnowledgeScore } from "@/lib/twin/style-extractor";

export async function POST(req: NextRequest) {
  const auth = await authenticateTwinRequest(req);
  if (!requireAuth(auth)) {
    return NextResponse.json({ error: auth.error ?? "Authentication required" }, { status: 401 });
  }

  const abilityErr = checkAbility(auth, "train", "Twin");
  if (abilityErr) return abilityErr;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const textSamples = body.textSamples as string[] | undefined;
  const rawText = body.text as string | undefined;

  const samples: string[] = [];
  if (Array.isArray(textSamples)) {
    samples.push(...textSamples.filter((s) => typeof s === "string" && s.trim().length > 0));
  }
  if (typeof rawText === "string" && rawText.trim().length > 0) {
    samples.push(rawText.trim());
  }

  if (samples.length === 0) {
    return NextResponse.json({ error: "Provide text samples via 'text' or 'textSamples' field" }, { status: 400 });
  }

  const totalWords = samples.reduce((acc, s) => acc + s.split(/\s+/).filter(Boolean).length, 0);
  if (totalWords < 100) {
    return NextResponse.json({
      error: "Please provide at least 100 words of writing samples for effective style learning. You provided " + totalWords + " words.",
      errorCode: "INSUFFICIENT_SAMPLE"
    }, { status: 400 });
  }

  try {
    const convex = createTwinClient(auth.token);
    const profile = await convex.query(twinApi.twin.getByMaster, { masterId: auth.userId });
    if (!profile) {
      return NextResponse.json({ error: "Twin profile not found. Create one first." }, { status: 404 });
    }

    const styleProfile = await extractStyleProfile(samples);

    for (const sample of samples) {
      await convex.mutation(twinApi.twin.addKnowledge, {
        twinId: profile._id,
        userId: auth.userId,
        sourceType: "manual",
        content: sample.slice(0, 10000),
        summary: `Training sample (${sample.split(/\s+/).length} words)`,
      });
    }

    await convex.mutation(twinApi.twin.addKnowledge, {
      twinId: profile._id,
      userId: auth.userId,
      sourceType: "manual",
      content: JSON.stringify(styleProfile),
      summary: "__style_profile__",
    });

    const allKnowledge = await convex.query(twinApi.twin.getKnowledgeByUser, { userId: auth.userId });
    const knowledgeEntries = (allKnowledge as Array<{ sourceType: string; content: string }>).filter(
      (k) => k.content && !(k as Record<string, unknown>).summary?.toString().startsWith("__style_profile__")
    );
    const newScore = computeKnowledgeScore(knowledgeEntries);
    const scoreDelta = Math.max(0, newScore - profile.knowledgeScore);

    if (scoreDelta > 0) {
      await convex.mutation(twinApi.twin.incrementKnowledge, {
        masterId: auth.userId,
        points: scoreDelta,
      });
    }

    await logRouteActivity(auth, {
      action: "twin_trained",
      targetResource: `twin:${profile._id}`,
      metadata: {
        samplesProcessed: String(samples.length),
        scoreChange: String(scoreDelta),
        newScore: String(newScore),
      },
    });

    return NextResponse.json({
      success: true,
      samplesProcessed: samples.length,
      styleProfile,
      knowledgeScore: newScore,
      pointsGained: scoreDelta,
      message: `Training complete. Processed ${samples.length} sample(s). Knowledge score: ${newScore}%.`,
    });
  } catch (err) {
    console.error("[twin/train POST]", err);
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
