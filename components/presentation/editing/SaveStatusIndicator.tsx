"use client";

import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Loader2, Save, XCircle } from "lucide-react";

interface SaveStatusIndicatorProps {
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  errorMessage?: string | null;
  onManualSave: () => void;
  hasUnsavedChanges: boolean;
}

/**
 * Save Status Indicator Component
 * Shows visual feedback for save status with manual save option
 */
export function SaveStatusIndicator({
  saveStatus,
  lastSavedAt,
  errorMessage,
  onManualSave,
  hasUnsavedChanges,
}: SaveStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (saveStatus) {
      case "saving":
        return <Loader2 className="text-primary h-4 w-4 animate-spin" />;
      case "saved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="text-destructive h-4 w-4" />;
      default:
        return hasUnsavedChanges ? (
          <Clock className="h-4 w-4 text-yellow-500" />
        ) : null;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return lastSavedAt
          ? `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`
          : "Saved";
      case "error":
        return errorMessage || "Save failed";
      default:
        return hasUnsavedChanges ? "Unsaved changes" : "All changes saved";
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Status Icon */}
      {getStatusIcon() && (
        <div className="flex items-center">{getStatusIcon()}</div>
      )}

      {/* Status Text */}
      <span
        className={
          saveStatus === "error"
            ? "text-destructive"
            : saveStatus === "saved"
              ? "text-green-600 dark:text-green-400"
              : hasUnsavedChanges
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-muted-foreground"
        }
      >
        {getStatusText()}
      </span>

      {/* Manual Save Button */}
      {hasUnsavedChanges &&
        saveStatus !== "saving" &&
        saveStatus !== "saved" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onManualSave}
            className="h-7 px-2 text-xs"
          >
            <Save className="mr-1 h-3 w-3" />
            Save Now
          </Button>
        )}
    </div>
  );
}
