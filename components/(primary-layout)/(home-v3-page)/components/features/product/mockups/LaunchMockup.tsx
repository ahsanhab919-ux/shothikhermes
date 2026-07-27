'use client';

import { Play, Zap } from "lucide-react";

interface LaunchMockupProps {
  accentColor: string;
  className?: string;
}

export default function LaunchMockup({ accentColor, className }: LaunchMockupProps) {
  return (
    <div
      className={`mockup-container relative w-full h-[350px] md:h-[450px] rounded-lg border border-white/10 bg-[rgba(15,20,35,0.8)] overflow-hidden transition-all duration-300 ${className || ''}`}
      style={{
        boxShadow: `0 20px 60px ${accentColor}20`,
      }}
    >
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-body2 text-white/70">Campaign Launch Dashboard</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <span className="text-caption text-white/50 mb-4 block">Campaign Structure</span>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Campaign', value: 'Q4 Product Launch' },
              { label: 'Ad Sets', value: '3 Configured' },
              { label: 'Creatives', value: '12 Variants' },
              { label: 'Budget', value: '$500/day' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-4 bg-white/5 border border-white/10 rounded flex justify-between items-center"
              >
                <span className="text-body2 text-white/70">{item.label}</span>
                <span className="text-body2 text-white font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-6 rounded-lg border-2 flex flex-col items-center gap-3"
          style={{
            backgroundColor: `${accentColor}15`,
            borderColor: accentColor,
          }}
        >
          <Zap size={24} color={accentColor} />
          <p className="text-body1 text-white font-semibold text-center">Ready to Launch</p>
          <p className="text-caption text-white/60 text-center">One-click deployment to Facebook</p>
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/25 dark:bg-white/[0.02] backdrop-blur-[8px] backdrop-saturate-[180%] border border-white/30 dark:border-white/[0.08] pointer-events-none rounded-lg" />

      <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/60 rounded backdrop-blur-[10px] z-[2]">
        <Play size={14} color={accentColor} />
        <span className="text-caption" style={{ color: accentColor }}>Live Demo</span>
      </div>
    </div>
  );
}
