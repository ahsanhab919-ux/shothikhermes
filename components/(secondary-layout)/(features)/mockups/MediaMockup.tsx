"use client";

import { Play, Smartphone, Layers, Package } from "lucide-react";

interface MediaMockupProps {
  accentColor: string;
  className?: string;
}

export default function MediaMockup({
  accentColor,
  className,
}: MediaMockupProps) {
  const mediaFormats = [
    { icon: <Smartphone size={16} />, label: "UGC Video" },
    { icon: <Layers size={16} />, label: "Carousel" },
    { icon: <Package size={16} />, label: "Static" },
  ];

  return (
    <div
      className={`mockup-container relative h-[260px] w-full overflow-hidden rounded-lg border border-white/10 bg-[rgba(15,20,35,0.8)] transition-all duration-300 sm:h-[320px] md:h-[450px] ${className || ""}`}
      style={{
        boxShadow: `0 20px 60px ${accentColor}20`,
      }}
    >
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-body2 text-white/70">
            AI Media Canvas - Andromeda
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <span className="text-caption mb-4 block text-white/50">
            Generated Content
          </span>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative aspect-[9/16] overflow-hidden rounded border border-white/10 bg-white/5"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 100%)`,
                  }}
                />
                <div className="absolute right-2 bottom-2 left-2 rounded bg-black/60 p-2 backdrop-blur-[10px]">
                  <span className="text-caption text-[0.65rem] text-white">
                    UGC Video #{i}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mediaFormats.map((format, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-3 py-1.5"
            >
              <div className="flex" style={{ color: accentColor }}>
                {format.icon}
              </div>
              <span className="text-caption text-[0.7rem] text-white/70">
                {format.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 rounded-lg border border-white/30 bg-white/25 backdrop-blur-[8px] backdrop-saturate-[180%] dark:border-white/[0.08] dark:bg-white/[0.02]" />

      <div className="absolute top-4 right-4 z-[2] flex items-center gap-2 rounded bg-black/60 px-4 py-2 backdrop-blur-[10px]">
        <Play size={14} color={accentColor} />
        <span className="text-caption" style={{ color: accentColor }}>
          Live Demo
        </span>
      </div>
    </div>
  );
}
