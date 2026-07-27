"use client";

import { getWordCount, stripHtml } from "@/lib/writing-utils";
import { debugLog } from "@/lib/debug-log";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  Send,
  Sparkles,
  GripVertical,
  PanelRightClose,
  PanelRightOpen,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
  Quote,
  CalendarClock,
  Loader2,
} from "lucide-react";

const SECTIONS = [
  { id: "intro", title: "Introduction" },
  { id: "body-1", title: "Body Section 1" },
  { id: "body-2", title: "Body Section 2" },
  { id: "conclusion", title: "Conclusion" },
  { id: "references", title: "References" },
];

const RUBRIC_CRITERIA = [
  { id: 1, criterion: "Thesis Statement", maxScore: 10 },
  { id: 2, criterion: "Evidence & Support", maxScore: 20 },
  { id: 3, criterion: "Critical Analysis", maxScore: 20 },
  { id: 4, criterion: "Structure & Organization", maxScore: 15 },
  { id: 5, criterion: "Grammar & Style", maxScore: 15 },
  { id: 6, criterion: "Citation Format (APA)", maxScore: 10 },
  { id: 7, criterion: "Word Count", maxScore: 10 },
];

const WORD_TARGET = 3000;

function getSectionKey(projectId, sectionId) {
  return `assignment-draft-${projectId || "default"}-${sectionId}`;
}


function SectionSidebar({ activeSection, onSectionChange, totalWords }) {
  const completedSections = SECTIONS.filter((s) => s.id === activeSection).length;
  const wordProgress = Math.min(100, Math.round((totalWords / WORD_TARGET) * 100));

  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sections</h3>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-type-assignment rounded-full transition-all duration-300" style={{ width: `${wordProgress}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{totalWords.toLocaleString()} of {WORD_TARGET.toLocaleString()} words</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" role="list" aria-label="Assignment sections">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              role="listitem"
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                isActive
                  ? "bg-type-assignment-subtle border border-border"
                  : "hover:bg-muted/50 border border-transparent"
              }`}
              aria-label={`Go to ${section.title}`}
              aria-current={isActive ? "page" : undefined}
            >
              <GripVertical size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
              <FileText size={14} className={isActive ? "text-type-assignment" : "text-muted-foreground"} style={isActive ? { color: 'var(--color-type-assignment)' } : undefined} />
              <span className={`text-xs font-medium flex-1 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {section.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-border space-y-3">
        <div className="bg-destructive/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock size={12} className="text-destructive" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Deadline</span>
          </div>
          <p className="text-sm font-bold text-destructive">Not set</p>
          <p className="text-[10px] text-destructive/70 mt-0.5">No deadline configured</p>
        </div>

        <div className="bg-type-assignment-subtle rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} style={{ color: 'var(--color-type-assignment)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-type-assignment)' }}>Word Target</span>
          </div>
          <p className="text-xs font-medium text-foreground">{totalWords.toLocaleString()} / {WORD_TARGET.toLocaleString()} words</p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-type-assignment rounded-full transition-all duration-300"
              style={{ width: `${wordProgress}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function AssignmentEditor({ projectId, activeSection, onTotalWordsChange }) {
  const sectionRef = useRef(activeSection);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: () => {
          const section = SECTIONS.find((s) => s.id === sectionRef.current);
          return `Start writing your ${section?.title || "section"} here...`;
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Assignment editor",
        "aria-multiline": "true",
        class: "prose dark:prose-invert max-w-none focus:outline-none min-h-[400px]",
        style: "font-family: 'Georgia', serif; font-size: 16px; line-height: 1.8;",
      },
    },
    onUpdate: ({ editor }) => {
      const key = getSectionKey(projectId, sectionRef.current);
      try {
        localStorage.setItem(key, editor.getHTML());
      } catch {}
      recalcTotalWords(editor);
    },
  });

  const recalcTotalWords = useCallback(
    (ed) => {
      if (!ed) return;
      let total = 0;
      for (const section of SECTIONS) {
        const key = getSectionKey(projectId, section.id);
        try {
          const saved = localStorage.getItem(key) || "";
          total += getWordCount(saved);
        } catch {
        }
      }
      onTotalWordsChange(total);
    },
    [projectId, onTotalWordsChange]
  );

  const loadSection = useCallback(
    (sectionId) => {
      if (!editor) return;
      const key = getSectionKey(projectId, sectionId);
      let saved = "";
      try {
        saved = localStorage.getItem(key) || "";
      } catch {}
      editor.commands.setContent(saved, false);
    },
    [editor, projectId]
  );

  useEffect(() => {
    if (!editor) return;
    const prev = sectionRef.current;
    if (prev !== activeSection) {
      const prevKey = getSectionKey(projectId, prev);
      try {
        localStorage.setItem(prevKey, editor.getHTML());
      } catch {}
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
    editor?.chain().focus().insertContent("(Author, Year, p. X)").run();
  };
  const execFootnote = () => {
    if (!editor) return;
    const footnoteNumber = (editor.getText().match(/\[\^\d+\]/g) || []).length + 1;
    editor.chain().focus().insertContent(`[^${footnoteNumber}]`).run();
  };

  const section = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  const currentWc = editor ? getWordCount(editor.getText()) : 0;
  const wordProgress = Math.min(100, Math.round((currentWc / (WORD_TARGET / SECTIONS.length)) * 100));

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-6 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-border pr-4">
            <button
              onClick={execBold}
              className={`min-w-[28px] min-h-[28px] flex items-center justify-center p-1 hover:bg-muted rounded text-muted-foreground font-bold text-xs ${editor?.isActive("bold") ? "bg-muted" : ""}`}
              aria-label="Bold"
              aria-pressed={editor?.isActive("bold")}
            >
              B
            </button>
            <button
              onClick={execItalic}
              className={`min-w-[28px] min-h-[28px] flex items-center justify-center p-1 hover:bg-muted rounded text-muted-foreground italic text-xs ${editor?.isActive("italic") ? "bg-muted" : ""}`}
              aria-label="Italic"
              aria-pressed={editor?.isActive("italic")}
            >
              I
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={execCite}
              className="min-h-[28px] flex items-center gap-1.5 px-2 py-1 hover:bg-muted rounded text-xs text-muted-foreground"
              aria-label="Insert citation"
            >
              <Quote size={12} /> Cite
            </button>
            <button
              onClick={execFootnote}
              className="min-h-[28px] flex items-center gap-1.5 px-2 py-1 hover:bg-muted rounded text-xs text-muted-foreground"
              aria-label="Insert footnote"
            >
              <BookOpen size={12} /> Footnote
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "'Georgia', serif" }}>
            {section.title}
          </h2>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="border-t border-border px-6 py-2 flex items-center justify-between bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{currentWc.toLocaleString()} Words (this section)</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Reading: {Math.max(1, Math.round(currentWc / 200))} min</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-type-assignment-subtle text-[10px] font-medium" style={{ color: 'var(--color-type-assignment)' }}>APA 7th</span>
          <span>{wordProgress}% of section target</span>
        </div>
      </div>
    </main>
  );
}

function AIAssignmentPanel({ showPanel, onToggle }) {
  const [aiTab, setAiTab] = useState("rubric");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [rubricResults, setRubricResults] = useState(null);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [integrityResults, setIntegrityResults] = useState(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  const runRubricAnalysis = useCallback(async () => {
    if (!editor) return;
    debugLog.info('Assignment', 'Rubric analysis started');
    setRubricLoading(true);
    try {
      const text = editor.getText();
      if (!text || text.trim().length < 30) {
        setRubricResults(RUBRIC_CRITERIA.map(c => ({ ...c, score: 0, feedback: "Not enough content to analyze." })));
        return;
      }
      const res = await fetch("/api/ai-cowriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: `Analyze this academic assignment text against these rubric criteria and return ONLY a JSON array. Each element must have: id (number), criterion (string), maxScore (number), score (number 0 to maxScore), feedback (string, 1 sentence).

Criteria: ${JSON.stringify(RUBRIC_CRITERIA)}

Text to analyze:
${text.slice(0, 3000)}`,
          mode: "instruction",
          currentText: text.slice(0, 500),
        }),
      });
      if (!res.ok) throw new Error("AI unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) full += data.content;
          } catch {}
        }
      }
      const match = full.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        debugLog.info('Assignment', 'Rubric analysis completed', { criteriaCount: parsed.length, totalScore: parsed.reduce((s, r) => s + r.score, 0) });
        setRubricResults(parsed.map(r => ({
          ...r,
          maxScore: RUBRIC_CRITERIA.find(c => c.id === r.id)?.maxScore || r.maxScore,
          criterion: RUBRIC_CRITERIA.find(c => c.id === r.id)?.criterion || r.criterion,
        })));
      } else {
        setRubricResults(RUBRIC_CRITERIA.map(c => ({ ...c, score: 0, feedback: "Could not parse analysis results." })));
      }
    } catch {
      setRubricResults(RUBRIC_CRITERIA.map(c => ({ ...c, score: 0, feedback: "Analysis failed. Please try again." })));
    } finally {
      setRubricLoading(false);
    }
  }, [editor]);

  const runIntegrityCheck = useCallback(async () => {
    if (!editor) return;
    debugLog.info('Assignment', 'Integrity check started');
    setIntegrityLoading(true);
    const text = editor.getText();
    const results = [];
    try {
      const [grammarRes, aiDetectorRes] = await Promise.allSettled([
        fetch("/api/tools/grammar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 2000) }),
        }).then(r => r.json()),
        fetch("/api/tools/ai-detector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 2000) }),
        }).then(r => r.json()),
      ]);
      if (grammarRes.status === "fulfilled" && grammarRes.value) {
        results.push({ label: "Grammar Score", score: grammarRes.value.score ? `${grammarRes.value.score}/100` : "Analyzed", status: "pass", icon: FileText });
      } else {
        results.push({ label: "Grammar Score", score: "Service unavailable", status: "error", icon: FileText });
      }
      if (aiDetectorRes.status === "fulfilled" && aiDetectorRes.value) {
        const humanPct = aiDetectorRes.value.humanScore || aiDetectorRes.value.human_probability;
        results.push({ label: "AI Detection", score: humanPct ? `${Math.round(humanPct)}% human` : "Analyzed", status: humanPct > 70 ? "pass" : "warn", icon: ClipboardCheck });
      } else {
        results.push({ label: "AI Detection", score: "Service unavailable", status: "error", icon: ClipboardCheck });
      }
      results.push({ label: "Plagiarism Check", score: "Use dedicated checker", status: "warn", icon: ShieldCheck });
    } catch {
      results.push({ label: "Integrity Check", score: "Services unavailable", status: "error", icon: ShieldCheck });
    }
    debugLog.info('Assignment', 'Integrity check completed', { checksCount: results.length });
    setIntegrityResults(results);
    setIntegrityLoading(false);
  }, [editor]);

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isStreaming) return;
    debugLog.info('Assignment', 'AI chat message sent', { messageLength: aiInput.trim().length });
    const userMsg = { role: "user", content: aiInput };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/ai-cowriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: aiInput, mode: "instruction", currentText: editor?.getText()?.slice(-500) || "" }),
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
            if (data.content) {
              assistantText += data.content;
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
          className="absolute right-4 top-20 z-20 p-2 bg-card border border-border rounded-lg shadow-md hover:bg-muted/50"
          aria-label="Open assignment tools panel"
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
            className="bg-card border-l border-border flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 flex-1 mr-2">
                {["rubric", "integrity", "ai"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md flex-1 transition-all ${
                      aiTab === tab
                        ? "bg-card shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={aiTab === tab ? { color: 'var(--color-type-assignment)' } : undefined}
                  >
                    {tab === "rubric" ? "Rubric" : tab === "integrity" ? "Integrity" : "AI Help"}
                  </button>
                ))}
              </div>
              <button onClick={onToggle} className="p-1.5 hover:bg-muted rounded-lg" aria-label="Close panel">
                <PanelRightClose size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiTab === "rubric" && (
                <>
                  {rubricLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-type-assignment)' }} />
                      <p className="text-xs text-muted-foreground mt-2">Analyzing against rubric...</p>
                    </div>
                  ) : rubricResults ? (
                    <>
                      <div className="text-center p-4 bg-type-assignment-subtle rounded-xl border border-border">
                        <div className="text-3xl font-bold" style={{ color: 'var(--color-type-assignment)' }}>
                          {rubricResults.reduce((s, r) => s + r.score, 0)}/{RUBRIC_CRITERIA.reduce((s, r) => s + r.maxScore, 0)}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--color-type-assignment)' }}>
                          Estimated Rubric Score ({Math.round((rubricResults.reduce((s, r) => s + r.score, 0) / RUBRIC_CRITERIA.reduce((s, r) => s + r.maxScore, 0)) * 100)}%)
                        </div>
                      </div>
                      <div className="space-y-2">
                        {rubricResults.map((item) => {
                          const pct = (item.score / item.maxScore) * 100;
                          return (
                            <div key={item.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-foreground">{item.criterion}</span>
                                <span
                                  className={`text-xs font-bold ${pct < 60 ? "text-destructive" : ""}`}
                                  style={pct >= 80 ? { color: 'var(--color-type-research)' } : pct >= 60 ? { color: 'var(--color-type-assignment)' } : undefined}
                                >
                                  {item.score}/{item.maxScore}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">{item.feedback}</p>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => runRubricAnalysis()}
                        className="w-full py-2 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        Re-run Analysis
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Target size={24} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mb-3">Analyze your assignment against grading criteria</p>
                      <button
                        onClick={() => runRubricAnalysis()}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-type-assignment text-white hover:opacity-90 transition-colors"
                      >
                        Run Rubric Analysis
                      </button>
                    </div>
                  )}
                </>
              )}

              {aiTab === "integrity" && (
                <div className="space-y-3">
                  {integrityLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-type-research)' }} />
                      <p className="text-xs text-muted-foreground mt-2">Running integrity checks...</p>
                    </div>
                  ) : integrityResults ? (
                    <>
                      {integrityResults.map((check) => {
                        const Icon = check.icon;
                        return (
                          <div key={check.label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${check.status === "pass" ? "bg-type-research-subtle" : check.status === "error" ? "bg-destructive/10" : "bg-type-assignment-subtle"}`}>
                              <Icon size={14} style={{ color: check.status === "pass" ? 'var(--color-type-research)' : check.status === "error" ? 'var(--destructive)' : 'var(--color-type-assignment)' }} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-foreground">{check.label}</p>
                              <p className="text-[10px] text-muted-foreground">{check.score}</p>
                            </div>
                            {check.status === "pass" ? (
                              <CheckCircle2 size={14} style={{ color: 'var(--color-type-research)' }} />
                            ) : (
                              <AlertTriangle size={14} style={{ color: 'var(--color-type-assignment)' }} />
                            )}
                          </div>
                        );
                      })}
                      <button
                        onClick={() => runIntegrityCheck()}
                        className="w-full py-2 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      >
                        Re-run Check
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <ShieldCheck size={24} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mb-3">Check plagiarism and AI detection scores</p>
                      <button
                        onClick={() => runIntegrityCheck()}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-type-assignment text-white hover:opacity-90 transition-colors"
                      >
                        Run Integrity Check
                      </button>
                    </div>
                  )}
                </div>
              )}

              {aiTab === "ai" && (
                <div className="space-y-3">
                  <div className="p-3 bg-type-assignment-subtle rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} style={{ color: 'var(--color-type-assignment)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-type-assignment)' }}>Assignment Assistant</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ask me to strengthen your arguments, improve your thesis, suggest sources, or check rubric alignment.
                    </p>
                  </div>
                  {aiMessages.length === 0 && (
                    <div className="space-y-2">
                      {["Strengthen my thesis", "Find supporting evidence", "Improve transitions", "Check rubric alignment", "Fix citations"].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setAiInput(suggestion)}
                          className="w-full text-left px-3 py-2.5 text-xs text-foreground bg-muted/50 rounded-lg border border-border hover:border-type-assignment transition-colors"
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
                            ? "bg-type-assignment-subtle ml-4"
                            : "bg-muted text-foreground mr-4"
                        }`}
                        style={msg.role === "user" ? { color: 'var(--color-type-assignment)' } : undefined}
                      >
                        {msg.content}
                      </div>
                    ))}
                    {isStreaming && (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Loader2 size={10} className="animate-spin" /> Thinking...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border">
              <div className="relative">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                  placeholder="Ask AI about your assignment..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-muted/50 border border-border rounded-lg outline-none focus:border-type-assignment text-foreground"
                  aria-label="Ask assignment AI assistant"
                />
                <button
                  onClick={sendAiMessage}
                  disabled={isStreaming}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-type-assignment hover:opacity-90 disabled:opacity-50 text-white rounded-md"
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

export default function AssignmentWriteView({ bookTitle, project, tabMode }) {
  const [activeSection, setActiveSection] = useState("intro");
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [totalWords, setTotalWords] = useState(0);

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <SectionSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        totalWords={totalWords}
      />
      <AssignmentEditor
        projectId={project?._id || project?.id}
        activeSection={activeSection}
        onTotalWordsChange={setTotalWords}
      />
      <AIAssignmentPanel showPanel={showAIPanel} onToggle={() => setShowAIPanel(!showAIPanel)} />
    </div>
  );
}
