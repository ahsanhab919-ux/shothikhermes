'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Wand2,
  Layers,
  CheckCircle2,
  GraduationCap,
  Zap,
  FileDown,
  Plus,
  Search,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterfaceMode } from '@/lib/user-preferences';

interface Chapter {
  id: string;
  title: string;
}

type ActionId =
  | 'continue-writing'
  | 'rewrite-paragraph'
  | 'ux-review'
  | 'grammar-check'
  | 'export-pdf'
  | 'export-epub'
  | 'export-word'
  | 'new-chapter'
  | 'switch-advanced'
  | 'switch-simple';

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onNavigate: (chapterId: string) => void;
  onAiAction: (actionId: ActionId) => void;
  interfaceMode: InterfaceMode;
  onInterfaceModeChange: (mode: InterfaceMode) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  chapters,
  onNavigate,
  onAiAction,
  interfaceMode,
  onInterfaceModeChange,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const exec = (fn: () => void) => {
    fn();
    onClose();
    setQuery('');
    setSelectedIndex(0);
  };

  const allItems: PaletteItem[] = [
    ...chapters.map(ch => ({
      id: `nav-${ch.id}`,
      group: 'NAVIGATE',
      label: ch.title,
      icon: BookOpen,
      action: () => exec(() => onNavigate(ch.id)),
    })),
    {
      id: 'ai-continue',
      group: 'AI ACTIONS',
      label: 'Continue writing',
      icon: Sparkles,
      shortcut: '⌘⇧G',
      action: () => exec(() => onAiAction('continue-writing')),
    },
    {
      id: 'ai-rewrite',
      group: 'AI ACTIONS',
      label: 'Rewrite last paragraph',
      icon: Wand2,
      action: () => exec(() => onAiAction('rewrite-paragraph')),
    },
    {
      id: 'ai-ux',
      group: 'AI ACTIONS',
      label: 'Run UX Deep Review',
      icon: Layers,
      shortcut: '⌘⇧U',
      action: () => exec(() => onAiAction('ux-review')),
    },
    {
      id: 'ai-grammar',
      group: 'AI ACTIONS',
      label: 'Check grammar',
      icon: CheckCircle2,
      action: () => exec(() => onAiAction('grammar-check')),
    },
    ...(interfaceMode === 'beginner'
      ? [{
          id: 'switch-advanced',
          group: 'TOOLS',
          label: 'Switch to Advanced mode',
          icon: GraduationCap,
          action: () => exec(() => onInterfaceModeChange('advanced')),
        }]
      : [{
          id: 'switch-simple',
          group: 'TOOLS',
          label: 'Switch to Simple mode',
          icon: Zap,
          action: () => exec(() => onInterfaceModeChange('beginner')),
        }]
    ),
    {
      id: 'export-pdf',
      group: 'TOOLS',
      label: 'Export to PDF',
      icon: FileDown,
      action: () => exec(() => onAiAction('export-pdf')),
    },
    {
      id: 'export-epub',
      group: 'TOOLS',
      label: 'Export to ePub',
      icon: FileDown,
      action: () => exec(() => onAiAction('export-epub')),
    },
    {
      id: 'new-chapter',
      group: 'TOOLS',
      label: 'New chapter',
      icon: Plus,
      action: () => exec(() => onAiAction('new-chapter')),
    },
  ];

  const filtered = query.trim()
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const groups = Array.from(new Set(filtered.map(i => i.group)));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selectedIndex]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[18vh] px-4 pointer-events-none">
            <motion.div
              key="palette"
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-full max-w-xl bg-[#161b22] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 border-b border-zinc-700/60">
                <Command className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Type a command or search chapters…"
                  className="flex-1 font-mono text-sm bg-transparent outline-none text-zinc-200 placeholder:text-zinc-600 py-3.5"
                  autoComplete="off"
                  spellCheck={false}
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-autocomplete="list"
                  aria-controls="command-palette-listbox"
                  aria-activedescendant={filtered[selectedIndex] ? `cmd-option-${filtered[selectedIndex].id}` : undefined}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Results */}
              <div ref={listRef} id="command-palette-listbox" role="listbox" aria-label="Command results" className="max-h-80 overflow-y-auto custom-scrollbar py-2">
                {filtered.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-zinc-600">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  groups.map(group => {
                    const groupItems = filtered.filter(i => i.group === group);
                    return (
                      <div key={group}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 px-4 pt-3 pb-1">
                          {group}
                        </p>
                        {groupItems.map(item => {
                          const idx = globalIndex++;
                          const isSelected = idx === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              id={`cmd-option-${item.id}`}
                              role="option"
                              aria-selected={isSelected}
                              onClick={item.action}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                                isSelected
                                  ? 'bg-brand/20 text-white'
                                  : 'text-zinc-400 hover:text-zinc-300'
                              )}
                            >
                              <item.icon className={cn('w-4 h-4 shrink-0', isSelected ? 'text-brand' : 'text-zinc-600')} />
                              <span className="flex-1 text-sm">{item.label}</span>
                              {item.shortcut && (
                                <span className="text-[9px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                                  {item.shortcut}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-700/60 bg-brand-dark/60">
                <div className="flex items-center gap-3 text-[10px] text-zinc-700">
                  <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="font-mono">↵</kbd> select</span>
                  <span><kbd className="font-mono">esc</kbd> close</span>
                </div>
                <span className="text-[10px] text-zinc-700 font-mono">⌘K</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
