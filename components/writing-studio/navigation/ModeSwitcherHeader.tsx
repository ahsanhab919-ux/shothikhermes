'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Type,
  Rocket,
  Save,
  Undo,
  Redo,
  Check,
  Settings,
  Zap,
  GraduationCap,
  Command,
  Cloud,
  CloudOff,
  Lock,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterfaceMode } from '@/lib/user-preferences';
import type { ReadinessCriterionResult } from '@/lib/projectMetrics';

type Mode = 'write' | 'format' | 'publish';

interface ModeSwitcherHeaderProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  projectName?: string;
  onSave?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  lastSaved?: Date;
  isSaving?: boolean;
  interfaceMode?: InterfaceMode;
  onInterfaceModeChange?: (mode: InterfaceMode) => void;
  onOpenCommandPalette?: () => void;
  isCloudSaving?: boolean;
  lastCloudSave?: Date | null;
  cloudError?: string | null;
  readinessScore?: number;
  readinessCriteria?: ReadinessCriterionResult[];
}

const MODES: { id: Mode; label: string; icon: any; description: string }[] = [
  { id: 'write', label: 'Write', icon: BookOpen, description: 'Edit your manuscript' },
  { id: 'format', label: 'Format', icon: Type, description: 'Style and preview' },
  { id: 'publish', label: 'Publish', icon: Rocket, description: 'Finalize and distribute' },
];

export function ModeSwitcherHeader({
  currentMode,
  onModeChange,
  projectName = 'Untitled Project',
  onSave,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  lastSaved,
  isSaving = false,
  interfaceMode = 'beginner',
  onInterfaceModeChange,
  onOpenCommandPalette,
  isCloudSaving = false,
  lastCloudSave = null,
  cloudError = null,
  readinessScore,
  readinessCriteria = [],
}: ModeSwitcherHeaderProps) {
  const [showModePopover, setShowModePopover] = useState(false);
  const [showReadinessPopover, setShowReadinessPopover] = useState(false);

  const publishBlocked = readinessScore !== undefined && readinessScore < 70;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo) onRedo?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, canUndo, canRedo]);

  const currentModeData = MODES.find(m => m.id === currentMode);

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-dark flex items-center justify-between px-4 z-50 shrink-0">
      {/* Left: Logo + Project Name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-brand shrink-0">
          <BookOpen className="w-5 h-5" />
          <span className="font-bold text-base hidden sm:block">Shothik</span>
        </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 hidden md:block" />

        <span className="font-medium text-sm text-zinc-600 dark:text-zinc-300 truncate max-w-[140px] hidden md:block" title={projectName}>
          {projectName}
        </span>
      </div>

      {/* Center: Visible Mode Tabs */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-1">
        {MODES.map(m => {
          const isPublish = m.id === 'publish';
          const blocked = isPublish && publishBlocked;
          return (
            <button
              key={m.id}
              onClick={() => !blocked && onModeChange(m.id)}
              title={blocked ? `Publish unlocks at 70% readiness (currently ${readinessScore}%)` : m.description}
              disabled={blocked}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                currentMode === m.id
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : blocked
                  ? 'text-zinc-400 cursor-not-allowed opacity-60'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {blocked ? (
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <m.icon className={cn('w-3.5 h-3.5', currentMode === m.id && 'text-brand')} />
              )}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Readiness Score — visible in format/publish modes */}
      {readinessScore !== undefined && (currentMode === 'format' || currentMode === 'publish') && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-11 hidden lg:block">
          <div className="relative">
            <button
              onClick={() => setShowReadinessPopover(p => !p)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors',
                readinessScore >= 70
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
              )}
            >
              {readinessScore >= 70 ? (
                <Check className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {readinessScore}% ready
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showReadinessPopover && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReadinessPopover(false)} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Publishing Readiness</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {readinessScore >= 70
                        ? 'Ready to publish!'
                        : `Reach 70% to unlock publishing (${70 - readinessScore}% remaining)`}
                    </p>
                    <div className="mt-2 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          readinessScore >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                        )}
                        style={{ width: `${readinessScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {readinessCriteria.map(c => (
                      <div key={c.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5', c.met ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-zinc-100 dark:bg-zinc-800')}>
                          {c.met ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn('text-[11px] font-medium', c.met ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500')}>{c.label}</span>
                            <span className="text-[10px] text-zinc-400 shrink-0 ml-1">{c.score}/{c.weight}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{c.hint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Interface Mode Toggle */}
        {onInterfaceModeChange && (
          <div className="relative">
            <button
              onClick={() => setShowModePopover(p => !p)}
              title={`Interface: ${interfaceMode}`}
              className={cn(
                'p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase',
                interfaceMode === 'beginner'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                  : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100'
              )}
            >
              {interfaceMode === 'beginner' ? (
                <Zap className="w-3.5 h-3.5" />
              ) : (
                <GraduationCap className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{interfaceMode === 'beginner' ? 'Simple' : 'Advanced'}</span>
              <Settings className="w-3 h-3 opacity-60" />
            </button>

            {showModePopover && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModePopover(false)} />
                <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden">
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-0.5">Interface Mode</p>
                    <p className="text-[10px] text-zinc-400">Controls panel visibility & UI complexity</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { onInterfaceModeChange('beginner'); setShowModePopover(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors',
                        interfaceMode === 'beginner' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      )}
                    >
                      <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold">Simple</div>
                        <div className="text-[10px] text-zinc-500">2 tabs, guided prompts</div>
                      </div>
                      {interfaceMode === 'beginner' && <Check className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                    </button>
                    <button
                      onClick={() => { onInterfaceModeChange('advanced'); setShowModePopover(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors',
                        interfaceMode === 'advanced' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      )}
                    >
                      <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold">Advanced</div>
                        <div className="text-[10px] text-zinc-500">All 7 tabs, full controls</div>
                      </div>
                      {interfaceMode === 'advanced' && <Check className="w-3.5 h-3.5 ml-auto text-purple-500" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={cn('p-1.5 rounded transition-colors', canUndo ? 'hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'opacity-30 cursor-not-allowed')}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={cn('p-1.5 rounded transition-colors', canRedo ? 'hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300' : 'opacity-30 cursor-not-allowed')}
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
          {cloudError ? (
            <>
              <CloudOff className="w-3 h-3 text-amber-500" />
              <span className="text-amber-500">Sync error</span>
            </>
          ) : isCloudSaving ? (
            <>
              <div className="w-3 h-3 border-2 border-zinc-300 border-t-brand rounded-full animate-spin" />
              <span>Syncing...</span>
            </>
          ) : lastCloudSave ? (
            <>
              <Cloud className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">
                Saved {lastCloudSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : isSaving ? (
            <>
              <div className="w-3 h-3 border-2 border-zinc-300 border-t-brand rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          ) : (
            <span>Unsaved changes</span>
          )}
        </div>

        {onOpenCommandPalette && (
          <button
            data-tour="command-palette-hint"
            onClick={onOpenCommandPalette}
            title="Command Palette (Ctrl+K)"
            aria-label="Open Command Palette"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg text-[10px] font-mono transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <Command className="w-3 h-3" />
            K
          </button>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>
    </header>
  );
}
