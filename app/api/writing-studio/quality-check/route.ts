import { NextRequest, NextResponse } from "next/server";
import { containsPII } from "@/lib/agent-auth";

export async function POST(req: NextRequest) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text } = body;
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const piiDetected = containsPII(text);
  const wordCount = text.trim().split(/\s+/).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
  const avgWordsPerSentence = wordCount / sentenceCount;
  const passiveVoiceMatches = (text.match(/\b(was|were|is|are|been|being)\s+\w+ed\b/gi) || []).length;
  const passiveRatio = passiveVoiceMatches / sentenceCount;
  const readabilityScore = Math.max(
    0,
    Math.min(100, 100 - passiveRatio * 20 - Math.max(0, avgWordsPerSentence - 20) * 2)
  );

  const issues: string[] = [];
  if (passiveRatio > 0.3) issues.push("High passive voice usage detected");
  if (avgWordsPerSentence > 30) issues.push("Sentences are very long on average");
  if (piiDetected) issues.push("Potential PII detected — please review before publishing");

  const passed = !piiDetected && readabilityScore >= 50;

  return NextResponse.json({
    success: true,
    quality: {
      readabilityScore: Math.round(readabilityScore),
      wordCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      passiveVoiceInstances: passiveVoiceMatches,
      issues,
      piiDetected,
      passed,
    },
  });
}
