"use client";

import { Play, Zap } from "lucide-react";

interface LaunchMockupProps {
  accentColor: string;
  className?: string;
}

export default function LaunchMockup({
  accentColor,
  className,
}: LaunchMockupProps) {
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
            Campaign Launch Dashboard
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <span className="text-caption mb-4 block text-white/50">
            Campaign Structure
          </span>
          <div className="flex flex-col gap-4">
            {[
              { label: "Campaign", value: "Q4 Product Launch" },
              { label: "Ad Sets", value: "3 Configured" },
              { label: "Creatives", value: "12 Variants" },
              { label: "Budget", value: "$500/day" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-4"
              >
                <span className="text-body2 text-white/70">{item.label}</span>
                <span className="text-body2 font-semibold text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-3 rounded-lg border-2 p-6"
          style={{
            backgroundColor: `${accentColor}15`,
            borderColor: accentColor,
          }}
        >
          <Zap size={24} color={accentColor} />
          <p className="text-body1 text-center font-semibold text-white">
            Ready to Launch
          </p>
          <p className="text-caption text-center text-white/60">
            One-click deployment to Facebook
          </p>
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
