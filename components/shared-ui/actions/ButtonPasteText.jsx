"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ClipboardPaste } from "lucide-react";

const ButtonPasteText = ({
  className,
  onApply,
  onClick,
  isTooltip = true,
  children,
  ...props
}) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onApply?.(text);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const button = (
    <Button
      variant="outline"
      size="sm"
      className={cn("shrink-0 whitespace-nowrap", className)}
      onClick={(e) => {
        handlePaste();
        onClick?.(e);
      }}
      {...props}
    >
      <ClipboardPaste className="size-4" />
      Paste Text
    </Button>
  );

  if (!isTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">
        <p>Paste text</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ButtonPasteText;
