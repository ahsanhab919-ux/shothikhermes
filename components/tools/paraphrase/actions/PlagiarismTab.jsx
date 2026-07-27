import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useGlobalPlagiarismCheck from "@/hooks/useGlobalPlagiarismCheck";
import { cn } from "@/lib/utils";
import {
  getRiskBadgeClasses,
  getRiskLabel,
} from "@/utils/plagiarism/riskHelpers";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

// Helper function to get match type badge styling
const getMatchTypeBadge = (matchType) => {
  const types = {
    exact: { label: "Exact Match", className: "bg-red-500 text-white" },
    paraphrased: {
      label: "Paraphrased",
      className: "bg-orange-500 text-white",
    },
    inspired: { label: "Inspired", className: "bg-yellow-500 text-white" },
  };
  return (
    types[matchType?.toLowerCase()] || {
      label: matchType || "Unknown",
      className: "bg-gray-500 text-white",
    }
  );
};

// Helper function to get confidence badge styling
const getConfidenceBadge = (confidence) => {
  const levels = {
    high: { label: "High Confidence", className: "bg-red-100 text-red-800" },
    medium: {
      label: "Medium Confidence",
      className: "bg-yellow-100 text-yellow-800",
    },
    low: { label: "Low Confidence", className: "bg-green-100 text-green-800" },
  };
  return (
    levels[confidence?.toLowerCase()] || {
      label: confidence || "Unknown",
      className: "bg-gray-100 text-gray-800",
    }
  );
};

// Individual Result Item Component
const ResultItem = ({ result, index, citations }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(null);

  // Get the first source for display (main source)
  const mainSource = result.sources?.[0];
  const hasMultipleSources = result.sources?.length > 1;

  // Find citation for this URL
  const citation = citations?.find((c) => c.url === mainSource?.url);

  const handleCopyCitation = (format) => {
    const citationText = citation?.[format.toLowerCase()];
    if (citationText) {
      navigator.clipboard.writeText(citationText);
      setCopiedCitation(format);
      setTimeout(() => setCopiedCitation(null), 2000);
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-muted/30 shadow-sm mb-2 overflow-hidden rounded-xl">
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between p-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="text-foreground flex-shrink-0 text-sm font-semibold">
            {result.percent}%
          </div>
          <div className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
            {mainSource?.title || result.source || "Unknown source"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse result" : "Expand result"}
        >
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && mainSource && (
        <div className="border-border bg-muted/30 border-t p-3">
          {/* URL with external link */}
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">
              Source URL
            </div>
            <a
              href={mainSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm break-all underline"
            >
              <span className="break-all">{mainSource.url}</span>
              <ExternalLink className="size-3 flex-shrink-0" />
            </a>
          </div>

          {/* Badges for match type and confidence */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {mainSource.matchType && (
              <Badge
                className={cn(
                  "text-xs",
                  getMatchTypeBadge(mainSource.matchType).className,
                )}
              >
                {getMatchTypeBadge(mainSource.matchType).label}
              </Badge>
            )}
            {mainSource.confidence && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  getConfidenceBadge(mainSource.confidence).className,
                )}
              >
                {getConfidenceBadge(mainSource.confidence).label}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {mainSource.similarity || result.percent}% Similar
            </Badge>
          </div>

          {/* Snippet Preview */}
          {mainSource.snippet && (
            <div className="mb-3">
              <div className="text-muted-foreground mb-1 text-xs font-medium">
                Source Snippet
              </div>
              <div className="bg-background rounded border p-2 text-sm italic">
                "{mainSource.snippet}"
              </div>
            </div>
          )}

          {/* Matched Text */}
          {result.chunkText && (
            <div className="mb-3">
              <div className="text-muted-foreground mb-1 text-xs font-medium">
                Your Text
              </div>
              <div className="bg-background rounded border p-2 text-sm">
                {result.chunkText}
              </div>
            </div>
          )}

          {/* Multiple Sources Indicator */}
          {hasMultipleSources && (
            <div className="mb-3">
              <Badge variant="secondary" className="text-xs">
                +{result.sources.length - 1} more source
                {result.sources.length - 1 !== 1 ? "s" : ""} found
              </Badge>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(mainSource.url, "_blank")}
              className="flex items-center gap-1"
            >
              <ExternalLink className="size-3" />
              Visit Source
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const PlagiarismTab = ({ text, score: propScore, results: propResults }) => {
  const { demo } = useSelector((s) => s.settings);

  const {
    loading,
    score: realScore,
    results: realResults,
    error,
    fromCache,
    triggerCheck,
    manualRefresh,
    report,
    exactMatches,
    exactPlagiarismPercentage,
    totalChunks,
    language,
    citations,
  } = useGlobalPlagiarismCheck(text);

  // Auto-trigger check (with debounce to avoid rapid requests)
  useEffect(() => {
    if (!text?.trim()) return;

    const timeoutId = setTimeout(() => {
      triggerCheck(false);
    }, 500); // Debounce 500ms to avoid rapid requests

    return () => clearTimeout(timeoutId);
  }, [text, triggerCheck]);

  // Determine which score and results to display
  const displayScore = [true, "plagiarism_low", "plagiarism_high"].includes(
    demo,
  )
    ? propScore
    : realScore;
  const displayResults = [true, "plagiarism_low", "plagiarism_high"].includes(
    demo,
  )
    ? propResults
    : realResults;

  const isDemo = [true, "plagiarism_low", "plagiarism_high"].includes(demo);

  // Get risk level from report (for demo, use a default)
  const displayRiskLevel = isDemo
    ? propScore >= 70
      ? "HIGH"
      : propScore >= 50
        ? "MEDIUM"
        : "LOW"
    : (report?.riskLevel ?? "MEDIUM");

  return (
    <div className="w-full space-y-4">
      {/* Header Card - Always visible at top */}
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">Plagiarism Checker</h2>
            <p className="text-muted-foreground text-sm">
              Get similarity insights, matched sources, and actionable next steps.
            </p>
          </div>
          {!isDemo && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={manualRefresh}
              disabled={loading || !text?.trim()}
              aria-label="Refresh check"
              className="shrink-0"
            >
              <RefreshCcw className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <Card
        className={
          loading
            ? "bg-muted mb-4 text-center"
            : error
              ? "bg-destructive/10 mb-4 text-center"
              : "bg-primary/10 mb-4 text-center"
        }
      >
        <CardContent className="flex min-h-24 flex-col items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-muted-foreground border-muted-foreground/30 border-t-primary mb-1 inline-block size-6 animate-spin rounded-full border-2" />
              <div className="text-muted-foreground text-xs">
                Checking plagiarism...
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center">
              <div className="text-destructive text-2xl font-semibold">
                Error
              </div>
              <div className="text-destructive mt-1 text-xs">{error}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={manualRefresh}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div id="plagiarism_score" className="text-3xl font-semibold">
                  {displayScore != null ? `${displayScore}%` : "--"}
                </div>
                {!isDemo && report && (
                  <Badge
                    className={cn(
                      "text-xs",
                      getRiskBadgeClasses(displayRiskLevel),
                    )}
                  >
                    {getRiskLabel(displayRiskLevel)}
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground text-xs">Plagiarism</div>

              {/* Additional info badges */}
              {!isDemo && !loading && !error && (
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  {exactMatches && exactMatches.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {exactMatches.length} exact match
                      {exactMatches.length !== 1 ? "es" : ""}
                    </Badge>
                  )}
                  {language && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Globe className="size-3" />
                      {language.name || language.code}
                    </Badge>
                  )}
                  {citations && citations.length > 0 && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-xs"
                    >
                      <FileText className="size-3" />
                      {citations.length} citation
                      {citations.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div id="plagiarism_results" className="mt-4">
        <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
          <span>Results ({displayResults.length})</span>
          {!isDemo &&
            exactPlagiarismPercentage != null &&
            exactPlagiarismPercentage > 0 && (
              <Badge variant="destructive" className="text-xs">
                {exactPlagiarismPercentage}% exact
              </Badge>
            )}
        </div>

        {displayResults?.map((r, i) => (
          <ResultItem
            key={i}
            result={r}
            index={i}
            citations={isDemo ? [] : citations}
          />
        ))}

        {!loading && !error && displayResults.length === 0 && (
          <div className="text-muted-foreground text-sm">No matches found.</div>
        )}
      </div>
    </div>
  );
};

export default PlagiarismTab;
