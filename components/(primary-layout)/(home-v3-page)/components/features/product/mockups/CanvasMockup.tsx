'use client';

import { Play } from "lucide-react";

interface CanvasMockupProps {
  accentColor: string;
  className?: string;
}

export default function CanvasMockup({ accentColor, className }: CanvasMockupProps) {
  return (
    <div
      className={`mockup-container relative w-full h-[350px] md:h-[450px] rounded-lg border border-white/10 bg-[rgba(15,20,35,0.8)] overflow-hidden transition-all duration-300 ${className || ''}`}
      style={{
        boxShadow: `0 20px 60px ${accentColor}20`,
      }}
    >
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <span className="text-body2 text-white/70">Ad Creative Canvas</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30" />
          ))}
        </div>
      </div>

      <div className="p-6 h-[calc(100%-100px)] overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <div
              className="max-w-[70%] p-4 rounded-lg border"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
              }}
            >
              <p className="text-body2 text-white">
                Create ad copy for fitness app targeting millennials
              </p>
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 bg-white/5 rounded-lg">
              <p className="text-body2 text-white/90 mb-2">Here's your ad copy:</p>
              <div className="p-3 bg-black/30 rounded">
                <p className="text-caption text-white/70 font-mono">
                  "Transform Your Body in 30 Days..."
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-caption text-white/50">AI is typing...</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[rgba(10,15,30,0.9)]">
        <div className="flex gap-2 items-center">
          <div className="flex-1 h-9 bg-white/5 rounded flex items-center px-4">
            <span className="text-body2 text-white/40">Type your message...</span>
          </div>
          <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: accentColor }}>
            <Play size={16} color="white" />
          </div>
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
