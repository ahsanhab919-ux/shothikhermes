"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useSubscription } from "@/hooks/subscription/useSubscription";
import { useUsageLimits, type UsageInfo } from "@/hooks/subscription/useUsageLimits";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import {
  SUBSCRIPTION_TIERS,
  TIER_ORDER,
  formatPrice,
  getCurrencyForCountry,
  type CurrencyCode,
  type UsageLimitKey,
} from "@/lib/subscription-tiers";
import { useUserLocation } from "@/hooks/utils/useUserLocation";
import {
  Crown,
  Zap,
  GraduationCap,
  FlaskConical,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  ExternalLink,
  Shield,
} from "lucide-react";

const USAGE_LABELS: Record<UsageLimitKey, string> = {
  plagiarismChecks: "Plagiarism Checks",
  aiDetectorScans: "AI Detector Scans",
  paraphraseUses: "Paraphrase Uses",
  grammarChecks: "Grammar Checks",
  humanizeUses: "Humanize GPT",
  summarizeUses: "Summarize Uses",
  translatorUses: "Translator Uses",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  student: <GraduationCap className="h-6 w-6" />,
  researcher: <FlaskConical className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
};

const TIER_COLORS: Record<string, string> = {
  free: "text-zinc-400",
  student: "text-blue-400",
  researcher: "text-violet-400",
  pro: "text-amber-400",
};

function UsageMeter({ label, info }: { label: string; info: UsageInfo }) {
  if (info.isUnlimited) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm">{label}</span>
        <Badge variant="outline" className="text-xs">
          Unlimited
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-muted-foreground">
          {info.used} / {info.limit}
        </span>
      </div>
      <Progress
        value={info.percentage}
        className={`h-2 ${info.isAtLimit ? "[&>div]:bg-destructive" : ""}`}
      />
    </div>
  );
}

export default function BillingPage() {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const subscription = useSubscription();
  const usageLimits = useUsageLimits();
  const { countryCode } = useUserLocation();
  const currency = getCurrencyForCountry(countryCode);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  if (subscription.isLoading || usageLimits.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

  const handleManageBilling = async () => {
    if (!accessToken) return;

    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/subscription/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        setPortalError(data.error || "Failed to open billing portal");
        setPortalLoading(false);
      }
    } catch {
      setPortalError("Failed to connect to billing service");
      setPortalLoading(false);
    }
  };

  const daysRemaining = subscription.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil(
          (subscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const usageKeys = Object.keys(USAGE_LABELS) as UsageLimitKey[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium tracking-wider uppercase text-muted-foreground">
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ${TIER_COLORS[subscription.tier]}`}
                >
                  {TIER_ICONS[subscription.tier]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{tierConfig.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tierConfig.description}
                  </p>
                </div>
              </div>

              {subscription.isPaid && (
                <>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Billing</span>
                      <span className="font-medium capitalize">
                        {formatPrice(
                          tierConfig.pricing[currency][
                            subscription.interval === "year" ? "yearly" : "monthly"
                          ],
                          currency,
                        )}
                        /{subscription.interval === "year" ? "yr" : "mo"}
                      </span>
                    </div>

                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {subscription.cancelAtPeriodEnd
                            ? "Expires"
                            : "Next billing"}
                        </span>
                        <span className="font-medium">
                          {new Date(
                            subscription.currentPeriodEnd,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {daysRemaining !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Days remaining
                        </span>
                        <span className="font-medium">{daysRemaining}</span>
                      </div>
                    )}
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        Your plan will be cancelled at the end of the billing
                        period.
                      </span>
                    </div>
                  )}

                  {portalError && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{portalError}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Manage Billing
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {!subscription.isPaid && (
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}

              {subscription.isPaid &&
                subscription.tier !== "pro" && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade to{" "}
                    {
                      SUBSCRIPTION_TIERS[
                        TIER_ORDER[
                          TIER_ORDER.indexOf(subscription.tier) + 1
                        ] as keyof typeof SUBSCRIPTION_TIERS
                      ]?.name
                    }
                  </Button>
                )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Payments secured by Stripe</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 xl:col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium tracking-wider uppercase text-muted-foreground">
                  Usage This Month
                </CardTitle>
                {usageLimits.periodEnd && (
                  <span className="text-xs text-muted-foreground">
                    Resets{" "}
                    {new Date(usageLimits.periodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {usageKeys.map((key) => (
                  <UsageMeter
                    key={key}
                    label={USAGE_LABELS[key]}
                    info={usageLimits.usage[key]}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium tracking-wider uppercase text-muted-foreground">
                Plan Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {tierConfig.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
                {tierConfig.limits.writingStudioPro && (
                  <div className="flex items-center gap-2 text-sm py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>Writing Studio Pro</span>
                  </div>
                )}
                {tierConfig.limits.publishingDistribution && (
                  <div className="flex items-center gap-2 text-sm py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>Publishing Distribution</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentTier={subscription.tier}
      />
    </div>
  );
}
