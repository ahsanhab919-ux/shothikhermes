'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  PenLine,
  Edit,
  Brain,
  Sparkles,
  FileSearch,
  CheckCheck,
  FileText,
  Languages,
  Bot,
  MessageCircle,
  Presentation,
  Table,
  Search,
  Briefcase,
  ChevronDown,
  Clapperboard,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export interface TopTab {
  id: string;
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  badgeKey?: string;
}

export interface AgentSubItem {
  id: string;
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

export const WRITING_TABS: TopTab[] = [
  {
    id: 'writing-studio',
    labelKey: 'tools.writingStudio.title',
    path: '/writing-studio',
    icon: <PenLine className="w-3.5 h-3.5" />,
    badgeKey: 'common.new',
  },
  {
    id: 'paraphrase',
    labelKey: 'tools.paraphrase.title',
    path: '/paraphrase',
    icon: <Edit className="w-3.5 h-3.5" />,
  },
  {
    id: 'ai-detector',
    labelKey: 'tools.aiDetector.title',
    path: '/ai-detector',
    icon: <Brain className="w-3.5 h-3.5" />,
  },
  {
    id: 'humanize-gpt',
    labelKey: 'sidebar.humanize',
    path: '/humanize-gpt',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    id: 'plagiarism-checker',
    labelKey: 'sidebar.plagiarism',
    path: '/plagiarism-checker',
    icon: <FileSearch className="w-3.5 h-3.5" />,
  },
  {
    id: 'grammar-checker',
    labelKey: 'tools.grammar.title',
    path: '/grammar-checker',
    icon: <CheckCheck className="w-3.5 h-3.5" />,
  },
  {
    id: 'summarize',
    labelKey: 'tools.summarizer.title',
    path: '/summarize',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: 'translator',
    labelKey: 'tools.translator.title',
    path: '/translator',
    icon: <Languages className="w-3.5 h-3.5" />,
  },
];

export const AGENT_SUB_ITEMS: AgentSubItem[] = [
  {
    id: 'chat',
    labelKey: 'sidebar.aiChat',
    path: '/agents',
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    id: 'slides',
    labelKey: 'sidebar.aiSlides',
    path: '/agents',
    icon: <Presentation className="w-4 h-4" />,
  },
  {
    id: 'sheets',
    labelKey: 'sidebar.aiSheets',
    path: '/agents',
    icon: <Table className="w-4 h-4" />,
  },
  {
    id: 'research',
    labelKey: 'sidebar.deepResearch',
    path: '/agents',
    icon: <Search className="w-4 h-4" />,
  },
  {
    id: 'animation',
    labelKey: 'tools.animation.title',
    path: '/animation',
    icon: <Clapperboard className="w-4 h-4" />,
  },
  {
    id: 'twin',
    labelKey: 'tools.twin.title',
    path: '/twin',
    icon: <UserRound className="w-4 h-4" />,
  },
  {
    id: 'browse',
    labelKey: 'tools.workForMe.title',
    path: '/agents',
    icon: <Briefcase className="w-4 h-4" />,
    comingSoon: true,
  },
];

const AGENT_COLORS: Record<string, string> = {
  chat: 'text-blue-500',
  slides: 'text-purple-500',
  sheets: 'text-emerald-500',
  research: 'text-amber-500',
  animation: 'text-pink-500',
  twin: 'text-indigo-500',
  browse: 'text-zinc-400',
};

export default function TopToolTabBar() {
  const pathname = usePathname();
  const [agentsOpen, setAgentsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  const isAgentsActive = pathname.startsWith('/agents') || pathname.startsWith('/animation') || pathname.startsWith('/slide') || pathname.startsWith('/twin');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setAgentsOpen(false);
      }
    }
    if (agentsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [agentsOpen]);

  function isTabActive(tab: TopTab) {
    if (tab.path === '/writing-studio') return pathname.startsWith('/writing-studio');
    return pathname.startsWith(tab.path);
  }

  return (
    <div className="relative w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-30">
      <div
        className="flex items-stretch overflow-x-auto scrollbar-none px-2 sm:px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {WRITING_TABS.map((tab) => {
          const active = isTabActive(tab);
          const label = t(tab.labelKey);
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={cn(
                'relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                active
                  ? 'text-brand border-b-2 border-brand'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              )}
            >
              <span className={cn('shrink-0', active ? 'text-brand' : 'text-zinc-400 dark:text-zinc-500')}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{label}</span>
              <span className="inline sm:hidden text-xs">{label.split(' ')[0]}</span>
              {tab.badgeKey && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-brand text-white leading-none">
                  {t(tab.badgeKey)}
                </span>
              )}
            </Link>
          );
        })}

        <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

        <div className="relative flex items-center shrink-0">
          <button
            ref={buttonRef}
            onClick={() => setAgentsOpen((p) => !p)}
            className={cn(
              'flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              isAgentsActive
                ? 'text-brand border-b-2 border-brand'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            )}
          >
            <Bot className={cn('w-3.5 h-3.5 shrink-0', isAgentsActive ? 'text-brand' : 'text-zinc-400 dark:text-zinc-500')} />
            <span>{t('header.agents')}</span>
            <ChevronDown
              className={cn('w-3 h-3 transition-transform duration-150', agentsOpen && 'rotate-180')}
            />
          </button>

          {agentsOpen && (
            <div
              ref={popoverRef}
              className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden"
            >
              <div className="p-2 grid grid-cols-2 gap-1">
                {AGENT_SUB_ITEMS.map((item) => {
                  const label = t(item.labelKey);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setAgentsOpen(false)}
                      className={cn(
                        'flex flex-col items-start gap-1.5 p-3 rounded-lg transition-colors',
                        item.comingSoon
                          ? 'opacity-50 cursor-not-allowed pointer-events-none'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer'
                      )}
                    >
                      <span className={cn('shrink-0', AGENT_COLORS[item.id])}>
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                          {label}
                        </p>
                        {item.comingSoon && (
                          <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t('common.comingSoon')}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
