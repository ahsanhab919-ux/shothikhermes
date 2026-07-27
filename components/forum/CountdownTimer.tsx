"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  publicationDate: number;
  className?: string;
}

function getTimeLeft(target: number) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function CountdownTimer({ publicationDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(publicationDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(publicationDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [publicationDate]);

  if (!timeLeft) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Published
      </span>
    );
  }

  const parts = [
    { label: "d", value: timeLeft.d },
    { label: "h", value: timeLeft.h },
    { label: "m", value: timeLeft.m },
    { label: "s", value: timeLeft.s },
  ].filter((p, i) => i > 0 || p.value > 0);

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm text-foreground ${className}`}>
      <span className="text-muted-foreground text-xs mr-1">drops in</span>
      {parts.map((p, i) => (
        <span key={p.label}>
          <span className="font-bold">{String(p.value).padStart(2, "0")}</span>
          <span className="text-muted-foreground text-xs">{p.label}</span>
          {i < parts.length - 1 && <span className="text-muted-foreground mx-0.5">:</span>}
        </span>
      ))}
    </span>
  );
}
