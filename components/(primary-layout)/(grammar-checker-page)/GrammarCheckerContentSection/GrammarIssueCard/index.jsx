"use client";

import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";

const GrammarIssueCard = ({
  issue,
  handleAccept,
  handleIgnore,
  isCollapsed,
  handleIsCollapsed,
}) => {
  const { error, correct, sentence, type } = issue || {};

  // Fix: Properly highlight the error in the sentence
  const getHighlightedText = () => {
    if (!sentence || !error) return sentence;

    const escapedWord = error.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedWord, "gi");

    return sentence.replace(
      regex,
      (match) =>
        `<span class="text-red-500 line-through">${match}</span> <span class="text-primary">${correct}</span>`,
    );
  };

  const highlightedText = getHighlightedText();

  return (
    <div
      onClick={() => handleIsCollapsed?.()}
      className="w-full max-w-[360px] py-2"
    >
      <div className="text-muted-foreground relative flex items-center justify-between px-3 text-sm">
        <span className="absolute top-1/2 left-0 h-3 w-1.5 -translate-y-1/2 rounded-e-full bg-red-500" />
        <span className="block text-xs font-medium">
          Correct the {type?.toLowerCase() || "grammar"} error
        </span>
        <div className="h-6">
          <div
            className={cn("flex items-center justify-start gap-2", {
              hidden: isCollapsed,
            })}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAccept(issue);
              }}
              className="flex size-6 items-center justify-center gap-1 rounded-md text-sm text-green-600 transition-colors hover:bg-green-600/10"
              aria-label="Accept correction"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleIgnore(issue);
              }}
              className="hover:bg-muted text-muted-foreground flex size-6 items-center justify-center gap-1 rounded-md text-sm transition-colors"
              aria-label="Ignore suggestion"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-1 px-4">
        <div className="flex items-center gap-2 rounded-md text-sm">
          <p className="font-medium text-red-500 line-through">{error}</p>
          <span className="bg-muted-foreground h-4 w-px" />
          <p className="font-medium text-green-600">{correct}</p>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-300",
          {
            "max-h-0 opacity-0": !isCollapsed,
            "max-h-96 opacity-100": isCollapsed,
          },
        )}
      >
        <div className="my-2 px-4">
          <div
            className="text-muted-foreground text-xs"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedText) }}
          />
        </div>
        <div className="mt-2 flex items-center justify-start gap-2 px-4">
          <button
            className="bg-primary text-primary-foreground flex h-8 items-center gap-2 rounded-md px-4 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAccept(issue);
            }}
            aria-label="Accept correction"
          >
            <Check className="size-4" />
            <span>Accept</span>
          </button>
          <button
            className="flex h-8 items-center gap-2 rounded-md bg-muted/50 px-4 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleIgnore(issue);
            }}
            aria-label="Ignore suggestion"
          >
            <Trash2 className="size-4" />
            <span>Ignore</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrammarIssueCard;
