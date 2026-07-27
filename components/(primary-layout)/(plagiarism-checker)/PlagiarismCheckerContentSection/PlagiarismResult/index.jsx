import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";

const PlagiarismResult = ({
  text: inputText,
  score,
  results,
  loading,
  error,
  manualRefresh,
}) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-2">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-bold">{t("tools.plagiarism.title")}</div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={manualRefresh}
            disabled={loading || !inputText?.trim()}
            title={t("tools.plagiarism.actions.refreshCheck")}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      <Card
        className={cn(
          "mb-4 flex min-h-[100px] flex-col justify-center text-center",
          loading ? "bg-muted" : error ? "bg-destructive/10" : "bg-background",
        )}
      >
        <CardContent className="p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="mb-2 size-6 animate-spin" />
              <span className="text-muted-foreground text-sm">
                {t("tools.plagiarism.scan.checkingPlagiarism")}
              </span>
            </div>
          ) : error ? (
            <>
              <div className="text-destructive mb-2 text-2xl font-semibold">
                {t("tools.plagiarism.error.errorTitle")}
              </div>
              <p className="text-destructive mb-3 text-sm">{error}</p>
              <Button
                size="sm"
                onClick={manualRefresh}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 mt-2"
              >
                {t("tools.plagiarism.error.retry")}
              </Button>
            </>
          ) : (
            <>
              <div id="plagiarism_score" className="text-4xl font-bold">
                {score != null ? `${score}%` : "--"}
              </div>
              <span className="text-muted-foreground text-sm">{t("tools.plagiarism.title")}</span>
            </>
          )}
        </CardContent>
      </Card>

      <div id="plagiarism_results">
        <div className="text-muted-foreground mb-2 text-sm font-medium">
          {t("tools.plagiarism.tabs.results")} ({results.length})
        </div>

        {results.map((r, i) => (
          <div
            key={i}
            className="mb-2 flex items-center justify-between rounded-lg bg-muted/40 p-2"
          >
            <span className="w-[20%] text-sm">{r.percent}%</span>
            <span className="ml-2 flex-1 text-center text-sm">{r.source}</span>
            <Button variant="ghost" size="icon-sm">
              <ChevronDown className="size-4" />
            </Button>
          </div>
        ))}

        {!loading && !error && results.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("tools.plagiarism.sections.noOverlapping")}</p>
        )}
      </div>
    </div>
  );
};

export default PlagiarismResult;
