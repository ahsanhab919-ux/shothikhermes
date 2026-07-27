"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { CitationAnalysis } from "@/services/citationDetector";
import { useCitationVerification } from "@/hooks/useCitationVerification";
import type { VerificationStatus } from "@/hooks/useCitationVerification";
import {
  BookOpen,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  Clock,
} from "lucide-react";

interface CitationAnalysisPanelProps {
  analysis: CitationAnalysis;
  className?: string;
  inputText?: string;
  autoVerify?: boolean;
}

const CitationCoverageRing = ({ percent }: { percent: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 80
      ? "text-emerald-500"
      : percent >= 50
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="5"
          className="stroke-muted/30"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-700", `stroke-current ${color}`)}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className={cn("absolute text-sm font-bold", color)}>
        {percent}%
      </span>
    </div>
  );
};

const statusConfig: Record<
  VerificationStatus,
  { icon: typeof Check; colorClass: string; bgClass: string }
> = {
  verified: {
    icon: ShieldCheck,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10",
  },
  unverified: {
    icon: ShieldQuestion,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
  },
  dead: {
    icon: ShieldX,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
  },
  retracted: {
    icon: ShieldAlert,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-500/10",
  },
  unverifiable: {
    icon: ShieldQuestion,
    colorClass: "text-gray-500 dark:text-gray-400",
    bgClass: "bg-gray-500/10",
  },
  pending: {
    icon: Loader2,
    colorClass: "text-blue-500 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
  },
};

const VerificationBadge = ({
  status,
  label,
}: {
  status: VerificationStatus;
  label: string;
}) => {
  const config = statusConfig[status] || statusConfig.unverifiable;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        config.bgClass,
        config.colorClass
      )}
    >
      <Icon
        className={cn("size-3", status === "pending" && "animate-spin")}
        aria-hidden="true"
      />
      {label}
    </span>
  );
};

const CitedSourceCard = ({
  authors,
  year,
  text,
  verificationStatus,
  verificationLabel,
  resolvedTitle,
  resolvedJournal,
  resolvedYear,
  isRetracted,
  retractedWarning,
}: {
  authors?: string;
  year?: string;
  text: string;
  verificationStatus?: VerificationStatus;
  verificationLabel?: string;
  resolvedTitle?: string | null;
  resolvedJournal?: string | null;
  resolvedYear?: number | null;
  isRetracted?: boolean;
  retractedWarning?: string;
}) => (
  <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 p-3">
    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {authors && year ? `${authors} (${year})` : text}
        </p>
        {verificationStatus && verificationLabel && (
          <VerificationBadge status={verificationStatus} label={verificationLabel} />
        )}
      </div>
      {authors && year && (
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{text}</p>
      )}
      {resolvedTitle && (
        <p className="mt-1 truncate text-xs text-emerald-600/70 dark:text-emerald-400/70">
          {resolvedTitle}
          {resolvedJournal && resolvedYear && ` — ${resolvedJournal}, ${resolvedYear}`}
        </p>
      )}
      {isRetracted && retractedWarning && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
          <ShieldAlert className="size-3" aria-hidden="true" />
          {retractedWarning}
        </p>
      )}
    </div>
  </div>
);

const UncitedSourceCard = ({
  sourceTitle,
  sourceUrl,
  snippet,
  similarity,
  uncitedLabel,
  viewSourceLabel,
  urlAlive,
  sourceAliveLabel,
  sourceDeadLabel,
}: {
  sourceTitle?: string;
  sourceUrl: string;
  snippet: string;
  similarity: number;
  uncitedLabel: string;
  viewSourceLabel: string;
  urlAlive?: boolean | null;
  sourceAliveLabel?: string;
  sourceDeadLabel?: string;
}) => (
  <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 p-3">
    <AlertTriangle
      className="mt-0.5 size-4 shrink-0 text-amber-500"
      aria-hidden="true"
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-sm font-medium text-amber-700 dark:text-amber-400">
          {sourceTitle || uncitedLabel}
        </p>
        <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400">
          {similarity}%
        </span>
        {urlAlive !== null && urlAlive !== undefined && (
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-xs",
              urlAlive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {urlAlive ? sourceAliveLabel : sourceDeadLabel}
          </span>
        )}
      </div>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{snippet}</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
        >
          <ExternalLink className="size-3" aria-hidden="true" />
          {viewSourceLabel}
        </a>
      )}
    </div>
  </div>
);

const CitationAnalysisPanel = ({
  analysis,
  className,
  inputText,
  autoVerify = true,
}: CitationAnalysisPanelProps) => {
  const { t } = useTranslation();
  const { citations, references, citedSources, uncitedSources, coveragePercent } =
    analysis;
  const verification = useCitationVerification();

  const hasVerifiableCitations = citations.some(
    (c) => c.doi || c.url || c.authors
  );

  const citationTextsKey = citations.map((c) => c.text).join("|");

  useEffect(() => {
    if (
      autoVerify &&
      citations.length > 0 &&
      hasVerifiableCitations &&
      !verification.loading
    ) {
      verification.reset();
      const sourceUrls = uncitedSources
        .map((us) => us.sourceUrl)
        .filter((url) => url && url.startsWith("http"));
      verification.verify(citations, references, sourceUrls);
    }
  }, [citationTextsKey, autoVerify]);

  if (citations.length === 0 && uncitedSources.length === 0) return null;

  const getVerificationForCitation = (citationText: string, index: number) => {
    return verification.results.find(
      (r) => r.index === index || r.citation_text === citationText
    );
  };

  const getURLVerification = (url: string) => {
    return verification.sourceURLResults.find((r) => r.url === url);
  };

  const getStatusLabel = (status: VerificationStatus): string => {
    const key = `tools.plagiarism.citation.verification.${status}`;
    return t(key);
  };

  return (
    <Card className={cn("bg-card shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <span className="bg-primary/10 text-primary rounded-full p-2">
          <BookOpen className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <CardTitle className="text-base">
            {t("tools.plagiarism.citation.title")}
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            {t("tools.plagiarism.citation.citationsDetected").replace(
              "{count}",
              String(citations.length)
            )}
          </p>
        </div>
        <CitationCoverageRing percent={coveragePercent} />
      </CardHeader>
      <CardContent className="space-y-4">
        {verification.summary && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="size-4 text-emerald-500"
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("tools.plagiarism.citation.verification.summary")}
              </span>
            </div>
            <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                {t("tools.plagiarism.citation.verification.totalVerified")
                  .replace("{count}", String(verification.summary.verified))
                  .replace(
                    "{total}",
                    String(verification.summary.total_citations)
                  )}
              </span>
              {verification.summary.total_source_urls > 0 && (
                <span>
                  {t("tools.plagiarism.citation.verification.sourcesChecked")
                    .replace(
                      "{alive}",
                      String(verification.summary.source_urls_alive)
                    )
                    .replace(
                      "{total}",
                      String(verification.summary.total_source_urls)
                    )}
                </span>
              )}
              {verification.summary.retracted > 0 && (
                <span className="font-medium text-red-600 dark:text-red-400">
                  {verification.summary.retracted}{" "}
                  {t("tools.plagiarism.citation.verification.retracted")}
                </span>
              )}
              {verification.processingTimeMs && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  {t("tools.plagiarism.citation.verification.processingTime").replace(
                    "{time}",
                    String(verification.processingTimeMs)
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {verification.loading && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/5 p-3 text-sm text-blue-600 dark:text-blue-400">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("tools.plagiarism.citation.verification.verifying")}
          </div>
        )}

        {verification.error && (
          <div className="flex items-center justify-between rounded-lg bg-amber-500/5 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("tools.plagiarism.citation.verification.serviceUnavailable")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const sourceUrls = uncitedSources
                  .map((us) => us.sourceUrl)
                  .filter((url) => url && url.startsWith("http"));
                verification.verify(citations, references, sourceUrls);
              }}
              className="text-xs"
            >
              {t("common.retry")}
            </Button>
          </div>
        )}

        {!verification.loading &&
          !verification.summary &&
          !verification.error &&
          hasVerifiableCitations && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const sourceUrls = uncitedSources
                  .map((us) => us.sourceUrl)
                  .filter((url) => url && url.startsWith("http"));
                verification.verify(citations, references, sourceUrls);
              }}
              className="w-full gap-2"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t("tools.plagiarism.citation.verification.verifyButton")}
            </Button>
          )}

        {citedSources.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {t("tools.plagiarism.citation.properlyCited")} ({citedSources.length})
            </h4>
            <div className="space-y-2">
              {citedSources.slice(0, 5).map((cs, i) => {
                const v = getVerificationForCitation(cs.citation.text, i);
                return (
                  <CitedSourceCard
                    key={i}
                    authors={cs.citation.authors}
                    year={cs.citation.year}
                    text={cs.citation.text}
                    verificationStatus={v?.status as VerificationStatus}
                    verificationLabel={
                      v ? getStatusLabel(v.status as VerificationStatus) : undefined
                    }
                    resolvedTitle={v?.resolved_title}
                    resolvedJournal={v?.resolved_journal}
                    resolvedYear={v?.resolved_year}
                    isRetracted={v?.is_retracted}
                    retractedWarning={t(
                      "tools.plagiarism.citation.verification.retractedWarning"
                    )}
                  />
                );
              })}
              {citedSources.length > 5 && (
                <p className="text-muted-foreground text-xs">
                  {t("tools.plagiarism.citation.moreCitedSources").replace(
                    "{count}",
                    String(citedSources.length - 5)
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {uncitedSources.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              {t("tools.plagiarism.citation.needsCitation")} ({uncitedSources.length})
            </h4>
            <div className="space-y-2">
              {uncitedSources.slice(0, 5).map((us, i) => {
                const urlV = getURLVerification(us.sourceUrl);
                return (
                  <UncitedSourceCard
                    key={i}
                    sourceTitle={us.sourceTitle}
                    sourceUrl={us.sourceUrl}
                    snippet={us.snippet}
                    similarity={us.similarity}
                    uncitedLabel={t("tools.plagiarism.citation.uncitedSource")}
                    viewSourceLabel={t("tools.plagiarism.report.viewSource")}
                    urlAlive={urlV?.alive ?? null}
                    sourceAliveLabel={t(
                      "tools.plagiarism.citation.verification.sourceAlive"
                    )}
                    sourceDeadLabel={t(
                      "tools.plagiarism.citation.verification.sourceDead"
                    )}
                  />
                );
              })}
              {uncitedSources.length > 5 && (
                <p className="text-muted-foreground text-xs">
                  {t("tools.plagiarism.citation.moreUncitedSources").replace(
                    "{count}",
                    String(uncitedSources.length - 5)
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CitationAnalysisPanel;
