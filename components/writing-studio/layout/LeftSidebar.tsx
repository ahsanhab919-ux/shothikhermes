'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Target,
  Flame,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getGoals,
  setDailyGoal,
  getTodayWords,
  getStreakStatus,
} from '@/lib/writing-goals';

interface Chapter {
  id: string;
  title: string;
  status?: 'complete' | 'in-progress' | 'draft';
  sections: Section[];
  isOpen?: boolean;
  wordCount?: number;
  wordTarget?: number;
}

interface Section {
  id: string;
  title: string;
  isActive?: boolean;
}

interface ResearchNotes {
  comparables?: string[];
  themes?: string[];
  settingNotes?: string;
  characterArchetypes?: string[];
  keyConflicts?: string[];
}

type SidebarView = 'chapters' | 'search' | 'research' | 'goals';

type ProjectType = 'book' | 'research' | 'assignment';

interface LeftSidebarProps {
  chapters?: Chapter[];
  activeSectionId?: string;
  onSectionClick?: (sectionId: string) => void;
  onChaptersChange?: (chapters: Chapter[]) => void;
  researchNotes?: ResearchNotes | null;
  activeView?: SidebarView;
  projectType?: ProjectType;
}

const DEFAULT_CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    title: 'Chapter 1: The Breach',
    status: 'in-progress',
    isOpen: true,
    wordCount: 0,
    sections: [
      { id: 's1-1', title: '1.1 Introduction', isActive: true },
      { id: 's1-2', title: '1.2 The Encounter' },
    ],
  },
  {
    id: 'ch2',
    title: 'Chapter 2: Echoes',
    status: 'draft',
    isOpen: false,
    wordCount: 0,
    sections: [{ id: 's2-1', title: '2.1 Fragments' }],
  },
];

const RESEARCH_DEFAULT_SECTIONS: Chapter[] = [
  { id: 'abstract', title: 'Abstract', status: 'draft', isOpen: true, wordCount: 0, sections: [] },
  { id: 'introduction', title: 'Introduction', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
  { id: 'methodology', title: 'Methodology', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
  { id: 'results', title: 'Results', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
  { id: 'discussion', title: 'Discussion', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
  { id: 'conclusion', title: 'Conclusion', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
];

const ASSIGNMENT_DEFAULT_SECTIONS: Chapter[] = [
  { id: 'introduction', title: 'Introduction', status: 'draft', isOpen: true, wordCount: 0, sections: [] },
  { id: 'body', title: 'Body', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
  { id: 'conclusion', title: 'Conclusion', status: 'draft', isOpen: false, wordCount: 0, sections: [] },
];

function getDefaultChapters(projectType?: ProjectType): Chapter[] {
  if (projectType === 'research') return RESEARCH_DEFAULT_SECTIONS;
  if (projectType === 'assignment') return ASSIGNMENT_DEFAULT_SECTIONS;
  return DEFAULT_CHAPTERS;
}

function CircularProgress({ percent, size = 56 }: { percent: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, percent) / 100) * circumference;
  const isComplete = percent >= 100;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        className="text-zinc-200 dark:text-zinc-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn(
          'transition-all duration-700',
          isComplete ? 'text-brand' : 'text-brand'
        )}
      />
    </svg>
  );
}

export function LeftSidebar({
  chapters,
  activeSectionId,
  onSectionClick,
  onChaptersChange,
  researchNotes,
  activeView = 'chapters',
  projectType = 'book',
}: LeftSidebarProps) {
  const defaultChapters = getDefaultChapters(projectType);
  const resolvedChapters = chapters ?? defaultChapters;
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(resolvedChapters.filter(c => c.isOpen).map(c => c.id))
  );
  const [chapterList, setChapterList] = useState<Chapter[]>(resolvedChapters);

  const [dailyGoal, setDailyGoalState] = useState(500);
  const [todayWords, setTodayWordsState] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputValue, setGoalInputValue] = useState('500');
  const goalInputRef = useRef<HTMLInputElement>(null);

  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const newChapterInputRef = useRef<HTMLInputElement>(null);

  const dragOverRef = useRef<string | null>(null);

  useEffect(() => {
    const goals = getGoals();
    const words = getTodayWords();
    const streakData = getStreakStatus();
    setDailyGoalState(goals.dailyGoalWords);
    setGoalInputValue(String(goals.dailyGoalWords));
    setTodayWordsState(words);
    setStreak(streakData.currentStreak);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const words = getTodayWords();
      const streakData = getStreakStatus();
      setTodayWordsState(words);
      setStreak(streakData.currentStreak);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goalProgress = dailyGoal > 0 ? Math.round((todayWords / dailyGoal) * 100) : 0;

  const saveGoal = () => {
    const n = parseInt(goalInputValue, 10);
    if (!isNaN(n) && n > 0) {
      setDailyGoal(n);
      setDailyGoalState(n);
    }
    setIsEditingGoal(false);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const addNewChapter = () => {
    if (!newChapterTitle.trim()) {
      setAddingChapter(false);
      return;
    }
    const newChapter: Chapter = {
      id: `ch_${Date.now()}`,
      title: newChapterTitle.trim(),
      status: 'draft',
      isOpen: false,
      wordCount: 0,
      sections: [],
    };
    const updated = [...chapterList, newChapter];
    setChapterList(updated);
    onChaptersChange?.(updated);
    setNewChapterTitle('');
    setAddingChapter(false);
  };

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    e.dataTransfer.setData('chapterId', chapterId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    dragOverRef.current = targetId;
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('chapterId');
    if (draggedId === targetId) return;
    const updated = [...chapterList];
    const fromIdx = updated.findIndex(c => c.id === draggedId);
    const toIdx = updated.findIndex(c => c.id === targetId);
    const [removed] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, removed);
    setChapterList(updated);
    onChaptersChange?.(updated);
  };

  const getChapterStatusFromTarget = (chapter: Chapter) => {
    if (!chapter.wordTarget) return null;
    const pct = (chapter.wordCount ?? 0) / chapter.wordTarget;
    if (pct >= 0.9) return 'complete';
    if (pct >= 0.2) return 'in-progress';
    return 'draft';
  };

  return (
    <aside className="w-56 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-brand-surface/40">
      {activeView === 'chapters' ? (
        <>
          {/* Structure Header */}
          <div className="p-3 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Structure
            </h3>
            <button
              onClick={() => {
                setAddingChapter(true);
                setTimeout(() => newChapterInputRef.current?.focus(), 50);
              }}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
              title="Add chapter"
            >
              <Plus className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* New Chapter Input */}
          <AnimatePresence>
            {addingChapter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 pb-2 overflow-hidden"
              >
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-brand/40 rounded-lg px-2 py-1.5">
                  <input
                    ref={newChapterInputRef}
                    type="text"
                    value={newChapterTitle}
                    onChange={e => setNewChapterTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addNewChapter();
                      if (e.key === 'Escape') {
                        setAddingChapter(false);
                        setNewChapterTitle('');
                      }
                    }}
                    placeholder="Chapter title..."
                    className="flex-1 text-xs bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                  />
                  <button onClick={addNewChapter} className="text-brand hover:text-brand/80">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setAddingChapter(false); setNewChapterTitle(''); }}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chapters List */}
          <div
            role="list"
            aria-label="Document chapters"
            aria-live="polite"
            className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar"
          >
            {chapterList.map(chapter => {
              const autoStatus = getChapterStatusFromTarget(chapter);
              const displayStatus = autoStatus || chapter.status;
              return (
                <div
                  key={chapter.id}
                  role="listitem"
                  className="group"
                  draggable
                  onDragStart={e => handleDragStart(e, chapter.id)}
                  onDragOver={e => handleDragOver(e, chapter.id)}
                  onDrop={e => handleDrop(e, chapter.id)}
                >
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <GripVertical className="w-3 h-3 text-zinc-400 cursor-grab opacity-0 group-hover:opacity-100 shrink-0" />

                    {expandedChapters.has(chapter.id) ? (
                      <FolderOpen className="w-4 h-4 text-brand shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}

                    <div className="flex-1 text-left min-w-0">
                      <span className={cn(
                        'text-xs font-semibold truncate block',
                        displayStatus === 'complete' ? 'text-zinc-400' :
                        displayStatus === 'in-progress' ? 'text-zinc-700 dark:text-zinc-200' :
                        'text-zinc-500'
                      )}>
                        {chapter.title}
                      </span>
                      {(chapter.wordCount !== undefined && chapter.wordCount > 0) && (
                        <span className="text-[9px] text-zinc-400">
                          {chapter.wordCount.toLocaleString()} words
                          {chapter.wordTarget ? ` / ${chapter.wordTarget.toLocaleString()}` : ''}
                        </span>
                      )}
                    </div>

                    {displayStatus && (
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        displayStatus === 'complete' ? 'bg-brand' :
                        displayStatus === 'in-progress' ? 'bg-brand/50' :
                        'bg-muted-foreground/30'
                      )} />
                    )}

                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  {/* Chapter word target progress bar */}
                  {chapter.wordTarget && (chapter.wordCount ?? 0) > 0 && (
                    <div className="mx-2 mb-1 h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand/60 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((chapter.wordCount ?? 0) / chapter.wordTarget) * 100)}%`
                        }}
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {expandedChapters.has(chapter.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-6 space-y-1 mt-1 border-l-2 border-zinc-200 dark:border-zinc-800"
                      >
                        {chapter.sections.map(section => (
                          <button
                            key={section.id}
                            onClick={() => onSectionClick?.(section.id)}
                            className={cn(
                              'w-full flex items-center gap-2 p-2 py-1.5 rounded-lg -ml-[2px] border-l-2 transition-colors text-left',
                              section.id === activeSectionId || section.isActive
                                ? 'bg-brand/10 text-brand border-brand'
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 border-transparent'
                            )}
                          >
                            <span className="text-xs truncate">{section.title}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Daily Goal Card */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="bg-brand/5 dark:bg-brand/10 rounded-xl p-3">
              <div className="flex items-center gap-3">
                {/* Circular progress ring */}
                <div className="relative shrink-0">
                  <CircularProgress percent={goalProgress} size={52} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn(
                      'text-[10px] font-black',
                      goalProgress >= 100 ? 'text-brand' : 'text-brand'
                    )}>
                      {Math.min(100, goalProgress)}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-brand uppercase flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Daily Goal
                    </span>
                  </div>

                  {isEditingGoal ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        ref={goalInputRef}
                        type="number"
                        value={goalInputValue}
                        onChange={e => setGoalInputValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveGoal();
                          if (e.key === 'Escape') setIsEditingGoal(false);
                        }}
                        className="w-16 text-xs bg-white dark:bg-zinc-800 border border-brand/40 rounded px-1.5 py-0.5 outline-none text-zinc-800 dark:text-zinc-200"
                        min={1}
                        autoFocus
                      />
                      <span className="text-[10px] text-zinc-400">words</span>
                      <button onClick={saveGoal} className="text-brand hover:text-brand/80">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditingGoal(true);
                        setTimeout(() => goalInputRef.current?.focus(), 50);
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors text-left"
                      title="Click to change goal"
                    >
                      {todayWords.toLocaleString()} / {dailyGoal.toLocaleString()} words
                    </button>
                  )}

                  {/* Streak */}
                  <div className="mt-1.5 flex items-center gap-1">
                    <Flame className={cn(
                      'w-3 h-3',
                      streak > 0 ? 'text-brand' : 'text-muted-foreground/30'
                    )} />
                    {streak > 0 ? (
                      <span className="text-[10px] font-bold text-brand">
                        {streak}-day streak
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">No streak yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeView === 'search' ? (
        <SearchPanel chapters={chapterList} onSelect={(id) => onSectionClick?.(id)} />
      ) : activeView === 'research' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ResearchPanel notes={researchNotes} />
        </div>
      ) : activeView === 'goals' ? (
        <GoalsPanel
          goalProgress={goalProgress}
          dailyGoal={dailyGoal}
          todayWords={todayWords}
          streak={streak}
          isEditingGoal={isEditingGoal}
          goalInputValue={goalInputValue}
          goalInputRef={goalInputRef}
          onGoalInputChange={setGoalInputValue}
          onStartEdit={() => { setIsEditingGoal(true); setTimeout(() => goalInputRef.current?.focus(), 50); }}
          onSaveGoal={saveGoal}
          onCancelEdit={() => setIsEditingGoal(false)}
        />
      ) : null}
    </aside>
  );
}

function ResearchPanel({ notes }: { notes?: ResearchNotes | null }) {
  if (!notes) {
    return (
      <div className="p-4 text-center py-8">
        <p className="text-xs text-zinc-400">No research notes yet.</p>
        <p className="text-[10px] text-zinc-300 dark:text-zinc-500 mt-1">
          Start a project with the AI agent to generate research.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {notes.settingNotes && (
        <ResearchSection title="Setting & Context">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {notes.settingNotes}
          </p>
        </ResearchSection>
      )}

      {notes.themes && notes.themes.length > 0 && (
        <ResearchSection title="Key Themes">
          <div className="space-y-2">
            {notes.themes.map((theme, i) => (
              <div key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-brand/30 pl-2">
                {theme}
              </div>
            ))}
          </div>
        </ResearchSection>
      )}

      {notes.characterArchetypes && notes.characterArchetypes.length > 0 && (
        <ResearchSection title="Characters">
          <div className="space-y-2">
            {notes.characterArchetypes.map((char, i) => (
              <div key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-2">
                {char}
              </div>
            ))}
          </div>
        </ResearchSection>
      )}

      {notes.keyConflicts && notes.keyConflicts.length > 0 && (
        <ResearchSection title="Key Conflicts">
          <div className="space-y-1.5">
            {notes.keyConflicts.map((conflict, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <span className="text-brand mt-0.5 shrink-0">⚡</span>
                <span>{conflict}</span>
              </div>
            ))}
          </div>
        </ResearchSection>
      )}

      {notes.comparables && notes.comparables.length > 0 && (
        <ResearchSection title="Comparable Works">
          <div className="space-y-2">
            {notes.comparables.map((comp, i) => (
              <div key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-zinc-200 dark:border-zinc-700 pl-2">
                {comp}
              </div>
            ))}
          </div>
        </ResearchSection>
      )}
    </div>
  );
}

function SearchPanel({
  chapters,
  onSelect,
}: {
  chapters: { id: string; title: string; sections: { id: string; title: string }[] }[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? chapters.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : chapters;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus-within:border-brand transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search chapters…"
            className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar space-y-0.5">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-zinc-400">No chapters found</p>
        ) : filtered.map(ch => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{ch.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalsPanel({
  goalProgress,
  dailyGoal,
  todayWords,
  streak,
  isEditingGoal,
  goalInputValue,
  goalInputRef,
  onGoalInputChange,
  onStartEdit,
  onSaveGoal,
  onCancelEdit,
}: {
  goalProgress: number;
  dailyGoal: number;
  todayWords: number;
  streak: number;
  isEditingGoal: boolean;
  goalInputValue: string;
  goalInputRef: React.RefObject<HTMLInputElement | null>;
  onGoalInputChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveGoal: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Writing Goals</h3>

      {/* Ring */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <CircularProgress percent={goalProgress} size={80} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-sm font-black', 'text-brand')}>
              {Math.min(100, goalProgress)}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {todayWords.toLocaleString()} / {dailyGoal.toLocaleString()} words
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">today's writing</p>
        </div>
      </div>

      {/* Goal edit */}
      <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Daily Goal
          </span>
        </div>
        {isEditingGoal ? (
          <div className="flex items-center gap-2">
            <input
              ref={goalInputRef}
              type="number"
              value={goalInputValue}
              onChange={e => onGoalInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSaveGoal();
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="w-20 text-sm bg-white dark:bg-zinc-800 border border-brand/40 rounded px-2 py-1 outline-none text-zinc-800 dark:text-zinc-200"
              min={1}
            />
            <span className="text-xs text-zinc-400">words</span>
            <button onClick={onSaveGoal} className="text-brand hover:text-brand/80">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={onCancelEdit} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onStartEdit}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            {dailyGoal.toLocaleString()} words/day · click to change
          </button>
        )}
      </div>

      {/* Streak */}
      <div className="flex items-center gap-3 bg-brand/5 dark:bg-brand/10 rounded-xl p-3">
        <Flame className={cn('w-6 h-6', streak > 0 ? 'text-brand' : 'text-muted-foreground/30')} />
        <div>
          {streak > 0 ? (
            <>
              <p className="text-sm font-bold text-brand">{streak}-day streak</p>
              <p className="text-[10px] text-zinc-400">Keep it going!</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-500">No streak yet</p>
              <p className="text-[10px] text-zinc-400">Write today to start one</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResearchSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          {title}
        </span>
        <ChevronRight className={cn('w-3 h-3 text-zinc-300 transition-transform', open && 'rotate-90')} />
      </button>
      {open && children}
    </div>
  );
}
