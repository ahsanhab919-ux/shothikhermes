'use client';

import { useState } from 'react';
import {
  BookOpen,
  Search,
  FlaskConical,
  Target,
  Settings,
  GraduationCap,
  Zap,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterfaceMode } from '@/lib/user-preferences';

type SidebarView = 'chapters' | 'search' | 'research' | 'goals';

interface ActivityBarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  hasResearch?: boolean;
  interfaceMode: InterfaceMode;
  onInterfaceModeChange: (mode: InterfaceMode) => void;
}

const TOP_ITEMS: { id: SidebarView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'chapters', icon: BookOpen, label: 'Chapters' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'research', icon: FlaskConical, label: 'Research Notes' },
  { id: 'goals', icon: Target, label: 'Writing Goals' },
];

export function ActivityBar({
  activeView,
  onViewChange,
  hasResearch = false,
  interfaceMode,
  onInterfaceModeChange,
}: ActivityBarProps) {
  const [showModePopover, setShowModePopover] = useState(false);

  return (
    <div className="w-12 shrink-0 bg-brand-dark border-r border-zinc-800/80 flex flex-col items-center py-3 gap-1 relative">
      {TOP_ITEMS.map(item => {
        const isActive = activeView === item.id;
        return (
          <div key={item.id} className="relative flex items-center w-full justify-center">
            {isActive && (
              <span className="absolute left-0 w-0.5 h-5 bg-brand rounded-r" />
            )}
            {item.id === 'research' && hasResearch && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#0d1117]" />
            )}
            <button
              onClick={() => onViewChange(item.id)}
              title={item.label}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50'
              )}
            >
              <item.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </button>
          </div>
        );
      })}

      {/* Bottom: Interface Mode Settings */}
      <div className="mt-auto relative flex items-center w-full justify-center">
        <button
          onClick={() => setShowModePopover(p => !p)}
          title={`Interface: ${interfaceMode}`}
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150',
            interfaceMode === 'advanced'
              ? 'text-purple-500 hover:bg-zinc-800/50'
              : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50'
          )}
        >
          <Settings className="w-[17px] h-[17px]" />
        </button>

        {showModePopover && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowModePopover(false)}
            />
            <div className="absolute left-12 bottom-0 w-52 bg-[#161b22] rounded-xl shadow-2xl border border-zinc-700 z-50 overflow-hidden">
              <div className="p-3 border-b border-zinc-700/60">
                <p className="text-xs font-bold text-zinc-300 mb-0.5">Interface Mode</p>
                <p className="text-[10px] text-zinc-500">Controls visible panels & complexity</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { onInterfaceModeChange('beginner'); setShowModePopover(false); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors',
                    interfaceMode === 'beginner'
                      ? 'bg-emerald-900/30 text-emerald-400'
                      : 'hover:bg-zinc-800 text-zinc-400'
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
                    interfaceMode === 'advanced'
                      ? 'bg-purple-900/30 text-purple-400'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  )}
                >
                  <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Advanced</div>
                    <div className="text-[10px] text-zinc-500">All tabs, full controls</div>
                  </div>
                  {interfaceMode === 'advanced' && <Check className="w-3.5 h-3.5 ml-auto text-purple-500" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
