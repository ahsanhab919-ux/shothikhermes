'use client';

import { useState } from 'react';
import { Trophy, TrendingUp, BookOpen, Globe, Clock, Zap, Share2 } from 'lucide-react';
import { NobelImpactEngine, type NobelImpactScore } from '@/lib/nobel-engine';
import { cn } from '@/lib/utils';
import { NobelScoreCard } from './NobelScoreCard';

interface NobelPanelProps {
  content: string;
  projectTitle?: string;
}

export function NobelPanel({ content, projectTitle = 'Untitled' }: NobelPanelProps) {
  const [analysis, setAnalysis] = useState<NobelImpactScore | null>(() => {
    if (!content) return null;
    return NobelImpactEngine.analyze(content);
  });
  const [showShareCard, setShowShareCard] = useState(false);

  if (!analysis) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Write more to see Nobel impact analysis...</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-amber-500';
    if (score >= 55) return 'text-blue-500';
    return 'text-zinc-500';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-amber-500';
    if (score >= 55) return 'bg-blue-500';
    return 'bg-zinc-400';
  };

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Overall Score */}
        <div className="text-center pb-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
              Nobel Impact Score
            </span>
          </div>
          <div className={cn('text-3xl font-bold', getScoreColor(analysis.overall))}>
            {analysis.overall}
            <span className="text-lg text-zinc-400">/100</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Literary impact potential</p>
          <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>
              {analysis.overall >= 75 ? 'High Potential' : analysis.overall >= 55 ? 'Developing' : 'Early Stage'}
            </span>
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="space-y-3">
          <ScoreBar
            icon={Globe}
            label="Universal Themes"
            score={analysis.universalThemes}
            description="Cross-cultural resonance"
            barColor={getBarColor(analysis.universalThemes)}
          />
          <ScoreBar
            icon={Zap}
            label="Emotional Depth"
            score={analysis.emotionalDepth}
            description="DMN activation potential"
            barColor={getBarColor(analysis.emotionalDepth)}
          />
          <ScoreBar
            icon={BookOpen}
            label="Innovation"
            score={analysis.structuralInnovation}
            description="Form-content interplay"
            barColor={getBarColor(analysis.structuralInnovation)}
          />
          <ScoreBar
            icon={Globe}
            label="Accessibility"
            score={analysis.accessibility}
            description="Global reach potential"
            barColor={getBarColor(analysis.accessibility)}
          />
          <ScoreBar
            icon={Clock}
            label="Longevity"
            score={analysis.longevity}
            description="Timeless quality"
            barColor={getBarColor(analysis.longevity)}
          />
        </div>

        {/* Analysis */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">
            Analysis
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {analysis.analysis}
          </p>
        </div>

        {/* Benchmarks */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
            Benchmarks
          </h4>
          <div className="space-y-2">
            <BenchmarkRow author="Rabindranath Tagore" score={analysis.benchmarks.vsTagore} year={1913} />
            <BenchmarkRow author="Leo Tolstoy" score={analysis.benchmarks.vsTolstoy} year={null} />
            <BenchmarkRow author="Toni Morrison" score={analysis.benchmarks.vsMorrison} year={1993} />
          </div>
        </div>

        {/* Share Button */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setShowShareCard(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500/10 to-brand/10 hover:from-amber-500/20 hover:to-brand/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-semibold transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share Score Card
          </button>
        </div>
      </div>

      {showShareCard && (
        <NobelScoreCard
          analysis={analysis}
          projectTitle={projectTitle}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
}

function ScoreBar({
  icon: Icon,
  label,
  score,
  description,
  barColor,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  description: string;
  barColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
        </div>
        <span className="text-sm text-zinc-500">{score}%</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className={cn('h-full transition-all duration-500', barColor)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </div>
  );
}

function BenchmarkRow({
  author,
  score,
  year,
}: {
  author: string;
  score: number;
  year: number | null;
}) {
  return (
    <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{author}</p>
          {year && <p className="text-xs text-zinc-500">Nobel {year}</p>}
        </div>
      </div>
      <div className="text-right">
        <span className={cn(
          'text-lg font-semibold',
          score >= 75 ? 'text-green-500' : score >= 50 ? 'text-blue-500' : 'text-zinc-400'
        )}>
          {score}%
        </span>
        <p className="text-xs text-zinc-500">match</p>
      </div>
    </div>
  );
}
