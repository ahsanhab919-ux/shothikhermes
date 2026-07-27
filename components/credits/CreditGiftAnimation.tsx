"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CreditGiftAnimationProps {
  active: boolean;
  onComplete?: () => void;
}

export default function CreditGiftAnimation({ active, onComplete }: CreditGiftAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 60 - 30,
      delay: Math.random() * 200,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 1200);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn(
            "absolute bottom-1/2 left-1/2 text-sm",
            "animate-[starFloat_1s_ease-out_forwards]"
          )}
          style={{
            animationDelay: `${p.delay}ms`,
            "--float-x": `${p.x}px`,
          } as React.CSSProperties}
        >
          💰
        </span>
      ))}

      <style jsx>{`
        @keyframes starFloat {
          0% {
            transform: translate(-50%, 0) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--float-x, 0px)), -60px) scale(1.2);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[starFloat_1s_ease-out_forwards\\] {
            animation: none !important;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
