"use client";

import posthog from "posthog-js";
import type { PackId, PaymentProvider } from "@/lib/payment-config";
import { CREDIT_PACKS } from "@/lib/payment-config";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined" || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

async function hashId(id: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(id);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function identifyUser(userId: string) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  const hashed = await hashId(userId);
  posthog.identify(hashed);
}

export function resetUser() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.reset();
}

export function trackToolUsed(
  toolName: string,
  wordCount: number,
  creditsSpent?: number,
) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("tool_used", {
    tool_name: toolName,
    word_count: wordCount,
    credits_spent: creditsSpent ?? 0,
  });
}

export function trackCreditPurchaseStarted(
  provider: PaymentProvider,
  packId: PackId,
) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  const pack = CREDIT_PACKS[packId];
  posthog.capture("credit_purchase_started", {
    provider,
    pack: packId,
    amount_usd: pack.usd.amount,
    credits: pack.credits,
  });
}

export function trackCreditPurchaseCompleted(
  provider: PaymentProvider,
  packId: PackId,
) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  const pack = CREDIT_PACKS[packId];
  posthog.capture("credit_purchase_completed", {
    provider,
    pack: packId,
    amount_usd: pack.usd.amount,
    credits: pack.credits,
  });
}

export function trackSignup() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("signup");
}

export function trackLogin() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("login");
}

export function trackLoginIntentCaptured(intent: string, variant: string, method: "password" | "google") {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("login_intent_captured", {
    intent,
    variant,
    method,
  });
}

export function trackPostLoginRecommendation(route: string, reason: string, intent?: string | null) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("post_login_recommendation", {
    route,
    reason,
    intent: intent ?? null,
  });
}

export function trackPostLoginOverride(route: string) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("post_login_override", {
    route,
  });
}

export function trackBookPublished() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("book_published");
}

export function trackWritingStudioOpened() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("writing_studio_opened");
}

export function trackSecondMeOnboarded() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("second_me_onboarded");
}

export function trackTwinOnboarded() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_onboarded");
}

export function trackTwinCreated() {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_created");
}

export function trackTwinTrainingStarted(wordCount: number, sampleCount: number) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_training_started", {
    word_count: wordCount,
    sample_count: sampleCount,
  });
}

export function trackTwinTrainingCompleted(knowledgeScoreGain: number, processingTimeMs: number) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_training_completed", {
    knowledge_score_gain: knowledgeScoreGain,
    processing_time_ms: processingTimeMs,
  });
}

export function trackTwinTaskQueued(taskType: string) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_task_queued", {
    task_type: taskType,
  });
}

export function trackTwinTaskCompleted(taskType: string) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_task_completed", {
    task_type: taskType,
  });
}

export function trackTwinApprovalResolved(action: string, decision: string) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_approval_resolved", {
    action,
    decision,
  });
}

export function trackTwinStatusToggled(isActive: boolean) {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("twin_status_toggled", {
    is_active: isActive,
  });
}
