'use client';

import { useRef, useState } from 'react';
import { Trophy, Globe, Zap, BookOpen, Clock, Download, Copy, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NobelImpactScore } from '@/lib/nobel-engine';

interface NobelScoreCardProps {
  analysis: NobelImpactScore;
  projectTitle?: string;
  onClose: () => void;
}

function MiniBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-300">{label}</span>
        <span className="text-white font-semibold">{score}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function NobelScoreCard({ analysis, projectTitle = 'Untitled', onClose }: NobelScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const topBenchmark = Object.entries({
    'Rabindranath Tagore': analysis.benchmarks.vsTagore,
    'Leo Tolstoy': analysis.benchmarks.vsTolstoy,
    'Toni Morrison': analysis.benchmarks.vsMorrison,
  }).sort(([, a], [, b]) => b - a)[0];

  const scoreColor =
    analysis.overall >= 75 ? 'text-amber-400' :
    analysis.overall >= 55 ? 'text-blue-400' :
    'text-zinc-400';

  const barColor =
    analysis.overall >= 75 ? 'bg-amber-400' :
    analysis.overall >= 55 ? 'bg-blue-400' :
    'bg-zinc-400';

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `nobel-score-${projectTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
    } catch {
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyText = async () => {
    const text =
      `My writing "${projectTitle}" scores ${analysis.overall}/100 on the Nobel Impact Engine\n` +
      `• Universal Themes: ${analysis.universalThemes}%\n` +
      `• Emotional Depth: ${analysis.emotionalDepth}%\n` +
      `• Innovation: ${analysis.structuralInnovation}%\n` +
      `• Accessibility: ${analysis.accessibility}%\n` +
      `• Longevity: ${analysis.longevity}%\n` +
      `Top match: ${topBenchmark?.[0] ?? ''} (${topBenchmark?.[1] ?? 0}%)\n` +
      `Powered by Shothik AI — shothik.ai`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm font-medium">Your Nobel Score Card</span>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2d45 50%, #0d1b2a 100%)',
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-brand to-amber-500" />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">
                    Nobel Impact Engine
                  </span>
                </div>
                <h2 className="text-white font-bold text-lg leading-tight truncate max-w-[280px]">
                  {projectTitle}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <div className={cn('text-5xl font-black', scoreColor)}>{analysis.overall}</div>
                <div className="text-white/40 text-xs">/100</div>
              </div>
            </div>

            {/* Dimension Bars */}
            <div className="space-y-2.5 mb-6">
              <MiniBar label="Universal Themes" score={analysis.universalThemes} color={barColor} />
              <MiniBar label="Emotional Depth" score={analysis.emotionalDepth} color={barColor} />
              <MiniBar label="Innovation" score={analysis.structuralInnovation} color={barColor} />
              <MiniBar label="Accessibility" score={analysis.accessibility} color={barColor} />
              <MiniBar label="Longevity" score={analysis.longevity} color={barColor} />
            </div>

            {/* Top Benchmark */}
            {topBenchmark && (
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-white/70 text-sm">Closest match</span>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-semibold">{topBenchmark[0]}</div>
                  <div className="text-amber-400 text-xs font-bold">{topBenchmark[1]}% match</div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-brand rounded flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/60 text-xs font-medium">Shothik AI</span>
              </div>
              <span className="text-white/30 text-xs">shothik.ai</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Generating...' : 'Download PNG'}
          </button>
          <button
            onClick={handleCopyText}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
        </div>
      </div>
    </div>
  );
}
