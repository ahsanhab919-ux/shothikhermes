"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  clearAll,
  selectAllFiles,
  selectHasActiveUploads,
  selectIsModalOpen,
  selectUploadStats,
  setModalOpen
} from "@/redux/slices/uploadQueueSlice";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

export default function UploadProgressIndicator() {
  const dispatch = useDispatch();
  const stats = useSelector(selectUploadStats);
  const hasActiveUploads = useSelector(selectHasActiveUploads);
  const files = useSelector(selectAllFiles);
  const isModalOpen = useSelector(selectIsModalOpen);

  // Calculate overall progress based on individual file progress
  const overallProgress = (() => {
    if (stats.total === 0) return 0;

    // Sum up progress of all files
    const totalProgress = files.reduce((sum, file) => {
      if (file.status === "success") return sum + 100;
      if (file.status === "error") return sum + 100; // Count errors as complete for progress
      if (file.status === "uploading") return sum + (file.progress || 0);
      return sum; // idle files contribute 0
    }, 0);

    // Calculate average progress
    return Math.round(totalProgress / stats.total);
  })();

  // Don't show if modal is open or no files
  const shouldShow = !isModalOpen && stats.total > 0;

  const handleClick = () => {
    dispatch(setModalOpen(true));
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (!hasActiveUploads) {
      dispatch(clearAll());
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed right-6 bottom-6 z-50"
        >
          <div
            onClick={handleClick}
            className="bg-card border-border cursor-pointer rounded-lg border p-4 shadow-lg transition-all hover:shadow-xl"
            style={{ minWidth: "280px" }}
          >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasActiveUploads ? (
                  <Upload className="text-primary h-5 w-5 animate-pulse" />
                ) : stats.failed > 0 ? (
                  <AlertCircle className="text-destructive h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <span className="text-sm font-semibold">
                  {hasActiveUploads
                    ? "Uploading files..."
                    : stats.failed > 0
                      ? "Some uploads failed"
                      : "All files processed"}
                </span>
              </div>
              {!hasActiveUploads && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="text-muted-foreground mb-2 text-xs">
              {stats.completed} completed
              {stats.uploading > 0 && ` • ${stats.uploading} uploading`}
              {stats.failed > 0 && ` • ${stats.failed} failed`}
            </div>

            {/* Progress bar */}
            <Progress value={overallProgress} className="h-2" />

            {/* Click to expand hint */}
            <div className="text-muted-foreground mt-2 text-center text-xs">
              Click to {hasActiveUploads ? "view details" : "download files"}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
