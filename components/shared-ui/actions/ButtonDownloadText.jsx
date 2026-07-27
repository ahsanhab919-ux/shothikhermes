"use client";
import { cn } from "@/lib/utils";
import { Check, Download } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { downloadFile } from "../../tools/common/downloadfile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ButtonDownloadText = ({
  className,
  text,
  onClick,
  children,
  name,
  ...props
}) => {
  const [showDownload, setShowDownload] = useState(true);

  const handleDownload = async () => {
    try {
      await downloadFile(text, name);
      toast.success("Text downloaded");
      setShowDownload(false);
      setTimeout(() => {
        setShowDownload(true);
      }, 2000);
    } catch (error) {
      console.error("Failed to download text:", error);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            handleDownload(e);
            onClick?.(e);
          }}
          className={cn(
            "flex size-8 cursor-pointer items-center justify-center rounded",
            className,
          )}
          aria-label={showDownload ? "Download text" : "Downloaded"}
          {...props}
        >
          {children ||
            (showDownload ? (
              <Download className="size-5" />
            ) : (
              <Check className="size-5" />
            ))}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{showDownload ? "Download text" : "Downloaded!"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ButtonDownloadText;
