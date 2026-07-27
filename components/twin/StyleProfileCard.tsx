"use client";

import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface StyleProfileData {
  avgSentenceLength: number;
  formalityScore: number;
  vocabularyComplexity: number;
  domainKeywords: string[];
  preferredStructures: string[];
  toneDescriptor: string;
  writingPatterns: string[];
}

interface StyleProfileCardProps {
  profile: StyleProfileData | null;
  className?: string;
}

function MetricBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StyleProfileCard({ profile, className }: StyleProfileCardProps) {
  const { t } = useTranslation();

  if (!profile) return null;

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 space-y-5", className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("twinDashboard.writingDna")}</h3>
          <p className="text-xs text-muted-foreground">{t("twinDashboard.writingDnaDesc")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <MetricBar label={t("twinDashboard.formality")} value={profile.formalityScore} />
        <MetricBar label={t("twinDashboard.vocabularyComplexity")} value={profile.vocabularyComplexity} />
        <MetricBar label={t("twinDashboard.avgSentenceLength")} value={profile.avgSentenceLength} max={40} />
      </div>

      {profile.toneDescriptor && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("twinDashboard.tone")}</p>
          <p className="text-sm text-foreground font-medium capitalize">{profile.toneDescriptor}</p>
        </div>
      )}

      {profile.domainKeywords.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("twinDashboard.domainKeywords")}</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.domainKeywords.map((kw) => (
              <span key={kw} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.writingPatterns.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("twinDashboard.writingPatterns")}</p>
          <ul className="space-y-1">
            {profile.writingPatterns.map((p) => (
              <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
