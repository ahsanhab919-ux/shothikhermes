'use client';

import { useEffect, useCallback, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const ONBOARDING_KEY = 'ws-onboarding-v2-done';

const CHECKLIST_STORAGE_KEY = 'ws-onboarding-checklist';

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'create', label: 'Create a project', done: false },
  { id: 'write', label: 'Write 100 words', done: false },
  { id: 'outline', label: 'Generate AI outline', done: false },
  { id: 'export', label: 'Export a draft', done: false },
];

interface PolishedWriteOnboardingProps {
  wordCount: number;
  hasAiOutline: boolean;
  hasExported: boolean;
  onClose?: () => void;
}

export function PolishedWriteOnboarding({
  wordCount,
  hasAiOutline,
  hasExported,
  onClose,
}: PolishedWriteOnboardingProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const stored = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CHECKLIST;
    } catch {
      return DEFAULT_CHECKLIST;
    }
  });
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const updated = checklist.map(item => {
      if (item.id === 'create') return { ...item, done: true };
      if (item.id === 'write') return { ...item, done: wordCount >= 100 };
      if (item.id === 'outline') return { ...item, done: hasAiOutline };
      if (item.id === 'export') return { ...item, done: hasExported };
      return item;
    });
    setChecklist(updated);
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, [wordCount, hasAiOutline, hasExported]);

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: '[data-tour="editor-canvas"]',
          popover: {
            title: 'Your writing canvas',
            description: 'This is where you write. TipTap editor with AI-assist on every paragraph.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-tour="chapter-list"]',
          popover: {
            title: 'Chapter navigator',
            description: 'Organise your work into chapters or sections. Drag to reorder.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="mode-switcher"]',
          popover: {
            title: 'Write → Format → Publish',
            description: 'Move through the pipeline when you\'re ready. Format exports to PDF or EPUB; Publish sends to Amazon, Apple Books, and more.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '[data-tour="ai-panel"]',
          popover: {
            title: 'Your AI co-writer',
            description: 'Ask questions, get rewrites, check citations — the AI panel reads your current document for context.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-tour="command-palette-hint"]',
          popover: {
            title: 'Command palette',
            description: 'Press Cmd+K (or Ctrl+K) anywhere to search chapters, trigger AI actions, or jump to any section instantly.',
            side: 'bottom',
            align: 'center',
          },
        },
      ],
      onDestroyed: () => {
        try {
          localStorage.setItem(ONBOARDING_KEY, 'true');
        } catch {}
      },
    });
    driverObj.drive();
  }, []);

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        const timer = setTimeout(() => startTour(), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [startTour]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    onClose?.();
  }, [onClose]);

  const doneCount = checklist.filter(c => c.done).length;
  const allDone = doneCount === checklist.length;

  if (!isOpen || allDone) return null;

  return (
    <div className="fixed bottom-20 xl:bottom-4 right-4 z-40 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Getting Started</span>
          <span className="ml-2 text-[10px] text-zinc-400">{doneCount}/{checklist.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startTour}
            className="text-[10px] text-brand hover:underline font-medium"
          >
            Tour
          </button>
          <button
            onClick={dismiss}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Dismiss getting started checklist"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5 2.5 3.205 5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {checklist.map(item => (
          <div key={item.id} className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              item.done
                ? 'bg-brand border-brand'
                : 'border-zinc-300 dark:border-zinc-600'
            }`}>
              {item.done && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                  <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${item.done ? 'line-through text-zinc-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
