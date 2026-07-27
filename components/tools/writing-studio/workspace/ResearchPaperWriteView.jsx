"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FileText,
  BookOpen,
  FlaskConical,
  BarChart3,
  MessageSquare,
  Search,
  Plus,
  Send,
  Quote,
  ExternalLink,
  Sparkles,
  GripVertical,
  Clock,
  Target,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
} from "lucide-react";

const SECTIONS = [
  { id: "abstract", title: "Abstract", icon: FileText },
  { id: "intro", title: "Introduction", icon: BookOpen },
  { id: "lit-review", title: "Literature Review", icon: Search },
  { id: "methodology", title: "Methodology", icon: FlaskConical },
  { id: "results", title: "Results", icon: BarChart3 },
  { id: "discussion", title: "Discussion", icon: MessageSquare },
  { id: "conclusion", title: "Conclusion", icon: Target },
  { id: "references", title: "References", icon: Quote },
];

const SAMPLE_CITATIONS = [
  { id: 1, authors: "Kumar, S. et al.", year: 2024, title: "Deep Learning Approaches for Edge Computing Optimization", journal: "IEEE Trans. Neural Networks", doi: "10.1109/TNN.2024.001", cited: 47 },
  { id: 2, authors: "Chen, L. & Wang, R.", year: 2023, title: "Federated Learning in Resource-Constrained Environments", journal: "ACM Computing Surveys", doi: "10.1145/CS.2023.042", cited: 89 },
  { id: 3, authors: "Patel, A. et al.", year: 2024, title: "Energy-Efficient Neural Architecture Search", journal: "Nature Machine Intelligence", doi: "10.1038/NMI.2024.015", cited: 32 },
];

function getSectionKey(projectId, sectionId) {
  return `research-draft-${projectId || "default"}-${sectionId}`;
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function SectionSidebar({ activeSection, onSectionChange, wordCounts }) {
  const totalWords = Object.values(wordCounts).reduce((a, b) => a + b, 0);
  const completedSections = SECTIONS.filter((s) => (wordCounts[s.id] || 0) > 50).length;

  return (
    <aside className="w-64 bg-white dark:bg-brand-surface border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sections</h3>
          <span className="text-[10px] text-zinc-400">{completedSections}/{SECTIONS.length}</span>
        </div>
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedSections / SECTIONS.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">{totalWords.toLocaleString()} words total</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" role="list" aria-label="Document sections">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const wc = wordCounts[section.id] || 0;
          const isDone = wc > 50;
          return (
            <button
              key={section.id}
              role="listitem"
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent"
              }`}
              aria-label={`Go to ${section.title}`}
              aria-current={isActive ? "page" : undefined}
            >
              <GripVertical size={12} className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
              <Icon size={14} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"} />
              <span className={`text-xs font-medium flex-1 ${isActive ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                {section.title}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-emerald-500" : isActive ? "bg-blue-400" : "bg-zinc-300 dark:bg-zinc-600"}`} />
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Target Journal</span>
          </div>
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">IEEE Trans. Neural Networks</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Word limit: 8,000</p>
        </div>
      </div>
    </aside>
  );
}

function ResearchEditor({ projectId, activeSection, onWordCountChange }) {
  const sectionRef = useRef(activeSection);
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          const section = SECTIONS.find((s) => s.id === sectionRef.current);
          return `Start writing your ${section?.title || "section"} here...`;
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Research paper editor",
        "aria-multiline": "true",
        class: "prose dark:prose-invert max-w-none focus:outline-none min-h-[400px]",
        style: "font-family: 'Georgia', serif; font-size: 16px; line-height: 1.8;",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const wc = countWords(text);
      onWordCountChange(sectionRef.current, wc);
      const key = getSectionKey(projectId, sectionRef.current);
      localStorage.setItem(key, editor.getHTML());
    },
  });

  editorRef.current = editor;

  const loadSection = useCallback(
    (sectionId) => {
      if (!editor) return;
      const key = getSectionKey(projectId, sectionId);
      const saved = localStorage.getItem(key) || "";
      editor.commands.setContent(saved, false);
      const text = editor.getText();
      onWordCountChange(sectionId, countWords(text));
    },
    [editor, projectId, onWordCountChange]
  );

  useEffect(() => {
    if (!editor) return;
    const prev = sectionRef.current;
    if (prev !== activeSection) {
      const prevKey = getSectionKey(projectId, prev);
      localStorage.setItem(prevKey, editor.getHTML());
    }
    sectionRef.current = activeSection;
    loadSection(activeSection);
  }, [activeSection, editor, loadSection, projectId]);

  useEffect(() => {
    if (!editor) return;
    loadSection(activeSection);
  }, [editor]);

  const execBold = () => editor?.chain().focus().toggleBold().run();
  const execItalic = () => editor?.chain().focus().toggleItalic().run();
  const execCite = () => {
    const citation = `[${SAMPLE_CITATIONS[0].authors.split(",")[0].trim()} et al., ${SAMPLE_CITATIONS[0].year}]`;
    editor?.chain().focus().insertContent(citation).run();
  };

  const section = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  const wc = editor ? countWords(editor.getText()) : 0;
  const readTime = Math.max(1, Math.round(wc / 200));
  const citationMatches = editor ? (editor.getText().match(/\[[\w\s&.,]+,\s*\d{4}\]/g) || []).length : 0;

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0c1117]">
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-2 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-700 pr-4">
            <button
              onClick={execBold}
              className={`min-w-[28px] min-h-[28px] flex items-center justify-center p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 font-bold text-xs ${editor?.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}
              aria-label="Bold"
              aria-pressed={editor?.isActive("bold")}
            >
              B
            </button>
            <button
              onClick={execItalic}
              className={`min-w-[28px] min-h-[28px] flex items-center justify-center p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 italic text-xs ${editor?.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}
              aria-label="Italic"
              aria-pressed={editor?.isActive("italic")}
            >
              I
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={execCite}
              className="min-h-[28px] flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400"
              aria-label="Insert citation"
            >
              <Quote size={12} /> Cite
            </button>
            <button
              className="min-h-[28px] flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400"
              aria-label="Insert equation"
            >
              <span className="font-mono text-[10px]">∑</span> Equation
            </button>
            <button
              className="min-h-[28px] flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400"
              aria-label="Insert figure"
            >
              <BarChart3 size={12} /> Figure
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6" style={{ fontFamily: "'Georgia', serif" }}>
            {section.title}
          </h2>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-2 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>{wc.toLocaleString()} Words</span>
          <span>{citationMatches} Citations</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Reading: {readTime} min</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">APA 7th</span>
          <span>Section {SECTIONS.findIndex((s) => s.id === activeSection) + 1} of {SECTIONS.length}</span>
        </div>
      </div>
    </main>
  );
}

function AIResearchPanel({ showPanel, onToggle }) {
  const [aiTab, setAiTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isStreaming) return;
    const userMsg = { role: "user", content: aiInput };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/ai-cowriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiInput, context: "research paper writing assistant" }),
      });
      if (!res.ok) throw new Error("AI unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setAiMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              assistantText += data.text;
              setAiMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setAiMessages((prev) => [...prev, { role: "assistant", content: "AI unavailable. Please try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {!showPanel && (
        <button
          onClick={onToggle}
          className="absolute right-4 top-20 z-20 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-700"
          aria-label="Open AI research panel"
        >
          <PanelRightOpen size={14} />
        </button>
      )}
      <AnimatePresence>
        {showPanel && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-brand-surface border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 flex-1 mr-2">
                {["search", "cite", "ai"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md flex-1 transition-all ${
                      aiTab === tab
                        ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {tab === "search" ? "Search" : tab === "cite" ? "Cite" : "AI Help"}
                  </button>
                ))}
              </div>
              <button onClick={onToggle} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg" aria-label="Close panel">
                <PanelRightClose size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiTab === "search" && (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Semantic Scholar..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                      aria-label="Search academic papers"
                    />
                  </div>
                  <div className="space-y-2">
                    {SAMPLE_CITATIONS.map((paper) => (
                      <div key={paper.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white leading-relaxed mb-1">{paper.title}</h4>
                        <p className="text-[10px] text-zinc-500">{paper.authors} ({paper.year})</p>
                        <p className="text-[10px] text-zinc-400 italic">{paper.journal}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-zinc-400">Cited by {paper.cited}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50" aria-label="Add citation">
                              + Cite
                            </button>
                            <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded" aria-label="Open paper">
                              <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {aiTab === "cite" && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Your citations (3 added)</p>
                  {SAMPLE_CITATIONS.map((paper) => (
                    <div key={paper.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        {paper.authors} ({paper.year}). {paper.title}. <em>{paper.journal}</em>.
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">DOI: {paper.doi}</p>
                    </div>
                  ))}
                </div>
              )}

              {aiTab === "ai" && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">AI Research Assistant</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Ask me anything about your research paper — citations, methodology, literature review, or argument structure.
                    </p>
                  </div>
                  {aiMessages.length === 0 && (
                    <div className="space-y-2">
                      {["Expand literature review", "Improve methodology", "Check argument flow", "Suggest missing citations"].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setAiInput(suggestion)}
                          className="w-full text-left px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded-lg ${
                          msg.role === "user"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 ml-4"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mr-4"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {isStreaming && (
                      <div className="flex items-center gap-1 text-zinc-400 text-xs">
                        <Loader2 size={10} className="animate-spin" /> Thinking...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                  placeholder="Ask AI about your research..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                  aria-label="Ask AI research assistant"
                />
                <button
                  onClick={sendAiMessage}
                  disabled={isStreaming}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-md"
                  aria-label="Send message"
                >
                  <Send size={10} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ResearchPaperWriteView({ bookTitle, project, tabMode }) {
  const [activeSection, setActiveSection] = useState("intro");
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [wordCounts, setWordCounts] = useState({});

  const handleWordCountChange = useCallback((sectionId, count) => {
    setWordCounts((prev) => ({ ...prev, [sectionId]: count }));
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <SectionSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        wordCounts={wordCounts}
      />
      <ResearchEditor
        projectId={project?._id || project?.id}
        activeSection={activeSection}
        onWordCountChange={handleWordCountChange}
      />
      <AIResearchPanel showPanel={showAIPanel} onToggle={() => setShowAIPanel(!showAIPanel)} />
    </div>
  );
}
