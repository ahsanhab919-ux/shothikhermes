"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock3, Loader2, Sparkles } from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import {
  clearAuthFlowState,
  getAuthFlowState,
  inferAuthRoutingDecision,
} from "@/lib/auth-flow";
import { getProjects } from "@/lib/projects-store";
import {
  trackPostLoginOverride,
  trackPostLoginRecommendation,
} from "@/lib/posthog";

export default function PostLoginPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAutoNavigatedRef = useRef(false);

  const decision = useMemo(() => {
    const flowState = getAuthFlowState();
    return inferAuthRoutingDecision({
      user: user as any,
      explicitRedirect: searchParams.get("redirect"),
      flowState,
      recentProjects: getProjects(),
    });
  }, [searchParams, user]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    trackPostLoginRecommendation(
      decision.route,
      decision.reason,
      getAuthFlowState()?.intent ?? null
    );

    const timer = window.setTimeout(() => {
      if (hasAutoNavigatedRef.current) return;
      hasAutoNavigatedRef.current = true;
      clearAuthFlowState();
      router.replace(decision.route);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [decision.reason, decision.route, isAuthenticated, isLoading, router]);

  const handleOverride = (href: string) => {
    hasAutoNavigatedRef.current = true;
    trackPostLoginOverride(href);
    clearAuthFlowState();
    router.replace(href);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center">
        <div className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground inline-flex items-center gap-2 w-fit">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          Authenticated successfully
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground lg:text-base">
          We found the best next step based on your selected intent, account context, and recent activity.
          You can continue automatically or choose another path below.
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Recommended next step
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">{decision.route}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reason: <span className="font-medium text-foreground">{decision.reason.replace(/_/g, " ")}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Redirecting shortly
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOverride(decision.route)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {decision.suggestions.map((suggestion) => (
            <button
              key={suggestion.key}
              type="button"
              onClick={() => handleOverride(suggestion.href)}
              className="rounded-2xl border border-border bg-card/70 p-5 text-left transition-all hover:border-border/80 hover:bg-card"
            >
              <p className="text-base font-semibold text-foreground">{suggestion.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{suggestion.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">{suggestion.href}</p>
            </button>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Need a different path? You can also return to{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            login
          </Link>{" "}
          and pick another starting intent.
        </p>
      </div>
    </div>
  );
}
