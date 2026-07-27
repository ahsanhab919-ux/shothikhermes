"use client";

import { ChartColumn, Play, TrendingUp } from "lucide-react";

interface DashboardMockupProps {
  accentColor: string;
  className?: string;
}

export default function DashboardMockup({
  accentColor,
  className,
}: DashboardMockupProps) {
  return (
    <div
      className={`mockup-container relative h-[350px] w-full overflow-hidden rounded-lg border border-white/10 bg-[rgba(15,20,35,0.8)] transition-all duration-300 md:h-[450px] ${className || ""}`}
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
          <span className="text-body2 text-white/70">Campaign Analytics</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-2 gap-4">
          {[
            { icon: <TrendingUp size={20} />, label: "ROAS", value: "4.2x" },
            {
              icon: <ChartColumn size={20} />,
              label: "Conversions",
              value: "1,234",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-2 flex" style={{ color: accentColor }}>
                {stat.icon}
              </div>
              <span className="text-caption mb-1 block text-white/50">
                {stat.label}
              </span>
              <p className="text-h5 font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-white/5 p-4">
          <span className="text-caption mb-4 block text-white/50">
            AI Optimization Suggestions
          </span>
          {[
            "Increase budget by 20% on top performer",
            "Pause underperforming ad set #3",
            "Test new creative variant",
          ].map((suggestion, i) => (
            <div
              key={i}
              className="mb-3 flex items-start gap-3 rounded bg-black/30 p-3 last:mb-0"
            >
              <div
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-caption text-xs leading-relaxed text-white/80">
                {suggestion}
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
