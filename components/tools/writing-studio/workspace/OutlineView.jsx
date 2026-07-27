"use client";

import { useState } from "react";
import {
  GripVertical,
  MousePointer2,
  LayoutGrid,
  GitBranch,
  History,
  PlusCircle,
  FileText,
  Gauge,
  Bot,
  Library,
  ListOrdered,
  ChevronsDownUp,
  BarChart3,
  Settings,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_CHAPTERS = [
  {
    id: "ch1",
    title: "Chapter 1: The Descent",
    summary: "Protagonist Elara arrives at the derelict station. First encounter with the void-beasts. The atmospheric tension peaks as the power fails.",
    words: 3420,
    status: "focus",
    scenes: [
      { id: "s1-1", title: "Scene 1.1: Breach and Entry", desc: "Detail the docking sequence and the eerie silence of the hangar.", words: 1200, status: "Complete" },
      { id: "s1-2", title: "Scene 1.2: The Shadow in the Corridor", desc: "Elara spots movement in the peripheral. Introduction of the horror element.", words: 850, status: "In Progress" },
    ],
  },
  {
    id: "ch2",
    title: "Chapter 2: Echoes of the Past",
    summary: "Flashback sequence to the station's operational days. Elara finds a data-log from her mentor. The mystery deepens.",
    words: 2100,
    status: null,
    scenes: [],
  },
];

function LeftToolbar() {
  return (
    <aside className="w-16 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-6 gap-6 bg-white dark:bg-brand-surface/50 shrink-0">
      <button className="p-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20" title="Selection Mode" aria-label="Selection mode">
        <MousePointer2 className="h-5 w-5" />
      </button>
      <button className="p-2 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Grid View" aria-label="Grid view">
        <LayoutGrid className="h-5 w-5" />
      </button>
      <button className="p-2 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Logic Flow" aria-label="Flow view">
        <GitBranch className="h-5 w-5" />
      </button>
      <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
      <button className="p-2 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-100 dark:hover:bg-zinc-800" title="History" aria-label="Version history">
        <History className="h-5 w-5" />
      </button>
    </aside>
  );
}

function ChapterNode({ chapter, onUpdate }) {
  const isFocus = chapter.status === "focus";

  const updateField = (field, value) => {
    onUpdate({ ...chapter, [field]: value });
  };

  const updateScene = (sceneId, field, value) => {
    const updatedScenes = chapter.scenes.map((s) =>
      s.id === sceneId ? { ...s, [field]: value } : s
    );
    onUpdate({ ...chapter, scenes: updatedScenes });
  };

  return (
    <div className="group">
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border shadow-sm relative hover:border-brand/40 transition-all",
        isFocus
          ? "border-brand bg-brand/5 dark:bg-brand/10"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      )}>
        <GripVertical className="h-5 w-5 text-zinc-400 group-hover:text-brand cursor-grab mt-1 shrink-0" aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={chapter.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="bg-transparent border-none p-0 text-xl font-bold text-zinc-900 dark:text-white focus:ring-0 w-full outline-none"
              aria-label="Chapter title"
            />
            {isFocus && (
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-brand text-white ml-2 shrink-0">Focus</span>
            )}
          </div>
          <textarea
            value={chapter.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            className="w-full bg-transparent border-none p-0 text-zinc-600 dark:text-zinc-300 text-sm resize-none focus:ring-0 outline-none"
            placeholder="Brief summary of the chapter events..."
            rows={2}
            aria-label="Chapter summary"
          />
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {chapter.words.toLocaleString()} words
            </span>
            <button className="text-xs text-brand font-bold flex items-center gap-1 hover:underline" aria-label="Add scene to chapter">
              <PlusCircle className="h-3.5 w-3.5" /> Add Scene
            </button>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity shrink-0">
          <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500" aria-label="Chapter settings">
            <Settings className="h-4 w-4" />
          </button>
          <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500" aria-label="Delete chapter">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {chapter.scenes.length > 0 && (
        <div className="ml-12 mt-4 space-y-4 relative">
          <div className="absolute left-[-24px] top-0 bottom-0 w-[2px] bg-brand/20" />
          {chapter.scenes.map((scene) => (
            <div key={scene.id} className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 shadow-sm group/sub hover:border-brand/50 transition-all">
              <GripVertical className="h-4 w-4 text-zinc-300 group-hover/sub:text-brand cursor-grab mt-1 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <input
                  type="text"
                  value={scene.title}
                  onChange={(e) => updateScene(scene.id, "title", e.target.value)}
                  className="bg-transparent border-none p-0 text-base font-semibold text-zinc-800 dark:text-zinc-200 focus:ring-0 w-full outline-none"
                  aria-label="Scene title"
                />
                <textarea
                  value={scene.desc}
                  onChange={(e) => updateScene(scene.id, "desc", e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-zinc-500 dark:text-zinc-400 text-xs mt-1 resize-none focus:ring-0 outline-none"
                  rows={1}
                  aria-label="Scene description"
                />
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded">{scene.words.toLocaleString()} Words</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded",
                    scene.status === "Complete" ? "text-green-500 bg-green-500/10" : "text-amber-500 bg-amber-500/10"
                  )}>
                    {scene.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RightSidebar({ isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-surface overflow-hidden shrink-0"
        >
          <div className="w-80 p-6 overflow-y-auto h-full scrollbar-hide space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Pacing Index</h3>
                <span className="text-xs font-bold text-green-500">+15% Flow</span>
              </div>
              <div className="h-32 w-full bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 relative border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <svg className="absolute inset-0 w-full h-full p-2" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <defs>
                    <linearGradient id="pacingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-brand)" />
                      <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 35 Q10 35, 20 25 T40 15 T60 30 T80 5 T100 20" fill="none" stroke="var(--color-brand)" strokeWidth="2" />
                  <path d="M0 35 Q10 35, 20 25 T40 15 T60 30 T80 5 T100 20 V40 H0 Z" fill="url(#pacingGradient)" opacity="0.1" />
                </svg>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                  <span className="text-[8px] text-zinc-400">CH 1</span>
                  <span className="text-[8px] text-zinc-400">CLIMAX</span>
                  <span className="text-[8px] text-zinc-400">CH 12</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 text-center">Narrative arc based on scene word counts and emotional markers.</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 dark:bg-brand/10 border border-zinc-800 dark:border-brand/20">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-bold text-white dark:text-brand">AI Scene Generator</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Feeling stuck? Generate 3 possible sub-plots for Chapter 2 based on your current outline.</p>
              <button className="w-full py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 transition-colors" aria-label="Generate scene ideas">Generate Ideas</button>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Structure Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Library, label: "Bulk Add" },
                  { icon: ListOrdered, label: "Auto-Num" },
                  { icon: ChevronsDownUp, label: "Collapse" },
                  { icon: BarChart3, label: "Audit Arc" },
                ].map((tool) => (
                  <button key={tool.label} className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-brand/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-400" aria-label={tool.label}>
                    <tool.icon className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-bold">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Draft Status</span>
                <span className="font-bold">42% Complete</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full" style={{ width: "42%" }} />
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function OutlineView({ bookTitle = "The Midnight Protocol" }) {
  const [chapters, setChapters] = useState(INITIAL_CHAPTERS);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const updateChapter = (updatedChapter) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === updatedChapter.id ? updatedChapter : ch))
    );
  };

  return (
    <main className="flex flex-1 overflow-hidden">
      <LeftToolbar />
      <section className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-2">
                  <span>Projects</span> / <span>{bookTitle}</span> / <span className="text-brand font-medium">Outline</span>
                </div>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{bookTitle}</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-4">
                  <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> 12 Chapters</span>
                  <span className="flex items-center gap-1"><Gauge className="h-4 w-4" /> 42,500 words</span>
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors xl:hidden"
                aria-label={sidebarOpen ? "Hide tools panel" : "Show tools panel"}
              >
                {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {chapters.map((ch) => (
              <ChapterNode key={ch.id} chapter={ch} onUpdate={updateChapter} />
            ))}

            <div className="py-8">
              <button className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl py-6 text-zinc-400 hover:text-brand hover:border-brand/50 hover:bg-brand/5 transition-all flex flex-col items-center justify-center gap-2" aria-label="Add new chapter">
                <PlusCircle className="h-8 w-8" />
                <span className="font-bold">Add New Chapter</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <RightSidebar isOpen={sidebarOpen} />
    </main>
  );
}
