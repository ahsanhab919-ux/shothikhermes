"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { detectIntent, IntentDetection } from "@/lib/intent";
import {
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface IntentDetectorProps {
  text: string;
  onChange?: (intent: IntentDetection) => void;
  autoDetect?: boolean;
  debounceMs?: number;
}

export function IntentDetector({
  text,
  onChange,
  autoDetect = true,
  debounceMs = 250,
}: IntentDetectorProps) {
  const [intent, setIntent] = useState<IntentDetection | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const runDetection = useCallback(() => {
    setIsDetecting(true);
    const detected = detectIntent(text);
    setIntent(detected);
    onChange?.(detected);
    setTimeout(() => setIsDetecting(false), 300);
  }, [text, onChange]);

  useEffect(() => {
    if (!autoDetect || !text) return;

    const timer = setTimeout(() => {
      runDetection();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, autoDetect, debounceMs, runDetection]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pitch_deck: "Pitch Deck",
      educational_lecture: "Educational Lecture",
      marketing_overview: "Marketing Overview",
      research_summary: "Research Summary",
      technical_demo: "Technical Demo",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pitch_deck: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      educational_lecture: "bg-green-500/10 text-green-700 dark:text-green-400",
      marketing_overview:
        "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      research_summary: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      technical_demo: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
    };
    return colors[type] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.4) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (!intent) {
    return (
      <Card data-testid="intent-detector">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            Intent Detection
          </CardTitle>
          <CardDescription>Analyzing presentation intent...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="intent-detector" className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            Intent Detection
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={runDetection}
            disabled={isDetecting}
            data-testid="button-rerun-intent"
          >
            <RefreshCw
              className={`h-4 w-4 ${isDetecting ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <CardDescription>
          Automatically detected from your content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <Target className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium">Type</p>
              <Badge
                className={getTypeColor(intent.type)}
                data-testid="badge-type"
              >
                {getTypeLabel(intent.type)}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium">Audience</p>
              <Badge variant="secondary" data-testid="badge-audience">
                {intent.audience}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="text-muted-foreground mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium">Tone</p>
              <Badge variant="outline" data-testid="badge-tone">
                {intent.tone}
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Confidence</p>
            <span
              className={`text-sm font-semibold ${getConfidenceColor(intent.confidence)}`}
              data-testid="text-confidence"
            >
              {Math.round(intent.confidence * 100)}%
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${intent.confidence * 100}%` }}
            />
          </div>
        </div>

        {intent.keywords.length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-medium">Detected Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {intent.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs"
                  data-testid={`keyword-${index}`}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
