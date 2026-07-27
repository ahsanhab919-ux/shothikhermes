"use client";

import { useState } from "react";
import {
  FolderOpen,
  Folder,
  GripVertical,
  Plus,
  CheckCircle2,
  Pencil,
  Target,
  Bold,
  Italic,
  Underline,
  Quote,
  MessageSquare,
  AlignLeft,
  AlignCenter,
  Bot,
  Send,
  Zap,
  Maximize,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CHAPTERS = [
  {
    id: "ch1",
    title: "Chapter 1: The Breach",
    icon: "folder",
    status: "complete",
    sections: [
      { id: "s1-1", title: "1.1 Introduction", active: true },
      { id: "s1-2", title: "1.2 The Encounter", active: false },
    ],
  },
  {
    id: "ch2",
    title: "Chapter 2: Echoes",
    icon: "folder_open",
    status: null,
    sections: [
      { id: "s2-1", title: "2.1 Fragments", editing: true },
    ],
  },
];

const AI_SUGGESTIONS = [
  { title: "Add Sensory Detail", desc: "Describe the smell of ozone and wet pavement after the rain." },
  { title: "Character Internal Monologue", desc: "Explore Elias's fear of his neural-link encryption failing." },
];

function LeftSidebar({ isOpen, onToggle }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-brand-surface/30 shrink-0 overflow-hidden"
        >
          <div className="w-64">
            <div className="p-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Manuscript</h3>
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors" aria-label="Add chapter">
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={onToggle} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors lg:hidden" aria-label="Close sidebar">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-hide">
              {CHAPTERS.map((ch) => (
                <div key={ch.id} className="group">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer">
                    <GripVertical className="h-3 w-3 text-zinc-400 cursor-grab" aria-hidden="true" />
                    {ch.icon === "folder" ? (
                      <Folder className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                    )}
                    <span className="text-xs font-semibold truncate flex-1">{ch.title}</span>
                    {ch.status === "complete" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" aria-label="Complete" />
                    )}
                  </div>
                  <div className="ml-6 space-y-1 mt-1 border-l-2 border-zinc-200 dark:border-zinc-800">
                    {ch.sections.map((sec) => (
                      <div
                        key={sec.id}
                        className={cn(
                          "flex items-center gap-2 p-2 py-1.5 rounded-lg cursor-pointer -ml-[2px]",
                          sec.active
                            ? "bg-brand/10 text-brand border-l-2 border-brand"
                            : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 border-l-2 border-transparent"
                        )}
                        role="button"
                        tabIndex={0}
                        aria-current={sec.active ? "true" : undefined}
                      >
                        <span className="text-xs truncate">{sec.title}</span>
                        {sec.editing && <Pencil className="h-3 w-3 text-amber-500 ml-auto" aria-label="Editing" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="bg-brand/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-brand uppercase flex items-center gap-1">
                    <Target className="h-3 w-3" /> Daily Goal
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">850 / 1000</span>
                </div>
                <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                  <div className="bg-brand h-full w-[85%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function EditorToolbar({ leftOpen, rightOpen, onToggleLeft, onToggleRight }) {
  return (
    <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-brand-surface/80 backdrop-blur-sm z-20">
      <button
        onClick={onToggleLeft}
        className={cn("p-1.5 rounded text-zinc-400 hover:text-brand transition-colors", !leftOpen && "text-brand")}
        aria-label={leftOpen ? "Hide manuscript panel" : "Show manuscript panel"}
      >
        {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300" aria-label="Bold" title="Bold (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300" aria-label="Italic" title="Italic (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300" aria-label="Underline" title="Underline (Ctrl+U)">
            <Underline className="h-4 w-4" />
          </button>
        </div>
        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 flex items-center gap-1 text-[11px] font-medium" aria-label="Insert citation">
            <Quote className="h-4 w-4" /> Citation
          </button>
          <button className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 flex items-center gap-1 text-[11px] font-medium" aria-label="Add comment">
            <MessageSquare className="h-4 w-4" /> Comment
          </button>
        </div>
        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300" aria-label="Align left">
            <AlignLeft className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300" aria-label="Align center">
            <AlignCenter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={onToggleRight}
        className={cn("p-1.5 rounded text-zinc-400 hover:text-brand transition-colors", !rightOpen && "text-brand")}
        aria-label={rightOpen ? "Hide AI panel" : "Show AI panel"}
      >
        {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </button>
    </div>
  );
}

function EditorContent() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto py-16 px-8 min-h-full">
        <h1 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">1.1 Introduction</h1>
        <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-6" style={{ fontFamily: "'Georgia', 'Cambria', serif" }}>
          <p>The rain didn&apos;t just fall; it hammered against the reinforced glass of the Neo-Saito spire, a rhythmic percussion that underscored the tension in the room. Elias stood by the window, his reflection ghostly against the neon-streaked cityscape below. He checked his neural-link one last time. The connection was stable, but the encryption was bleeding.</p>
          <p className="relative group">
            &quot;You shouldn&apos;t have come back,&quot; a voice rasped from the shadows. It was Sarah. She looked tired, the cybernetic augmentations around her left eye flickering with a faint amber light. The data drive she held was small, but its weight in the political landscape of 2084 was immeasurable.
            <span className="absolute -right-24 top-0 w-20 p-2 bg-amber-100 dark:bg-amber-900/30 border-l-2 border-amber-500 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Suggestion: Enhance the mood here.
            </span>
          </p>
          <p>Elias didn&apos;t turn around. &quot;We don&apos;t have the luxury of caution anymore. If they find the breach before we upload the sequence, the entire grid goes dark. Not just for us, but for the millions living in the Lower Ward.&quot;</p>
          <div className="w-full py-4 flex justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-1" />
          </div>
          <p>The cursor blinked at the end of the line, waiting for the next spark of inspiration. The silence of the spire was only broken by the soft hum of the environmental systems and the distant, muffled roar of the city that never slept.</p>
        </div>
      </div>
    </div>
  );
}

function EditorFooterBar() {
  return (
    <div className="h-10 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-zinc-50 dark:bg-brand-surface/30 shrink-0">
      <div className="flex items-center gap-4 text-[10px] font-medium text-zinc-500">
        <span>1,245 Words</span>
        <span>8,432 Characters</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Reading Time: 5 min
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-brand/10 text-brand">
          Tone: Narrative / Noir
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
          100%
        </div>
      </div>
    </div>
  );
}

function RightAIPanel({ isOpen, onToggle }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-brand-surface/30 shrink-0 overflow-hidden"
        >
          <div className="w-80 flex flex-col h-full">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button className="flex-1 py-3 text-[11px] font-bold uppercase tracking-tight text-brand border-b-2 border-brand" aria-label="Write AI tab" aria-selected="true">Write</button>
              <button className="flex-1 py-3 text-[11px] font-bold uppercase tracking-tight text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" aria-label="Research AI tab">Research</button>
              <button className="flex-1 py-3 text-[11px] font-bold uppercase tracking-tight text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" aria-label="Improve AI tab">Improve</button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 flex-1 overflow-y-auto space-y-4 scrollbar-hide">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl rounded-tl-none shadow-sm text-xs leading-relaxed border border-zinc-200 dark:border-zinc-700">
                    I&apos;ve analyzed your scene. Would you like to expand on Sarah&apos;s motivations or describe the Neo-Saito skyline in more detail to build atmosphere?
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase">Suggestions</h4>
                  {AI_SUGGESTIONS.map((s) => (
                    <div key={s.title} className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-brand transition-colors cursor-pointer text-xs" role="button" tabIndex={0}>
                      <p className="font-medium mb-1">{s.title}</p>
                      <p className="text-zinc-500 leading-tight">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-brand/5 rounded-xl border border-brand/20 p-3">
                  <h4 className="text-[10px] font-bold text-brand uppercase mb-2">Generate Dialogue</h4>
                  <div className="flex flex-col gap-2">
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">&quot;Sarah, the data doesn&apos;t lie. We&apos;re running out of...&quot;</div>
                    <button className="w-full py-2 bg-brand/20 text-brand text-xs font-semibold rounded-lg hover:bg-brand/30">Complete sentence</button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-surface/50">
                <div className="relative">
                  <textarea
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs p-3 pr-10 focus:ring-1 focus:ring-brand min-h-[80px] resize-none placeholder:text-zinc-400"
                    placeholder="Ask AI to write, brainstorm or research..."
                    aria-label="AI prompt input"
                  />
                  <button className="absolute bottom-2 right-2 p-1.5 bg-brand text-white rounded-lg hover:bg-brand/90" aria-label="Send message">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-brand" /> GPT-4 Omni Active
                  </span>
                  <span>0/500 tokens</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function WriteView() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <main className="flex flex-1 overflow-hidden relative">
      <LeftSidebar isOpen={leftOpen} onToggle={() => setLeftOpen(false)} />
      <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900/50 shadow-inner overflow-hidden">
        <EditorToolbar
          leftOpen={leftOpen}
          rightOpen={rightOpen}
          onToggleLeft={() => setLeftOpen(!leftOpen)}
          onToggleRight={() => setRightOpen(!rightOpen)}
        />
        <EditorContent />
        <EditorFooterBar />
      </section>
      <RightAIPanel isOpen={rightOpen} onToggle={() => setRightOpen(false)} />

      <button
        className="fixed bottom-6 left-6 w-10 h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-xl flex items-center justify-center text-zinc-500 hover:text-brand transition-colors z-50"
        aria-label="Enter zen mode (fullscreen)"
        title="Zen Mode"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </main>
  );
}
