'use client';

import { Play, Smartphone, Layers, Package } from "lucide-react";

interface MediaMockupProps {
  accentColor: string;
  className?: string;
}

export default function MediaMockup({ accentColor, className }: MediaMockupProps) {
  const mediaFormats = [
    { icon: <Smartphone size={16} />, label: 'UGC Video' },
    { icon: <Layers size={16} />, label: 'Carousel' },
    { icon: <Package size={16} />, label: 'Static' },
  ];

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
          <span className="text-body2 text-white/70">AI Media Canvas - Andromeda</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <span className="text-caption text-white/50 mb-4 block">Generated Content</span>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] bg-white/5 rounded border border-white/10 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 100%)`,
                  }}
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-[10px] rounded p-2">
                  <span className="text-caption text-white text-[0.65rem]">UGC Video #{i}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {mediaFormats.map((format, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded"
            >
              <div className="flex" style={{ color: accentColor }}>
                {format.icon}
              </div>
              <span className="text-caption text-white/70 text-[0.7rem]">{format.label}</span>
            </div>
          ))}
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
