"use client";

import { Play } from "lucide-react";

interface AnalysisMockupProps {
  accentColor: string;
  className?: string;
}

export default function AnalysisMockup({
  accentColor,
  className,
}: AnalysisMockupProps) {
  return (
    <div
      className={`mockup-container relative h-[260px] w-full overflow-hidden rounded-xl border border-[rgba(24,119,242,0.15)] bg-white/90 shadow-[0_20px_60px_rgba(24,119,242,0.15)] backdrop-blur-[20px] transition-all duration-300 sm:h-[320px] md:h-[450px] dark:border-[rgba(24,119,242,0.2)] dark:bg-[rgba(15,20,35,0.95)] dark:shadow-[0_20px_60px_rgba(24,119,242,0.3)] ${className || ""}`}
    >
      <div className="border-b border-[rgba(24,119,242,0.1)] bg-gradient-to-r from-[rgba(24,119,242,0.05)] to-transparent px-6 py-4 dark:border-[rgba(24,119,242,0.15)] dark:from-[rgba(24,119,242,0.1)]">
        <div className="flex items-center gap-4">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-body2 text-muted-foreground font-medium">
            Product Analysis Dashboard
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <span className="text-caption mb-2 block text-white/50">
            URL Analysis
          </span>
          <div
            className="rounded border p-4"
            style={{
              backgroundColor: "rgba(0, 167, 111, 0.1)",
              borderColor: `${accentColor}40`,
            }}
          >
            <p className="text-body2 font-mono" style={{ color: accentColor }}>
              https://example.com/product
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded bg-white/5 p-4">
            <span className="text-caption text-white/50">Market Position</span>
            <p className="text-h6 mt-1 text-white">Premium</p>
          </div>
          <div className="rounded bg-white/5 p-4">
            <span className="text-caption text-white/50">Competitors</span>
            <p className="text-h6 mt-1 text-white">12 Found</p>
          </div>
        </div>

        <div className="rounded bg-white/5 p-4">
          <span className="text-caption mb-2 block text-white/50">
            AI-Generated Personas
          </span>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: `${accentColor}40` }}
              />
              <div className="h-3 flex-1 rounded bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 rounded-xl border border-white/30 bg-white/25 backdrop-blur-[8px] backdrop-saturate-[180%] dark:border-white/[0.08] dark:bg-white/[0.02]" />

      <div className="absolute top-4 right-4 z-[2] flex items-center gap-2 rounded bg-black/60 px-4 py-2 backdrop-blur-[10px]">
        <Play size={14} color={accentColor} />
        <span className="text-caption" style={{ color: accentColor }}>
          Live Demo
        </span>
      </div>
    </div>
  );
}
