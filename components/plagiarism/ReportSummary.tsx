import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import type { PlagiarismReport } from "@/types/plagiarism";
import {
  formatAnalyzedTimestamp,
  getRiskBadgeClasses,
  getRiskDescription,
  getRiskLabel,
} from "@/utils/plagiarism/riskHelpers";
import { Globe } from "lucide-react";

interface ReportSummaryProps {
  report: PlagiarismReport | null;
  loading: boolean;
  fromCache: boolean;
}

const ReportSummary = ({ report, loading, fromCache }: ReportSummaryProps) => {
  const { t } = useTranslation();

  if (!report && !loading) return null;

  if (!report && loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 py-12">
          <Spinner className="size-6" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const stats = [
    {
      label: t("tools.plagiarism.stats.paraphrasedSimilarity"),
      value: `${report.summary.paraphrasedPercentage}%`,
      description: t("tools.plagiarism.stats.overallParaphrased"),
    },
    {
      label: t("tools.plagiarism.stats.exactMatches"),
      value: report.summary.exactMatchCount,
      description: t("tools.plagiarism.stats.directCopyMatches"),
    },
  ];

  if (
    report.exactPlagiarismPercentage != null &&
    report.exactPlagiarismPercentage > 0
  ) {
    stats.push({
      label: t("tools.plagiarism.stats.exactPlagiarism"),
      value: `${report.exactPlagiarismPercentage}%`,
      description: t("tools.plagiarism.stats.directCopyPercentage"),
    });
  }

  return (
    <Card className="relative overflow-hidden">
      {loading ? (
        <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
          <Spinner className="text-primary size-6" />
        </div>
      ) : null}
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-lg md:text-xl">
            {t("tools.plagiarism.report.overallSimilarity")}
          </CardTitle>
          <CardDescription>
            {getRiskDescription(report.riskLevel, t)}
          </CardDescription>
        </div>
        <Badge className={cn("text-sm", getRiskBadgeClasses(report.riskLevel))}>
          {getRiskLabel(report.riskLevel, t)}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between flex-wrap">
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground text-sm">{t("tools.plagiarism.report.similarityScore")}</p>
            <p className="text-5xl font-semibold tracking-tight">
              {report.score}%
            </p>
          </div>
          <div className="text-muted-foreground text-xs">
            {t("tools.plagiarism.report.lastAnalyzed")}{" "}
            <span className="text-foreground font-medium">
              {formatAnalyzedTimestamp(report.analyzedAt)}
            </span>
          </div>
          {report.isLocalAnalysis ? (
            <Badge
              variant="outline"
              className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
            >
              {t("tools.plagiarism.report.localAnalysis")}
            </Badge>
          ) : null}
          {fromCache ? (
            <Badge
              variant="outline"
              className="border-primary/50 bg-primary/5 text-primary"
            >
              {t("tools.plagiarism.report.cachedResult")}
            </Badge>
          ) : null}
          {report.language && (
            <Badge
              variant="outline"
              className="flex w-fit items-center gap-1.5"
            >
              <Globe className="size-3" />
              <span>{report.language.name || report.language.code}</span>
              {report.language.confidence && (
                <span className="text-muted-foreground text-xs">
                  ({Math.round(report.language.confidence * 100)}%)
                </span>
              )}
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "flex w-fit gap-4 flex-wrap",
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-muted/40 rounded-xl p-4 text-sm shadow-sm transition hover:shadow-md"
            >
              <p className="text-muted-foreground text-xs tracking-wide uppercase">
                {stat.label}
              </p>
              <p className="text-foreground mt-2 text-2xl font-bold">
                {stat.value}
              </p>
              {stat.description && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportSummary;
