import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { PlagiarismSection } from "@/types/plagiarism";
import {
    getSimilarityColor,
    getSimilarityTone,
} from "@/utils/plagiarism/riskHelpers";
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    ExternalLink,
    LinkIcon,
} from "lucide-react";
import { STEMContentRenderer } from "./STEMContentRenderer";

interface ReportSectionItemProps {
  section: PlagiarismSection;
  index: number;
  isExactMatch?: boolean;
  matchId?: string;
  isActive?: boolean;
  onMatchClick?: (matchId: string) => void;
}

const ReportSectionItem = ({
  section,
  index,
  isExactMatch = false,
  matchId,
  isActive = false,
  onMatchClick,
}: ReportSectionItemProps) => {
  const { t } = useTranslation();
  const sources = section.sources ?? [];
  const primarySource = sources[0];
  const similarityTone = getSimilarityTone(section.similarity);
  const similarityColor = getSimilarityColor(section.similarity);
  const isHighRisk = section.similarity >= 75;
  const isMediumRisk = section.similarity >= 50 && section.similarity < 75;

  const effectiveRisk = isExactMatch
    ? "high"
    : isHighRisk
      ? "high"
      : isMediumRisk
        ? "medium"
        : "low";

  return (
    <AccordionItem
      value={matchId || `section-${index}`}
      id={matchId}
      className={cn(
        "overflow-hidden rounded-xl border-none shadow-sm backdrop-blur transition-all",
        isHighRisk
          ? "bg-rose-50/50 dark:bg-rose-950/20"
          : isMediumRisk
            ? "bg-amber-50/50 dark:bg-amber-950/20"
            : "bg-card/40",
        isActive && "ring-2 ring-blue-500 ring-offset-1",
      )}
    >
      <AccordionTrigger className="hover:bg-muted/50 px-4 py-4" onClick={() => { if (matchId && onMatchClick) onMatchClick(matchId); }}>
        <div className="flex w-full items-start gap-4 text-left">
          <div className="flex min-w-[70px] flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-bold",
                similarityColor.bg,
                similarityColor.text,
                similarityColor.border,
              )}
            >
              {section.similarity}%
            </div>
            <span className={cn("text-xs font-medium", similarityTone)}>
              {t("tools.plagiarism.report.similarity")}
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-2">
              {isHighRisk ? (
                <AlertCircle className="mt-0.5 size-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-foreground line-clamp-2 text-sm font-semibold">
                  {primarySource?.title || t("tools.plagiarism.sections.possibleParaphrased")}
                </p>
                {section.excerpt && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                    {section.excerpt}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isExactMatch && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 text-xs"
                >
                  <Copy className="size-3" />
                  {t("tools.plagiarism.sections.exactMatch")}
                </Badge>
              )}
              {!isExactMatch && (
                <Badge variant="outline" className="text-xs">
                  {t("tools.plagiarism.sections.paraphrased")}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  isHighRisk &&
                    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                  isMediumRisk &&
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                )}
              >
                {sources.length} {sources.length === 1 ? t("tools.plagiarism.sections.source") : t("tools.plagiarism.sections.sources")}
              </Badge>
              {primarySource?.url && (
                <a
                  href={primarySource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkIcon className="size-3" />
                  {t("tools.plagiarism.report.viewSource")}
                </a>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-2 pb-4">
        <div className="space-y-4 text-sm">
          <div
            className={cn(
              "rounded-xl p-4",
              isHighRisk
                ? "bg-rose-50/80 dark:bg-rose-950/30"
                : isMediumRisk
                  ? "bg-amber-50/80 dark:bg-amber-950/30"
                  : "bg-muted/60 dark:bg-muted/40",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isHighRisk
                      ? "bg-rose-600 dark:bg-rose-400"
                      : isMediumRisk
                        ? "bg-amber-600 dark:bg-amber-400"
                        : "bg-emerald-600 dark:bg-emerald-400",
                  )}
                />
                <p className="text-foreground font-semibold">{t("tools.plagiarism.report.matchedContent")}</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2.5 w-28 overflow-hidden rounded-full",
                    isHighRisk
                      ? "bg-rose-200 dark:bg-rose-900/50"
                      : isMediumRisk
                        ? "bg-amber-200 dark:bg-amber-900/50"
                        : "bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isHighRisk
                        ? "bg-rose-600 dark:bg-rose-500"
                        : isMediumRisk
                          ? "bg-amber-600 dark:bg-amber-500"
                          : "bg-primary",
                    )}
                    style={{ width: `${section.similarity}%` }}
                  />
                </div>
                <span className={cn("text-sm font-bold", similarityTone)}>
                  {section.similarity}% {t("tools.plagiarism.report.match")}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "rounded-lg p-3.5",
                isHighRisk
                  ? "bg-rose-100/50 dark:bg-rose-900/20"
                  : isMediumRisk
                    ? "bg-amber-100/50 dark:bg-amber-900/20"
                    : "bg-background/60",
              )}
            >
              <STEMContentRenderer
                text={section.excerpt || t("tools.plagiarism.report.excerptUnavailable")}
                className={cn(
                  isHighRisk && "text-rose-950 dark:text-rose-50",
                  isMediumRisk && "text-amber-950 dark:text-amber-50",
                  !isHighRisk && !isMediumRisk && "text-foreground",
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-foreground font-semibold">
                {t("tools.plagiarism.report.matchedSources")} ({sources.length})
              </p>
              <p className="text-muted-foreground text-xs">
                {t("tools.plagiarism.report.clickToVisitSource")}
              </p>
            </div>
            {sources.length === 0 ? (
              <div className="text-muted-foreground rounded-lg bg-muted/30 p-4 text-center text-xs">
                {t("tools.plagiarism.report.noSourceMetadata")}
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source, sourceIndex) => {
                  const sourceSimilarity = source.similarity ?? 0;
                  const sourceTone = getSimilarityTone(sourceSimilarity);
                  const sourceColor = getSimilarityColor(sourceSimilarity);

                  return (
                    <div
                      key={`${source.url}-${sourceIndex}`}
                      className="bg-background/80 dark:bg-background/60 rounded-xl p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                                sourceColor.bg,
                                sourceColor.text,
                                sourceColor.border,
                              )}
                            >
                              {sourceSimilarity}%
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground line-clamp-2 font-semibold">
                                {source.title || t("tools.plagiarism.report.unknownSource")}
                              </p>
                            </div>
                          </div>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                            >
                              <LinkIcon className="size-3.5" />
                              <span className="line-clamp-1">{source.url}</span>
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {source.snippet && (
                        <div className="bg-muted/40 border-l-primary/30 rounded-md border-l-2 p-3">
                          <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                            {source.snippet}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {source.matchType && (
                          <Badge variant="outline" className="text-xs">
                            {source.matchType}
                          </Badge>
                        )}
                        {source.confidence && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              source.confidence === "high" &&
                                "border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-300",
                              source.confidence === "medium" &&
                                "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300",
                            )}
                          >
                            {source.confidence} {t("tools.plagiarism.report.confidence")}
                          </Badge>
                        )}
                        {source.isPlagiarism && (
                          <Badge variant="destructive" className="text-xs">
                            {t("tools.plagiarism.report.plagiarismDetected")}
                          </Badge>
                        )}
                      </div>

                      {source.reason && (
                        <details className="mt-3">
                          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
                            {t("tools.plagiarism.report.viewAnalysisReason")}
                          </summary>
                          <p className="text-muted-foreground bg-muted/40 mt-2 rounded-md p-2 text-xs leading-relaxed">
                            {source.reason}
                          </p>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ReportSectionItem;
