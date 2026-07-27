'use client';

import { useState, useEffect } from 'react';
import { Brain, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { NeuralCouplingEngine, type NeuralCouplingScore } from '@/lib/nobel-engine';
import { cn } from '@/lib/utils';

interface NeuralPanelProps {
  content: string;
}

export function NeuralPanel({ content }: NeuralPanelProps) {
  const [analysis, setAnalysis] = useState<NeuralCouplingScore | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!content) return;
    
    // Debounce analysis
    const timer = setTimeout(() => {
      setIsAnalyzing(true);
      const result = NeuralCouplingEngine.analyze(content);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [content]);

  if (!analysis) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start writing to see neural coupling analysis...</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Overall Score */}
      <div className="text-center pb-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            Neural Coupling
          </span>
          {isAnalyzing && <Sparkles className="w-4 h-4 animate-pulse text-blue-400" />}
        </div>
        <div className={cn("text-3xl font-bold", getScoreColor(analysis.overall))}>
          {analysis.overall}
          <span className="text-lg text-zinc-400">/100</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Brain-to-brain connection potential
        </p>
      </div>

      {/* Detailed Scores */}
      <div className="space-y-3">
        <ScoreBar 
          label="Sensory" 
          score={analysis.sensory} 
          description="Visual cortex activation"
          barColor={getBarColor(analysis.sensory)}
        />
        <ScoreBar 
          label="Emotional" 
          score={analysis.emotional} 
          description="Amygdala activation"
          barColor={getBarColor(analysis.emotional)}
        />
        <ScoreBar 
          label="Cognitive" 
          score={analysis.cognitive} 
          description="Prefrontal engagement"
          barColor={getBarColor(analysis.cognitive)}
        />
        <ScoreBar 
          label="Personal" 
          score={analysis.personal} 
          description="DMN activation"
          barColor={getBarColor(analysis.personal)}
        />
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">
            Suggestions
          </h4>
          <div className="space-y-2">
            {analysis.suggestions.slice(0, 3).map((suggestion, idx) => (
              <div 
                key={idx}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm"
              >
                <div className="flex items-start gap-2">
                  {suggestion.priority === 'high' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-zinc-700 dark:text-zinc-200">
                      {suggestion.message}
                    </p>
                    {suggestion.example && (
                      <p className="text-xs text-zinc-500 mt-1 italic">
                        {suggestion.example}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ 
  label, 
  score, 
  description, 
  barColor 
}: { 
  label: string; 
  score: number; 
  description: string;
  barColor: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {label}
        </span>
        <span className="text-sm text-zinc-500">{score}%</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </div>
  );
}
