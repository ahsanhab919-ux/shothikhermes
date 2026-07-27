import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Accessibility,
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  FileCheck,
  Gauge,
  Palette,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

const getScoreVariant = (score) => {
  if (score >= 0.9) return "default";
  if (score >= 0.7) return "secondary";
  return "destructive";
};

const getScoreIcon = (score) => {
  if (score >= 0.9) return <CheckCircle className="text-primary size-4" />;
  if (score >= 0.7)
    return <AlertTriangle className="text-secondary-foreground size-4" />;
  return <XCircle className="text-destructive size-4" />;
};

const getScoreLabel = (score) => {
  if (score >= 0.9) return "Excellent";
  if (score >= 0.8) return "Good";
  if (score >= 0.7) return "Acceptable";
  if (score >= 0.6) return "Needs Improvement";
  return "Poor";
};

export default function QualityValidationPanel({
  qualityMetrics = {},
  validationResult = {},
  isValidating = false,
  onApplyAutoFixes,
  onRegenerateWithFeedback,
  onViewDetails,
}) {
  // Default values for demo/loading states
  const defaultMetrics = {
    overall: 0.85,
    contentAccuracy: 0.88,
    designQuality: 0.82,
    requirementCompliance: 0.9,
    accessibility: 0.79,
    performance: 0.85,
  };

  const defaultResult = {
    status: "completed",
    needsImprovement: false,
    contentSuggestions: [],
    designSuggestions: [],
    requirementSuggestions: [],
    accessibilitySuggestions: [],
    performanceSuggestions: [],
  };

  const metrics = { ...defaultMetrics, ...qualityMetrics };
  const result = { ...defaultResult, ...validationResult };

  const qualityCategories = [
    {
      id: "contentAccuracy",
      title: "Content Accuracy",
      description: "Factual correctness and research quality",
      icon: FileCheck,
      score: metrics.contentAccuracy,
      suggestions: result.contentSuggestions || [],
    },
    {
      id: "designQuality",
      title: "Design Quality",
      description: "Visual hierarchy and aesthetic appeal",
      icon: Palette,
      score: metrics.designQuality,
      suggestions: result.designSuggestions || [],
    },
    {
      id: "requirementCompliance",
      title: "Requirement Compliance",
      description: "Adherence to user specifications",
      icon: ClipboardCheck,
      score: metrics.requirementCompliance,
      suggestions: result.requirementSuggestions || [],
    },
    {
      id: "accessibility",
      title: "Accessibility",
      description: "WCAG compliance and inclusivity",
      icon: Accessibility,
      score: metrics.accessibility,
      suggestions: result.accessibilitySuggestions || [],
    },
    {
      id: "performance",
      title: "Performance",
      description: "Load times and optimization",
      icon: Gauge,
      score: metrics.performance,
      suggestions: result.performanceSuggestions || [],
    },
  ];

  if (isValidating) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mb-4">
            <Progress value={undefined} className="w-full" />
          </div>
          <h6 className="mb-2 text-lg font-semibold">
            Validating Presentation Quality...
          </h6>
          <p className="text-muted-foreground text-sm">
            Our QA Agent is analyzing content accuracy, design quality, and user
            requirements
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Overall Quality Score */}
      <Card className="mb-6">
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <h6 className="text-lg font-semibold">Overall Quality Score</h6>
            <Badge
              variant={getScoreVariant(metrics.overall)}
              className="px-4 py-1 text-base"
            >
              <span className="mr-1">{getScoreIcon(metrics.overall)}</span>
              {Math.round(metrics.overall * 100)}%
            </Badge>
          </div>

          <Progress
            value={metrics.overall * 100}
            className={cn(
              "mb-4 h-2 rounded-full",
              metrics.overall >= 0.9 && "[&>div]:bg-primary",
              metrics.overall >= 0.7 &&
                metrics.overall < 0.9 &&
                "[&>div]:bg-secondary",
              metrics.overall < 0.7 && "[&>div]:bg-destructive",
            )}
          />

          <p className="text-muted-foreground mt-2 text-sm">
            {getScoreLabel(metrics.overall)} -{" "}
            {metrics.overall >= 0.9
              ? "Ready for presentation!"
              : metrics.overall >= 0.7
                ? "Minor improvements recommended"
                : "Significant improvements needed"}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {qualityCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card key={category.id} className="h-full">
              <CardContent>
                <div className="mb-4 flex items-center">
                  <div className="text-primary mr-2">
                    <IconComponent className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h6 className="text-base font-semibold">
                      {category.title}
                    </h6>
                    <p className="text-muted-foreground text-sm">
                      {category.description}
                    </p>
                  </div>
                  <Badge
                    variant={getScoreVariant(category.score)}
                    className="text-xs"
                  >
                    {Math.round(category.score * 100)}%
                  </Badge>
                </div>

                <Progress
                  value={category.score * 100}
                  className={cn(
                    "mb-4 h-2",
                    category.score >= 0.9 && "[&>div]:bg-primary",
                    category.score >= 0.7 &&
                      category.score < 0.9 &&
                      "[&>div]:bg-secondary",
                    category.score < 0.7 && "[&>div]:bg-destructive",
                  )}
                />

                {category.suggestions.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">
                      Suggestions:
                    </p>
                    {category.suggestions
                      .slice(0, 2)
                      .map((suggestion, index) => (
                        <p key={index} className="mt-1 text-xs">
                          • {suggestion}
                        </p>
                      ))}
                    {category.suggestions.length > 2 && (
                      <p className="text-primary mt-1 cursor-pointer text-xs">
                        +{category.suggestions.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts and Recommendations */}
      {result.needsImprovement && (
        <Alert
          variant="default"
          className="border-secondary/50 bg-secondary/10 mb-6"
        >
          <AlertTriangle className="text-secondary-foreground size-4" />
          <AlertTitle>Quality Improvements Recommended</AlertTitle>
          <AlertDescription>
            Some aspects of your presentation could be enhanced. Review the
            suggestions above or use our auto-fix feature.
          </AlertDescription>
        </Alert>
      )}

      {metrics.overall >= 0.9 && (
        <Alert
          variant="default"
          className="border-primary/50 bg-primary/10 mb-6"
        >
          <CheckCircle className="text-primary size-4" />
          <AlertTitle>Excellent Quality!</AlertTitle>
          <AlertDescription>
            Your presentation meets high-quality standards and is ready for
            delivery.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        {result.needsImprovement && (
          <>
            <Button
              variant="default"
              onClick={onApplyAutoFixes}
              className="bg-primary hover:bg-primary/90"
            >
              <Sparkles className="mr-2 size-4" />
              Apply Auto-Fixes
            </Button>

            <Button
              variant="outline"
              onClick={onRegenerateWithFeedback}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <RefreshCw className="mr-2 size-4" />
              Regenerate with Feedback
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          onClick={onViewDetails}
          className="text-primary"
        >
          View Detailed Report
        </Button>
      </div>

      {/* Quality Timeline */}
      <Card className="mt-6">
        <CardContent>
          <h6 className="mb-4 text-lg font-semibold">Validation Process</h6>
          <div className="pl-4">
            <div className="mb-2 flex items-center">
              <CheckCircle className="text-primary mr-4 size-5" />
              <p className="text-sm">Content accuracy verified</p>
            </div>
            <div className="mb-2 flex items-center">
              <CheckCircle className="text-primary mr-4 size-5" />
              <p className="text-sm">Design principles applied</p>
            </div>
            <div className="mb-2 flex items-center">
              <CheckCircle className="text-primary mr-4 size-5" />
              <p className="text-sm">User requirements validated</p>
            </div>
            <div className="mb-2 flex items-center">
              <CheckCircle className="text-primary mr-4 size-5" />
              <p className="text-sm">Accessibility standards checked</p>
            </div>
            <div className="flex items-center">
              <CheckCircle className="text-primary mr-4 size-5" />
              <p className="text-sm">Performance optimized</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
