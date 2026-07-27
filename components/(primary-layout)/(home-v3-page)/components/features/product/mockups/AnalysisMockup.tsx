'use client';

import { Play } from "lucide-react";

interface AnalysisMockupProps {
  accentColor: string;
  className?: string;
}

export default function AnalysisMockup({ accentColor, className }: AnalysisMockupProps) {
  return (
    <div
      className={`mockup-container relative w-full h-[350px] md:h-[450px] rounded-xl border border-[rgba(24,119,242,0.15)] dark:border-[rgba(24,119,242,0.2)] bg-white/90 dark:bg-[rgba(15,20,35,0.95)] overflow-hidden shadow-[0_20px_60px_rgba(24,119,242,0.15)] dark:shadow-[0_20px_60px_rgba(24,119,242,0.3)] backdrop-blur-[20px] transition-all duration-300 ${className || ''}`}
    >
      <div className="px-6 py-4 border-b border-[rgba(24,119,242,0.1)] dark:border-[rgba(24,119,242,0.15)] bg-gradient-to-r from-[rgba(24,119,242,0.05)] dark:from-[rgba(24,119,242,0.1)] to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-body2 text-muted-foreground font-medium">
            Product Analysis Dashboard
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <span className="text-caption text-white/50 mb-2 block">URL Analysis</span>
          <div
            className="p-4 rounded border"
            style={{
              backgroundColor: 'rgba(0, 167, 111, 0.1)',
              borderColor: `${accentColor}40`,
            }}
          >
            <p className="text-body2 font-mono" style={{ color: accentColor }}>
              https://example.com/product
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded">
            <span className="text-caption text-white/50">Market Position</span>
            <p className="text-h6 text-white mt-1">Premium</p>
          </div>
          <div className="p-4 bg-white/5 rounded">
            <span className="text-caption text-white/50">Competitors</span>
            <p className="text-h6 text-white mt-1">12 Found</p>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded">
          <span className="text-caption text-white/50 mb-2 block">
            AI-Generated Personas
          </span>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `${accentColor}40` }} />
              <div className="h-3 bg-white/20 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/25 dark:bg-white/[0.02] backdrop-blur-[8px] backdrop-saturate-[180%] border border-white/30 dark:border-white/[0.08] pointer-events-none rounded-xl" />

      <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/60 rounded backdrop-blur-[10px] z-[2]">
        <Play size={14} color={accentColor} />
        <span className="text-caption" style={{ color: accentColor }}>Live Demo</span>
      </div>
    </div>
  );
}
