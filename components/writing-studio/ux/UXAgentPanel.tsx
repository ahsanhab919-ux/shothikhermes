'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Square, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUXAnalysis } from '@/hooks/useUXAnalysis';
import { useAiCoWriter } from '@/hooks/useAiCoWriter';
import type { UXAnalysisResult, UXIssue, UXSeverity } from '@/lib/ux-agent-engine';

interface UXAgentPanelProps {
  content: string;
  externalResult?: UXAnalysisResult | null;
}

const SEVERITY_COLORS: Record<UXSeverity, string> = {
  error: 'bg-red-500',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
};

const SEVERITY_TEXT: Record<UXSeverity, string> = {
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const SEVERITY_BORDER: Record<UXSeverity, string> = {
  error: 'border-l-red-500',
  warning: 'border-l-amber-400',
  info: 'border-l-blue-400',
};

function GaugeArc({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const r = 44;
  const cx = 60;
  const cy = 58;
  const startAngle = 210;
  const endAngle = 330;
  const totalArc = 300;

  const polarToXY = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start = polarToXY(startAngle);
  const end = polarToXY(endAngle);
  const bgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`;

  const fillAngle = startAngle + (totalArc * clampedScore) / 100;
  const fillEnd = polarToXY(fillAngle);
  const largeArc = totalArc * clampedScore / 100 > 180 ? 1 : 0;
  const fillPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`;

  const color =
    clampedScore >= 70 ? '#22c55e' : clampedScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center py-3">
      <svg width="120" height="80" viewBox="0 0 120 80">
        <path
          d={bgPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-zinc-200 dark:text-zinc-800"
        />
        {clampedScore > 0 && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill={color}
        >
          {clampedScore}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="7"
          fill="#94a3b8"
        >
          READABILITY
        </text>
      </svg>
    </div>
  );
}

function IssueRow({ issue }: { issue: UXIssue }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        'border-l-2 pl-3 pr-2 py-2.5 bg-white dark:bg-zinc-900/40 rounded-r-lg mb-1.5',
        SEVERITY_BORDER[issue.severity]
      )}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-start gap-2"
      >
        <span
          className={cn(
            'shrink-0 w-1.5 h-1.5 rounded-full mt-1.5',
            SEVERITY_COLORS[issue.severity]
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest',
                SEVERITY_TEXT[issue.severity]
              )}
            >
              {issue.label}
            </span>
            <code className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
              {issue.excerpt}
            </code>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-3.5">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {issue.description}
          </p>
          {issue.fix && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
              → {issue.fix}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DeepReviewSection({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [streamOutput, setStreamOutput] = useState('');
  const [done, setDone] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { generate, isGenerating, streamedText, abort } = useAiCoWriter();

  useEffect(() => {
    if (streamedText) setStreamOutput(streamedText);
  }, [streamedText]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamOutput]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        if (!expanded) {
          setExpanded(true);
          startReview();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expanded, content]);

  const startReview = async () => {
    setStreamOutput('');
    setDone(false);

    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    const instruction = `You are a senior UX writer who has shipped products at Replit, Stripe, and Linear.

Perform a comprehensive UX writing audit of the following document text. Be specific, practical, and direct.

Format your response exactly as:

## Summary
One paragraph overview of the UX writing quality.

## Critical Issues
Numbered list. For each issue: Problem → Why it matters → Fix

## Quick Wins
Bullet list of 3–5 small improvements that take under 5 minutes.

## Tone Assessment
One paragraph: Is the tone appropriate? Consistent? What persona does it project?

---

Document text:
${plainText}`;

    await generate({
      currentText: plainText,
      context: '',
      mode: 'instruction',
      instruction,
    });

    setDone(true);
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800">
      {!expanded ? (
        <button
          onClick={() => { setExpanded(true); startReview(); }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors group"
        >
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
            <span className="text-xs font-medium">▶  Run Deep Review</span>
          </div>
          <kbd className="text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
            ⌘⇧U
          </kbd>
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Deep Review
              </span>
              {isGenerating && (
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-brand animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  onClick={abort}
                  title="Stop"
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              ) : done ? (
                <button
                  onClick={startReview}
                  className="text-[9px] font-bold text-brand hover:underline uppercase tracking-wide"
                >
                  Run Again
                </button>
              ) : null}
            </div>
          </div>

          <div
            ref={terminalRef}
            className="bg-brand-dark dark:bg-brand-canvas font-mono text-xs text-zinc-300 p-4 max-h-80 overflow-y-auto custom-scrollbar border-l-2 border-brand/30 whitespace-pre-wrap leading-relaxed"
          >
            {streamOutput || (
              <span className="text-zinc-500 animate-pulse">Initializing review…</span>
            )}
            {isGenerating && (
              <span className="inline-block w-1.5 h-3.5 bg-brand ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function UXAgentPanel({ content, externalResult }: UXAgentPanelProps) {
  const internalResult = useUXAnalysis(externalResult !== undefined ? '' : content);
  const result = externalResult !== undefined ? externalResult : internalResult;

  const isAnalysing = result === null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Section 1: Live Analysis */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Live Analysis
            </span>
            {isAnalysing && (
              <span className="text-[9px] text-zinc-400 animate-pulse">analysing…</span>
            )}
          </div>

          {isAnalysing ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-zinc-400">Running UX analysis…</p>
            </div>
          ) : result ? (
            <>
              <GaugeArc score={result.readabilityScore} />

              <p className="text-center text-[10px] text-zinc-500 -mt-1 mb-3">
                {result.gradeLevel}
              </p>

              <div className="flex gap-2 justify-center mb-3">
                <StatPill label="Sentences" value={result.sentenceCount} />
                <StatPill label="Avg words" value={result.avgWordsPerSentence} />
                <StatPill
                  label="Issues"
                  value={result.issues.length}
                  highlight={result.issues.length > 0}
                />
              </div>

              {result.issues.length === 0 ? (
                <div className="flex flex-col items-center py-4 gap-2 text-emerald-500">
                  <ShieldCheck className="w-6 h-6" />
                  <p className="text-xs font-medium">No UX issues. Clean copy.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {result.issues.map(issue => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-6 gap-2 text-zinc-400">
              <ShieldCheck className="w-6 h-6" />
              <p className="text-xs">Start writing to see analysis.</p>
            </div>
          )}
        </div>

        {/* Section 2: Deep Review */}
        <DeepReviewSection content={content} />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-2.5 py-1.5 rounded-lg text-center',
        highlight
          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      )}
    >
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[9px] uppercase tracking-wide">{label}</span>
    </div>
  );
}
