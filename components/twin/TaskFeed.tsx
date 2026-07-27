"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import {
  Search,
  PenLine,
  BarChart2,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const Marked = dynamic(() => import("marked-react").then((m) => m.default), {
  ssr: false,
  loading: () => <p className="text-xs text-muted-foreground p-3">Loading…</p>,
});

interface Task {
  _id: string;
  title: string;
  description?: string;
  taskType: "research" | "writing" | "analysis" | "summary";
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  createdAt: number;
  completedAt?: number;
}

interface TaskFeedProps {
  tasks: Task[];
  className?: string;
  onContinueInWritingStudio?: (task: Task) => void;
}

const TYPE_KEYS = {
  research: "twinDashboard.research",
  writing: "twinDashboard.writing",
  analysis: "twinDashboard.analysis",
  summary: "twinDashboard.summary",
} as const;

const TYPE_ICONS = {
  research: Search,
  writing: PenLine,
  analysis: BarChart2,
  summary: FileText,
};

const TYPE_COLORS = {
  research: { color: "text-warning", bg: "bg-warning/10" },
  writing: { color: "text-success", bg: "bg-muted" },
  analysis: { color: "text-primary", bg: "bg-muted" },
  summary: { color: "text-accent-foreground", bg: "bg-muted" },
};

const STATUS_KEYS = {
  pending: "twinDashboard.queued",
  running: "twinDashboard.running",
  completed: "twinDashboard.completed",
  failed: "twinDashboard.failed",
} as const;

const STATUS_ICONS = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const STATUS_COLORS: Record<Task["status"], { color: string; spin?: boolean }> = {
  pending: { color: "text-muted-foreground" },
  running: { color: "text-primary", spin: true },
  completed: { color: "text-success" },
  failed: { color: "text-destructive" },
};

function TaskCard({
  task,
  onContinueInWritingStudio,
}: {
  task: Task;
  onContinueInWritingStudio?: (task: Task) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const typeColors = TYPE_COLORS[task.taskType];
  const TypeIcon = TYPE_ICONS[task.taskType];
  const statusColors = STATUS_COLORS[task.status];
  const StatusIcon = STATUS_ICONS[task.status];
  const isWritingTask = task.taskType === "writing";

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  return (
    <div className="rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", typeColors.bg)}>
          <TypeIcon className={cn("h-4 w-4", typeColors.color)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
            <div className="flex shrink-0 items-center gap-1">
              <StatusIcon
                className={cn("h-4 w-4", statusColors.color, statusColors.spin && "animate-spin")}
              />
              <span className={cn("text-xs font-medium", statusColors.color)}>{t(STATUS_KEYS[task.status])}</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
              {t(TYPE_KEYS[task.taskType])}
            </span>
            <span>{timeAgo(task.createdAt)}</span>
          </div>
        </div>
      </div>

      {task.result && (
        <div className="border-t border-border">
          <button
            onClick={() => setExpanded((p) => !p)}
            aria-expanded={expanded}
            className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span>{t("twinDashboard.viewResult")}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-2">
              <div className="text-xs text-muted-foreground leading-relaxed bg-muted rounded-lg p-3 prose prose-xs prose-neutral dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs [&_h4]:text-xs">
                <Marked>{task.result}</Marked>
              </div>
              {onContinueInWritingStudio && (
                <button
                  type="button"
                  onClick={() => onContinueInWritingStudio(task)}
                  className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Continue in Writing Studio
                </button>
              )}
              {isWritingTask && (
                <div className="flex items-start gap-2 rounded-lg bg-warning/5 border border-warning/20 p-2.5" role="note">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t("twinDashboard.academicIntegrityNotice")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TaskFeed({ tasks, className, onContinueInWritingStudio }: TaskFeedProps) {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">{t("twinDashboard.noTasksYet")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("twinDashboard.noTasksHint")}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} onContinueInWritingStudio={onContinueInWritingStudio} />
      ))}
    </div>
  );
}
