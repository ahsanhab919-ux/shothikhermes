"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useWritingStudio } from "../providers/WritingStudioProvider";

export function EditorFooter() {
  const { wordCount, textAnalysis, documentFormat } = useWritingStudio();

  const charCount = useMemo(() => {
    return wordCount * 5;
  }, [wordCount]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 250));
  }, [wordCount]);

  const toneScore = textAnalysis?.academicToneScore || 0;
  const toneLabel = toneScore >= 80 ? "Academic"
    : toneScore >= 60 ? "Semi-formal"
    : toneScore >= 40 ? "Conversational"
    : "Casual";

  const toneColor = toneScore >= 80 ? "text-green-500"
    : toneScore >= 60 ? "text-yellow-500"
    : toneScore >= 40 ? "text-orange-500"
    : "text-zinc-400";

  return (
    <div className="h-9 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-zinc-50/80 dark:bg-[#0d1520]/30 shrink-0">
      <div className="flex items-center gap-4 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
        <span>{wordCount.toLocaleString()} Words</span>
        <span>{charCount.toLocaleString()} Characters</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Reading Time: {readingTime} min
        </span>
      </div>
      <div className="flex items-center gap-3">
        {wordCount > 20 && toneScore > 0 && (
          <div className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-brand/10", toneColor)}>
            Tone: {toneLabel}
          </div>
        )}
        {documentFormat && documentFormat !== "generic" && (
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            {documentFormat}
          </span>
        )}
      </div>
    </div>
  );
}
