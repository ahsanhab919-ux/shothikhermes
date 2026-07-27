"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { BookOpen, MessageSquare, FolderOpen, PenLine } from "lucide-react";

interface KnowledgeSource {
  type: "writing_history" | "project" | "chat" | "manual";
  count: number;
}

interface KnowledgeBarProps {
  score: number;
  sources?: KnowledgeSource[];
  className?: string;
}

const SOURCE_ICONS = {
  writing_history: PenLine,
  project: FolderOpen,
  chat: MessageSquare,
  manual: BookOpen,
};

const SOURCE_COLORS = {
  writing_history: "text-success",
  project: "text-primary",
  chat: "text-accent-foreground",
  manual: "text-warning",
};

export default function KnowledgeBar({ score, sources = [], className }: KnowledgeBarProps) {
  const { t } = useTranslation();

  const sourceLabels: Record<string, string> = {
    writing_history: t("twinDashboard.writingHistory"),
    project: t("twinDashboard.projects"),
    chat: t("twinDashboard.chatSessions"),
    manual: t("twinDashboard.manualInput"),
  };

  const level =
    score >= 80 ? { label: t("twinDashboard.expert"), color: "text-success" } :
    score >= 50 ? { label: t("twinDashboard.intermediate"), color: "text-primary" } :
    score >= 20 ? { label: t("twinDashboard.beginner"), color: "text-warning" } :
    { label: t("twinDashboard.untrained"), color: "text-muted-foreground" };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{t("twinDashboard.knowledgeLevel")}</span>
          <span className={cn("text-sm font-semibold", level.color)}>
            {level.label} — {score}%
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-1000"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("twinDashboard.knowledgeSources")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sources.map((s) => {
              const Icon = SOURCE_ICONS[s.type];
              const color = SOURCE_COLORS[s.type];
              const label = sourceLabels[s.type];
              return (
                <div
                  key={s.type}
                  className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2"
                >
                  <span className={cn("shrink-0", color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.count !== 1 ? t("twinDashboard.items", { count: s.count }) : t("twinDashboard.item", { count: s.count })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
