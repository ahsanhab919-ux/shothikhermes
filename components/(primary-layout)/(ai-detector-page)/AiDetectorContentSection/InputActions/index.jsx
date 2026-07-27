"use client";

import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import useWordLimit from "@/hooks/useWordLimit";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const InputActions = ({
  className,
  isLoading,
  input,
  setInput,

  toolName,
  userPackage,

  label,
  loadingText,
  icon,
  enabled = false,
  disabled = false,
  onClear,
  onSubmit,
}) => {
  const [wordCount, setWordCount] = useState(0);
  const { wordLimit } = useWordLimit(toolName);

  useEffect(() => {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [input]);

  if (!input) return <div className="h-12" />;

  const exceedsLimit = wordCount > wordLimit && userPackage !== "unlimited";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-2",
        className,
      )}
    >
      <div
        className={`flex flex-1 items-center gap-2 ${
          label === "Fix Grammar" ? "w-full sm:w-auto" : ""
        }`}
      >
        <div
          className={`text-sm whitespace-nowrap ${
            wordCount > wordLimit ? "text-destructive" : ""
          }`}
        >
          <b>{wordCount}</b> /{" "}
          {wordLimit === 9999 ? (
            <span className="text-primary">Unlimited</span>
          ) : (
            wordLimit
          )}
        </div>

        {/* Clear text */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isLoading}
                onClick={onClear}
                aria-label="delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear text</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {exceedsLimit && (
          <Link href="/pricing">
            <Button variant="default" className="h-8 px-4 md:h-10 md:px-4">
              <SvgColor src="/navbar/diamond.svg" className="mr-2 h-5 w-5" />
              Upgrade
            </Button>
          </Link>
        )}

        <Button
          onClick={onSubmit}
          variant="default"
          disabled={!enabled ? wordCount > wordLimit : disabled || isLoading || false}
          className="h-8 px-4 whitespace-nowrap md:h-10 md:px-4"
        >
          {isLoading && <Spinner className="mr-2 size-4" />}
          {icon && !isLoading && <span className="mr-2">{icon}</span>}
          {isLoading && loadingText ? loadingText : label}
        </Button>
      </div>
    </div>
  );
};

export default InputActions;
