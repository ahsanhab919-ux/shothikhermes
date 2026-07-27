"use client";

import { useFeatureAccess } from "@/hooks/subscription/useFeatureAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

type GateableFeature = "writingStudioPro" | "publishingDistribution" | "apiAccess";

const FEATURE_INFO: Record<GateableFeature, { title: string; description: string; requiredTier: string }> = {
  writingStudioPro: {
    title: "Writing Studio Pro",
    description: "Advanced writing features including neural analysis, Nobel scoring, and AI-powered formatting are available on Researcher and Pro plans.",
    requiredTier: "Researcher",
  },
  publishingDistribution: {
    title: "Publishing & Distribution",
    description: "Publish and distribute your work to 400+ retailers worldwide. This feature is available exclusively on the Pro plan.",
    requiredTier: "Pro",
  },
  apiAccess: {
    title: "API Access",
    description: "Programmatic access to all Shothik AI tools via API. Available on the Pro plan.",
    requiredTier: "Pro",
  },
};

interface FeatureGateProps {
  feature: GateableFeature;
  children: React.ReactNode;
  fallbackAction?: () => void;
}

export function FeatureGate({ feature, children, fallbackAction }: FeatureGateProps) {
  const access = useFeatureAccess();
  const router = useRouter();

  if (access.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (access[feature]) {
    return <>{children}</>;
  }

  const info = FEATURE_INFO[feature];

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
            <Lock className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">{info.title}</h3>
          <p className="text-zinc-400 text-sm">{info.description}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => router.push("/account/billing")}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to {info.requiredTier}
            </Button>
            {fallbackAction && (
              <Button
                variant="ghost"
                onClick={fallbackAction}
                className="w-full text-zinc-400"
              >
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
