"use client";

import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SortMode = "hot" | "new" | "top";

interface SortTabsProps {
  active: SortMode;
  onChange: (mode: SortMode) => void;
}

const tabs: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: "hot", label: "Hot", icon: <Flame className="h-3.5 w-3.5" /> },
  { value: "new", label: "New", icon: <Clock className="h-3.5 w-3.5" /> },
  { value: "top", label: "Top", icon: <TrendingUp className="h-3.5 w-3.5" /> },
];

export default function SortTabs({ active, onChange }: SortTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {tabs.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
