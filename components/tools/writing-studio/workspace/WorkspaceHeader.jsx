"use client";

import { useState } from "react";
import {
  BookOpen,
  Cloud,
  FileDown,
  Rocket,
  ChevronDown,
  ChevronLeft,
  FlaskConical,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_TABS = [
  { id: "write", label: "Write" },
  { id: "outline", label: "Outline" },
  { id: "formatting", label: "Formatting" },
  { id: "publish", label: "Publish" },
];

const TYPE_ICONS = {
  book: BookOpen,
  research: FlaskConical,
  assignment: GraduationCap,
};

const TYPE_COLORS = {
  book: "var(--color-brand)",
  research: "#10b981",
  assignment: "#f59e0b",
};

export function WorkspaceHeader({ activeTab, onTabChange, title, onTitleChange, tabs, projectType, onBack }) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const navTabs = tabs || DEFAULT_TABS;
  const Icon = TYPE_ICONS[projectType] || BookOpen;
  const accentColor = TYPE_COLORS[projectType] || "var(--color-brand)";

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white/80 dark:bg-brand-surface/50 backdrop-blur-md z-30 relative shrink-0">
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-500" />
          </button>
        )}
        <span className="flex items-center justify-center shrink-0" style={{ color: accentColor }}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex flex-col min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="bg-transparent border-none focus:ring-0 font-semibold text-sm w-48 p-0 outline-none"
              autoFocus
              aria-label="Document title"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="font-semibold text-sm text-left hover:text-brand transition-colors truncate"
              aria-label="Edit document title"
            >
              {title}
            </button>
          )}
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Cloud className="h-3 w-3 text-green-500" /> Saved to cloud
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center w-1/3">
        <nav className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={`Switch to ${tab.label} view`}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === tab.id
                  ? "bg-white dark:bg-zinc-700 font-bold shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
              style={activeTab === tab.id ? { color: accentColor } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="md:hidden">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg"
            style={{ color: accentColor, backgroundColor: `${accentColor}15` }}
            aria-label="Switch view"
          >
            {navTabs.find(t => t.id === activeTab)?.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 w-1/3">
        <button
          className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
          aria-label="Export document"
        >
          <FileDown className="h-3.5 w-3.5" /> Export
        </button>
        {projectType === "book" && (
          <button
            className="px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px ${accentColor}30` }}
            aria-label="Publish document"
          >
            <Rocket className="h-3.5 w-3.5" /> Publish
          </button>
        )}
        {projectType === "research" && (
          <button
            className="px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px ${accentColor}30` }}
            aria-label="Submit paper"
          >
            <Rocket className="h-3.5 w-3.5" /> Submit
          </button>
        )}
        {projectType === "assignment" && (
          <button
            className="px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px ${accentColor}30` }}
            aria-label="Submit assignment"
          >
            <FileDown className="h-3.5 w-3.5" /> Submit
          </button>
        )}
      </div>
    </header>
  );
}
