'use client';

import { useState } from 'react';
import {
  FileText,
  Brain,
  Trophy,
  Type,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WritingGrammarSuggestion } from '@/hooks/useWritingGrammarCheck';

interface StatusBarProps {
  wordCount: number;
  neuralScore?: number;
  nobelImpact?: number;
  readingLevel?: string;
  grammarSuggestions?: WritingGrammarSuggestion[];
  isGrammarChecking?: boolean;
  onDismissGrammar?: (index: number) => void;
  uxIssueCount?: number;
}

export function StatusBar({
  wordCount,
  neuralScore,
  nobelImpact,
  readingLevel,
  grammarSuggestions = [],
  isGrammarChecking = false,
  onDismissGrammar,
  uxIssueCount,
}: StatusBarProps) {
  const [showGrammarPanel, setShowGrammarPanel] = useState(false);
  const count = grammarSuggestions.length;

  return (
    <div className="h-10 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-zinc-50 dark:bg-brand-surface/60 backdrop-blur-sm relative z-50">
      {/* Left: Metrics */}
      <div className="flex items-center gap-5 text-[10px] font-medium text-zinc-500">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {wordCount.toLocaleString()} Words
        </span>

        {neuralScore !== undefined && (
          <span className={cn('flex items-center gap-1.5', neuralScore >= 60 ? 'text-emerald-500' : 'text-amber-500')}>
            <Brain className="w-3.5 h-3.5" />
            Neural: {neuralScore}/100
          </span>
        )}

        {nobelImpact !== undefined && (
          <span className={cn('flex items-center gap-1.5', nobelImpact >= 60 ? 'text-emerald-500' : 'text-amber-500')}>
            <Trophy className="w-3.5 h-3.5" />
            Nobel: {nobelImpact}/100
          </span>
        )}

        {/* UX indicator */}
        {uxIssueCount !== undefined && (
          <span
            className={cn(
              'flex items-center gap-1.5',
              uxIssueCount === 0 ? 'text-emerald-500' : 'text-amber-500'
            )}
            title="UX writing quality"
          >
            <Layers className="w-3.5 h-3.5" />
            {uxIssueCount === 0 ? 'UX: Clean' : `UX: ${uxIssueCount} issue${uxIssueCount !== 1 ? 's' : ''}`}
          </span>
        )}

        {/* Grammar indicator */}
        <div className="relative">
          <button
            onClick={() => setShowGrammarPanel(p => !p)}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              count > 0
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-emerald-500 hover:text-emerald-600'
            )}
            title="Grammar suggestions"
          >
            {isGrammarChecking ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : count > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{count} suggestion{count !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>No issues</span>
              </>
            )}
          </button>

          {showGrammarPanel && count > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowGrammarPanel(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                    Grammar Suggestions
                  </span>
                  <button
                    onClick={() => setShowGrammarPanel(false)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {grammarSuggestions.map((s, i) => (
                    <div key={i} className="p-3 group">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                          {s.category}
                        </span>
                        <button
                          onClick={() => onDismissGrammar?.(i)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 mb-1.5 leading-relaxed">
                        {s.shortMessage}
                      </p>
                      {s.context && (
                        <p className="text-[10px] text-zinc-400 italic mb-1.5 truncate">
                          &ldquo;{s.context}&rdquo;
                        </p>
                      )}
                      {s.replacements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.replacements.map((r, ri) => (
                            <span
                              key={ri}
                              className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded font-mono"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <p className="text-[9px] text-zinc-400 text-center">
                    Powered by LanguageTool · Click × to dismiss
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {readingLevel && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-brand/10 text-brand">
            <Type className="w-3 h-3" />
            Reading Level: {readingLevel}
          </div>
        </div>
      )}
    </div>
  );
}
