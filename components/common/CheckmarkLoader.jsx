"use client";
import { useEffect, useState } from "react";

export default function CheckmarkLoader({ size = 60 }) {
  const [checkmarkVisible, setCheckmarkVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCheckmarkVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const circleSize = size;
  const svgSize = Math.round(size * 0.6);
  const strokeWidth = Math.max(2, Math.round(size * 0.05));

  return (
    <div className="flex items-center justify-center">
      <div
        className="animate-in zoom-in flex items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/50 duration-500"
        style={{
          width: `${circleSize}px`,
          height: `${circleSize}px`,
        }}
      >
        {checkmarkVisible && (
          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-in fade-in duration-300"
          >
            <path
              d="M4 12L9 17L20 6"
              className="animate-draw-check"
              style={{
                strokeDasharray: "30",
                strokeDashoffset: "30",
              }}
            />
          </svg>
        )}
      </div>

      <style jsx global>{`
        @keyframes draw-check {
          0% {
            stroke-dashoffset: 30;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .animate-draw-check {
          animation: draw-check 0.8s ease forwards;
        }
      `}</style>
    </div>
  );
}
