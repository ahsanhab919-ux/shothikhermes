"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { Bot, UserX } from "lucide-react";
import { useState } from "react";

interface TwinAvatarProps {
  name: string;
  isActive: boolean;
  knowledgeScore: number;
  trainingStatus: "untrained" | "partial" | "trained";
  avatarUrl?: string;
  className?: string;
  verificationBadge?: boolean;
  lifecycleState?: string;
  isOrphan?: boolean;
  masterName?: string;
}

export default function TwinAvatar({
  name,
  isActive,
  knowledgeScore,
  trainingStatus,
  avatarUrl,
  className,
  verificationBadge,
  lifecycleState,
  isOrphan = false,
  masterName,
}: TwinAvatarProps) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const statusColor = isOrphan
    ? "bg-muted-foreground/40"
    : isActive
    ? "bg-success"
    : trainingStatus === "untrained"
    ? "bg-muted-foreground/40"
    : "bg-warning";

  const statusLabel = isOrphan
    ? t("twinDashboard.orphan")
    : isActive
    ? t("twinDashboard.active")
    : trainingStatus === "untrained"
    ? t("twinDashboard.notYetTrained")
    : t("twinDashboard.standby");

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isActive && !isOrphan && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30 scale-110" />
        )}
        <div
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full border-4 text-2xl font-bold shadow-lg transition-all",
            isOrphan
              ? "border-muted-foreground/30 bg-muted grayscale"
              : isActive
              ? "border-primary bg-primary text-white"
              : trainingStatus === "untrained"
              ? "border-border bg-muted"
              : "border-primary/70 bg-primary/80 text-white"
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className={cn(
                "h-full w-full rounded-full object-cover",
                isOrphan && "opacity-50 grayscale"
              )}
            />
          ) : isOrphan ? (
            <UserX className="h-10 w-10 text-muted-foreground" />
          ) : trainingStatus === "untrained" ? (
            <Bot className="h-10 w-10 text-muted-foreground" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <span
          className={cn(
            "absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card",
            statusColor
          )}
        />

        {showTooltip && isOrphan && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg bg-popover border border-border px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
            {t("twinDashboard.orphanTwin")}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-foreground flex items-center justify-center gap-1">
          {name}
          {verificationBadge && !isOrphan && (
            <svg className="h-4 w-4 text-primary shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </p>

        {isOrphan ? (
          <p className="text-xs text-warning font-medium">{t("twinDashboard.orphanTwin")}</p>
        ) : masterName ? (
          <p className="text-xs text-muted-foreground">
            {t("twinDashboard.linkedMaster", { name: masterName })}
          </p>
        ) : lifecycleState ? (
          <p className="text-xs text-muted-foreground">
            {lifecycleState.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{statusLabel}</p>
        )}
      </div>

      <div className="w-full max-w-[160px]">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">{t("twinDashboard.knowledge")}</span>
          <span className={cn("font-medium", isOrphan ? "text-muted-foreground" : "text-primary")}>
            {knowledgeScore}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            role="progressbar"
            aria-valuenow={knowledgeScore}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn(
              "h-1.5 rounded-full transition-all duration-700",
              isOrphan
                ? "bg-muted-foreground/40"
                : "bg-primary"
            )}
            style={{ width: `${knowledgeScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
