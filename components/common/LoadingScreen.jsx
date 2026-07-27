"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-background fixed top-0 right-0 bottom-0 left-0 z-[9999] flex items-center justify-center">
        <div className="bg-primary flex h-20 w-20 items-center justify-center rounded-full shadow-lg">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12L9 17L20 6" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background fixed top-0 right-0 bottom-0 left-0 z-[9999] flex items-center justify-center">
      <div
        className="bg-primary animate-scale-in flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
        suppressHydrationWarning
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-fade-in"
          suppressHydrationWarning
        >
          <path
            d="M4 12L9 17L20 6"
            className="animate-draw-check"
            style={{
              strokeDasharray: "30",
              strokeDashoffset: "30",
            }}
            suppressHydrationWarning
          />
        </svg>
      </div>

      <style jsx global suppressHydrationWarning>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes draw-check {
          0% {
            stroke-dashoffset: 30;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease forwards 0.5s;
        }

        .animate-draw-check {
          animation: draw-check 0.8s ease forwards 0.8s;
        }
      `}</style>
    </div>
  );
}
