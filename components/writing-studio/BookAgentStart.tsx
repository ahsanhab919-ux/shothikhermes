'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Brain,
  FlaskConical,
  GraduationCap,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Paperclip,
  MessageCircle,
  Presentation,
  Table,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import SvgColor from '@/components/common/SvgColor';
import { useTranslation } from '@/i18n';
import { createProject } from '@/lib/projects-store';
import { cn } from '@/lib/utils';
import { debugLog } from '@/lib/debug-log';
import { SourceIntake, type ProjectSource } from './SourceIntake';

const TOOL_TILES = [
  { label: 'Paraphrase', icon: 'paraphrase', href: '/paraphrase' },
  { label: 'AI Detector', icon: 'ai_detector', href: '/ai-detector' },
  { label: 'Humanize', icon: 'humanize', href: '/humanize-gpt' },
  { label: 'Plagiarism', icon: 'plagiarism_checker', href: '/plagiarism-checker' },
  { label: 'Grammar', icon: 'grammar_checker', href: '/grammar-checker' },
  { label: 'Summarize', icon: 'summarize', href: '/summarize' },
  { label: 'Translate', icon: 'translator', href: '/translator' },
];

const AGENT_TILES: { label: string; Icon: React.ElementType; href: string }[] = [
  { label: 'AI Chat', Icon: MessageCircle, href: '/agents/chat' },
  { label: 'AI Slides', Icon: Presentation, href: '/agents/presentation' },
  { label: 'AI Sheets', Icon: Table, href: '/agents/sheets' },
  { label: 'Research', Icon: Search, href: '/agents/research' },
];

type ProjectType = 'book' | 'research' | 'assignment';
type Phase = 'sources' | 'prompt' | 'working' | 'done';

interface AgentStep {
  id: number;
  message: string;
  status: 'pending' | 'active' | 'done';
}

interface GeneratedChapter {
  id: string;
  title: string;
  synopsis: string;
}

interface BookPlan {
  title: string;
  genre: string;
  logline: string;
  chapters: GeneratedChapter[];
  researchNotes: {
    comparables: string[];
    themes: string[];
    settingNotes: string;
    characterArchetypes: string[];
    keyConflicts: string[];
  };
}

interface BookAgentStartProps {
  onProjectCreated: (project: any) => void;
  onCancel: () => void;
  embedded?: boolean;
  initialProjectType?: ProjectType;
  initialDescription?: string;
}

const TYPE_CONFIGS: Record<
  ProjectType,
  {
    label: string;
    icon: any;
    color: string;
    placeholder: string;
    description: string;
    deliverableLabel: string;
    supportCopy: string;
  }
> = {
  book: {
    label: 'Book',
    icon: BookOpen,
    color: 'var(--color-type-book)',
    placeholder: 'e.g., A crime thriller set in 1940s New Orleans following a morally grey detective who discovers the city\'s darkest secret...',
    description: 'Build a long-form manuscript with chapter structure, comparables, and narrative arc guidance.',
    deliverableLabel: 'Book manuscript plan',
    supportCopy: 'Best for fiction, nonfiction, memoir, and long-form publishing projects.',
  },
  research: {
    label: 'Research Paper',
    icon: FlaskConical,
    color: 'var(--color-type-research)',
    placeholder: 'e.g., A paper investigating how social media algorithm design drives political polarization in Gen Z users...',
    description: 'Generate a paper structure with sections, thesis framing, methodology cues, and source-aware notes.',
    deliverableLabel: 'Research paper plan',
    supportCopy: 'Best for journal papers, conference submissions, theses, and literature reviews.',
  },
  assignment: {
    label: 'Assignment',
    icon: GraduationCap,
    color: 'var(--color-type-assignment)',
    placeholder: 'e.g., A case study analyzing Tesla\'s supply chain failures during COVID-19 and their strategic response...',
    description: 'Turn a prompt or brief into a structured assignment outline with evidence and marking-criteria guidance.',
    deliverableLabel: 'Assignment draft plan',
    supportCopy: 'Best for essays, case studies, lab reports, proposals, and coursework tasks.',
  },
};

const SUGGESTIONS: Record<ProjectType, string[]> = {
  book: [
    'A detective realizes she committed the murder she\'s investigating',
    'A coming-of-age story about a musician in 1970s London',
    'First contact with aliens who communicate through mathematics',
  ],
  research: [
    'Long-term cognitive effects of remote learning on K-12 students',
    'Machine learning approaches to early-stage Alzheimer\'s detection',
    'Carbon capture technologies: a comparative effectiveness analysis',
  ],
  assignment: [
    'Ethical implications of AI in hiring decisions',
    'Netflix\'s content strategy pivot: a business analysis',
    'Impact of minimum wage increases on small businesses',
  ],
};

function buildInitialSteps(projectType: ProjectType): AgentStep[] {
  const structureLabel = projectType === 'book' ? 'chapter' : 'section';
  const toneLabel =
    projectType === 'book'
      ? 'genre and tone'
      : projectType === 'research'
      ? 'research focus and argument'
      : 'assignment brief and marking criteria';

  return [
    { id: 1, message: 'Reading your brief...', status: 'pending' },
    { id: 2, message: `Analyzing ${toneLabel}...`, status: 'pending' },
    { id: 3, message: 'Reviewing sources and comparable material...', status: 'pending' },
    { id: 4, message: `Building your ${structureLabel} structure...`, status: 'pending' },
    { id: 5, message: 'Creating notes and recommendations...', status: 'pending' },
    { id: 6, message: 'Preparing your workspace...', status: 'pending' },
  ];
}

function getProjectOutputLabel(projectType: ProjectType) {
  switch (projectType) {
    case 'research':
      return 'paper';
    case 'assignment':
      return 'assignment draft';
    default:
      return 'manuscript';
  }
}

function getStructureLabel(projectType: ProjectType) {
  return projectType === 'book' ? 'Chapters' : 'Sections';
}

export function BookAgentStart({
  onProjectCreated,
  onCancel,
  embedded,
  initialProjectType = 'book',
  initialDescription = '',
}: BookAgentStartProps) {
  const [phase, setPhase] = useState<Phase>('prompt');
  const [description, setDescription] = useState(initialDescription);
  const [projectType, setProjectType] = useState<ProjectType>(initialProjectType);
  const [sources, setSources] = useState<ProjectSource[]>([]);
  const [steps, setSteps] = useState<AgentStep[]>(buildInitialSteps(initialProjectType));
  const [generatedPlan, setGeneratedPlan] = useState<BookPlan | null>(null);
  const [visibleChapters, setVisibleChapters] = useState<GeneratedChapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chapterRevealRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();

  const config = TYPE_CONFIGS[projectType];
  const SelectedTypeIcon = config.icon;

  const handleProjectTypeChange = useCallback((nextType: ProjectType) => {
    setProjectType(nextType);
    setError(null);
    debugLog.info('BookAgent', 'Project type selected', { type: nextType });
  }, []);

  useEffect(() => {
    if (phase === 'prompt') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [phase]);

  useEffect(() => {
    setProjectType(initialProjectType);
    setSteps(buildInitialSteps(initialProjectType));
  }, [initialProjectType]);

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription]);

  const revealChapters = useCallback((chapters: GeneratedChapter[]) => {
    if (reducedMotion) {
      // Skip animation — show all chapters immediately
      setVisibleChapters(chapters);
      return;
    }
    let i = 0;
    const reveal = () => {
      if (i < chapters.length) {
        setVisibleChapters(prev => [...prev, chapters[i]]);
        i++;
        chapterRevealRef.current = setTimeout(reveal, 180);
      }
    };
    reveal();
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      if (chapterRevealRef.current) clearTimeout(chapterRevealRef.current);
    };
  }, []);

  const handleStart = useCallback(async () => {
    if (!description.trim()) return;

    setPhase('working');
    setError(null);
    setVisibleChapters([]);
    const hasSources = sources.length > 0;
    setSteps(buildInitialSteps(projectType).map((s, i) => ({
      ...s,
      message: i === 0 && hasSources ? 'Analyzing your sources...' : s.message,
      status: i === 0 ? 'active' : 'pending',
    })));

    debugLog.info('BookAgent', 'Project creation started', { type: projectType, hasSources, sourcesCount: sources.length });

    try {
      const response = await fetch('/api/book-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), type: projectType, sources }),
      });

      if (!response.ok) throw new Error('The agent failed to respond. Please try again.');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'status') {
              setSteps(prev =>
                prev.map(s => ({
                  ...s,
                  status:
                    s.id === event.step
                      ? 'active'
                      : s.id < event.step
                      ? 'done'
                      : 'pending',
                }))
              );
            }

            if (event.type === 'done') {
              const plan: BookPlan = event.plan;
              debugLog.info('BookAgent', 'AI streaming completed', { title: plan.title, genre: plan.genre, chapterCount: plan.chapters.length });
              setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
              setGeneratedPlan(plan);
              revealChapters(plan.chapters);

              const project = createProject({
                title: plan.title,
                type: projectType,
                template: null,
                description: description.trim(),
                settings: {
                  agentGenerated: true,
                  genre: plan.genre,
                  logline: plan.logline,
                },
                researchNotes: plan.researchNotes,
                agentChapters: plan.chapters,
              });

              setTimeout(() => {
                setPhase('done');
                setTimeout(() => onProjectCreated(project), 1600);
              }, plan.chapters.length * 180 + 400);
            }

            if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr: any) {
            if (!parseErr.message?.includes('JSON')) throw parseErr;
          }
        }
      }
    } catch (err: any) {
      debugLog.error('BookAgent', 'Project creation failed', { error: err.message });
      setError(err.message || 'Something went wrong. Please try again.');
      setPhase('prompt');
    }
  }, [description, projectType, sources, onProjectCreated, revealChapters]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleStart();
    }
  };

  if (phase === 'sources') {
    return (
      <SourceIntake
        initialSources={sources}
        embedded={embedded}
        onComplete={(selectedSources) => {
          setSources(selectedSources);
          setPhase('prompt');
        }}
        onSkip={() => {
          setSources([]);
          setPhase('prompt');
        }}
      />
    );
  }

  return (
    <div className={embedded ? "h-full bg-background flex flex-col overflow-hidden" : "fixed inset-0 z-[200] bg-background flex flex-col overflow-hidden"}>
      <AnimatePresence mode="wait">
        {phase === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Shothik Writing Planner</span>
              </div>
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to projects
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 max-w-2xl mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full"
              >
                <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
                  What are you creating today?
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-8">
                  Describe your book, research paper, or assignment. The planner will research, structure, and scaffold your project before opening it in Writing Studio.
                </p>

                <div className="flex items-center gap-2 mb-4 justify-center">
                  {(Object.entries(TYPE_CONFIGS) as [ProjectType, typeof TYPE_CONFIGS[ProjectType]][]).map(([type, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => handleProjectTypeChange(type)}
                        aria-pressed={projectType === type}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                          projectType === type
                            ? 'border-transparent text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
                        )}
                        style={projectType === type ? { backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${cfg.color} 31%, transparent)`, color: cfg.color } : {}}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="mb-5 rounded-2xl border border-border bg-card/80 p-4"
                  style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${config.color} 18%, transparent)` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${config.color} 16%, transparent)` }}
                    >
                      <SelectedTypeIcon className="h-4.5 w-4.5" style={{ color: config.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {config.deliverableLabel}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {config.description}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {config.supportCopy}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mb-2">
                  <textarea
                    ref={textareaRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={config.placeholder}
                    rows={4}
                    className="w-full bg-muted border border-border rounded-t-2xl px-5 pt-4 pb-10 text-foreground placeholder:text-muted-foreground text-sm leading-relaxed outline-none focus:border-brand/50 focus:bg-muted/80 transition-all resize-none"
                  />
                  {/* Textarea footer bar */}
                  <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-2 rounded-b-2xl bg-muted border border-t-0 border-border">
                    <button
                      onClick={() => setPhase('sources')}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Add reference sources (optional)"
                    >
                      <Paperclip className="w-4 h-4" />
                      {sources.length > 0 && (
                        <span className="text-[10px] text-brand/70 font-medium">
                          {sources.length} attached
                        </span>
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground select-none">⌘ Enter to generate plan</span>
                  </div>
                </div>

                {/* Tool tiles — Genspark style */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {TOOL_TILES.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 hover:border-border transition-all no-underline group"
                    >
                      <SvgColor
                        src={`/navbar/${tool.icon}.svg`}
                        className="h-5 w-5 bg-muted-foreground group-hover:bg-foreground transition-colors"
                      />
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap font-medium">
                        {tool.label}
                      </span>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="flex-shrink-0 w-px h-10 bg-border self-center mx-1" />

                  {/* Agent tiles */}
                  {AGENT_TILES.map((agent) => {
                    const Icon = agent.Icon;
                    return (
                      <Link
                        key={agent.href}
                        href={agent.href}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 hover:border-border transition-all no-underline group"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap font-medium">
                          {agent.label}
                        </span>
                      </Link>
                    );
                  })}

                  <div className="flex-shrink-0 w-px h-10 bg-border self-center mx-1" />

                  <Link
                    href="/twin"
                    className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 hover:border-violet-500/40 hover:from-violet-500/15 hover:to-blue-500/15 transition-all no-underline group"
                  >
                    <Brain className="h-5 w-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                    <span className="text-[10px] text-violet-400 group-hover:text-violet-300 transition-colors whitespace-nowrap font-medium">
                      {t('sidebar.twin')}
                    </span>
                  </Link>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2 mb-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Or try one of these</p>
                  {SUGGESTIONS[projectType].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setDescription(s)}
                      className="text-left px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-border transition-all text-sm text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStart}
                  disabled={!description.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand hover:bg-brand/90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-brand/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate plan
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {(phase === 'working' || phase === 'done') && (
          <motion.div
            key="working"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border absolute top-0 inset-x-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Shothik Writing Planner</span>
              </div>
            </div>

            <div className="flex-1 flex mt-14">
              <div className="w-[380px] border-r border-border flex flex-col p-8 pt-10 shrink-0">
                <div className="mb-6">
                  {phase === 'done' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 mb-1"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold text-sm">Your project is ready</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <Loader2 className="w-4 h-4 text-brand animate-spin" />
                      <span className="text-muted-foreground text-sm">Building your {getProjectOutputLabel(projectType)}...</span>
                    </div>
                  )}
                  {description && (
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2 leading-relaxed">
                      "{description}"
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {steps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: step.status === 'pending' ? 0.3 : 1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                        {step.status === 'done' ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </motion.div>
                        ) : step.status === 'active' ? (
                          <Loader2 className="w-4 h-4 text-brand animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm transition-colors',
                          step.status === 'done'
                            ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                            : step.status === 'active'
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground/50'
                        )}
                      >
                        {step.message}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {generatedPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-6 border-t border-border"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Genre</p>
                    <p className="text-foreground/70 text-xs mb-4">{generatedPlan.genre}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Logline</p>
                    <p className="text-muted-foreground text-xs leading-relaxed italic">"{generatedPlan.logline}"</p>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-10">
                {generatedPlan ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-2xl font-bold text-foreground mb-1">{generatedPlan.title}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-6">
                      {generatedPlan.chapters.length} {getStructureLabel(projectType)}
                    </p>

                    <div className="space-y-2">
                      <AnimatePresence>
                        {visibleChapters.map((ch, i) => (
                          <motion.div
                            key={ch.id}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-border transition-colors"
                          >
                            <div className="text-[10px] font-bold text-muted-foreground w-6 text-right pt-0.5 shrink-0 font-mono">
                              {String(i + 1).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="text-foreground text-sm font-medium mb-1">{ch.title}</p>
                              <p className="text-muted-foreground text-xs leading-relaxed">{ch.synopsis}</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {visibleChapters.length < (generatedPlan?.chapters.length ?? 0) && (
                        <div className="flex items-center gap-2 py-2 px-4">
                          <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                          <span className="text-muted-foreground text-xs">
                            {visibleChapters.length} of {generatedPlan.chapters.length} chapters...
                          </span>
                        </div>
                      )}
                    </div>

                    {phase === 'done' && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-emerald-400 font-semibold text-sm">Opening your editor...</p>
                          <p className="text-emerald-400/60 text-xs mt-0.5">
                            Research notes, chapter outline, and AI assistant are all ready.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Generating your book plan...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
