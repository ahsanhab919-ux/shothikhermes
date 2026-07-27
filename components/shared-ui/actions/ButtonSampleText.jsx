"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

const ButtonSampleText = ({
  className,
  sample = "",
  onApply,
  onClick,
  isTooltip = true,
  children,
  ...props
}) => {
  const handleSampleText = () => {
    try {
      if (!sample) return;

      onApply?.(sample);
    } catch (error) {
      console.error("Failed to apply sample text:", error);
    }
  };

  const button = (
    <Button
      variant="outline"
      size="sm"
      className={cn("shrink-0 whitespace-nowrap", className)}
      onClick={(e) => {
        handleSampleText();
        onClick?.(e);
      }}
      {...props}
    >
      <FileText className="size-4" />
      Try Sample
    </Button>
  );

  if (!isTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">
        <p>Try sample text</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ButtonSampleText;
