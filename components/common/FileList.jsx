"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Reusable FileList component for displaying uploaded files
 * @param {Object} props
 * @param {Array} props.files - Array of file objects with {filename, signed_url?, public_url?, object_name?}
 * @param {Function} props.onRemove - Callback function (index, filename) => void
 * @param {number} props.maxVisibleFiles - Maximum files to show before collapsing (default: 6)
 * @param {string} props.title - Header title (default: "Attached Files")
 * @param {boolean} props.showHeader - Whether to show the header (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.truncateLength - Max length for filename truncation (default: 35)
 * @param {boolean} props.isUploading - Whether files are currently being uploaded
 */
export default function FileList({
  files = [],
  onRemove,
  maxVisibleFiles = 6,
  title = "Attached Files",
  showHeader = true,
  className,
  truncateLength = 35,
  isUploading = false,
}) {
  const [showAllFiles, setShowAllFiles] = useState(false);

  // Reset showAllFiles when files change
  useEffect(() => {
    if (files.length === 0) {
      setShowAllFiles(false);
    }
  }, [files.length]);

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase();
  };

  // Truncate filename
  const truncateFilename = (filename, maxLength = truncateLength) => {
    if (filename.length <= maxLength) return filename;
    const extension = getFileExtension(filename);
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension.length - 4,
    );
    return `${truncatedName}...${extension}`;
  };

  // Color scheme based on file type
  const getFileTypeColor = (ext) => {
    const colors = {
      pdf: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400",
      doc: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400",
      docx: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400",
      txt: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
    };
    return (
      colors[ext] ||
      "bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:border-primary/30"
    );
  };

  if (!files || files.length === 0) {
    return null;
  }

  const displayFiles = showAllFiles ? files : files.slice(0, maxVisibleFiles);
  const hasMoreFiles = files.length > maxVisibleFiles;

  return (
    <div className={cn("mt-4 space-y-3", className)}>
      {showHeader && (
        <div className="text-muted-foreground flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>
              {title} ({files.length})
              {isUploading && (
                <span className="text-primary ml-1">• Uploading...</span>
              )}
            </span>
          </div>
          {hasMoreFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllFiles(!showAllFiles)}
              className="text-muted-foreground hover:text-foreground h-7 text-xs"
            >
              {showAllFiles ? (
                <>
                  <ChevronUp className="mr-1 h-3 w-3" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-3 w-3" />
                  Show All ({files.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <div
        className={cn(
          "relative flex flex-wrap gap-3 transition-all duration-300",
          !showAllFiles && hasMoreFiles
            ? "max-h-[280px] overflow-x-hidden overflow-y-auto"
            : "",
          "[&::-webkit-scrollbar]:w-2",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30",
        )}
      >
        {displayFiles.map((file, displayIndex) => {
          // Use actual index from full array for remove function
          const actualIndex = showAllFiles
            ? displayIndex
            : files.findIndex((f) => f.filename === file.filename);
          const extension = getFileExtension(file.filename);
          const truncatedName = truncateFilename(file.filename, truncateLength);

          return (
            <div
              key={`${file.filename}-${displayIndex}`}
              className={cn(
                "group relative flex max-w-[220px] min-w-[170px] items-center gap-3 rounded-xl border-2 p-3.5 transition-all duration-300",
                "hover:shadow-primary/10 hover:scale-[1.02] hover:shadow-lg",
                "bg-card/50 backdrop-blur-sm",
                getFileTypeColor(extension),
              )}
            >
              {/* File Icon */}
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300",
                  "group-hover:scale-110 group-hover:shadow-md",
                  extension === "pdf" &&
                    "border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/30",
                  (extension === "doc" || extension === "docx") &&
                    "border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30",
                  extension === "txt" &&
                    "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800",
                  !["pdf", "doc", "docx", "txt"].includes(extension) &&
                    "bg-primary/10 border-primary/30",
                )}
              >
                <FileText
                  className={cn(
                    "h-6 w-6",
                    extension === "pdf" && "text-red-600 dark:text-red-400",
                    (extension === "doc" || extension === "docx") &&
                      "text-blue-600 dark:text-blue-400",
                    extension === "txt" && "text-gray-600 dark:text-gray-400",
                    !["pdf", "doc", "docx", "txt"].includes(extension) &&
                      "text-primary",
                  )}
                />
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-foreground mb-1 truncate text-sm leading-tight font-semibold">
                        {truncatedName}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="break-words">{file.filename}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 border-2 px-2 text-[0.65rem] font-bold uppercase",
                      extension === "pdf" &&
                        "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400",
                      (extension === "doc" || extension === "docx") &&
                        "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400",
                      extension === "txt" &&
                        "border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-400",
                      !["pdf", "doc", "docx", "txt"].includes(extension) &&
                        "border-primary/30 text-primary",
                    )}
                  >
                    {extension}
                  </Badge>
                </div>
              </div>

              {/* Remove Button */}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(actualIndex, file.filename)}
                  disabled={isUploading}
                  className={cn(
                    "h-7 w-7 shrink-0 opacity-0 transition-all duration-200",
                    "group-hover:opacity-100",
                    "hover:bg-destructive/10 hover:text-destructive",
                    "text-muted-foreground",
                    isUploading && "cursor-not-allowed opacity-50",
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Uploading Indicator Overlay */}
              {isUploading && (
                <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-sm">
                  <Loader2 className="text-primary h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* {!showAllFiles && hasMoreFiles && (
        <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
          <span>
            +{files.length - maxVisibleFiles} more file
            {files.length - maxVisibleFiles > 1 ? "s" : ""} hidden
          </span>
          <span className="text-muted-foreground/50">•</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowAllFiles(true)}
            className="h-auto cursor-pointer p-0 text-xs underline"
          >
            Show all
          </Button>
        </div>
      )} */}
    </div>
  );
}
