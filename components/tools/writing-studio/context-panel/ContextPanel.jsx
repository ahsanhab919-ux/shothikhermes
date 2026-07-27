"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Wand2,
  Brain,
  GraduationCap,
  FileSearch,
  Loader2,
  Sparkles,
  FlaskConical,
  X,
  GripVertical,
  Search,
  TrendingUp,
  Send,
  Bot,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCitation } from "@/lib/citation-lookup";
import { useWritingStudio } from "../providers/WritingStudioProvider";
import { AI_TOOLS, PARAPHRASE_MODES } from "../constants";
import {
  DiffPreview,
  WritingTemplates,
  WritingAnalysisPanel,
  CitationFormatHelper,
  CitationLookup,
  ReferenceListPanel,
  PlagiarismCheckPanel,
  AIScorePanel,
  CitationSuggestionPanel,
  AiCoWriterPanel,
  ResearchSearchPanel,
} from "../components";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const PANEL_TABS = [
  { id: "write", label: "Write" },
  { id: "research", label: "Research" },
  { id: "improve", label: "Improve" },
];

export function ContextPanel() {
  const ctx = useWritingStudio();
  const {
    editor,
    contextPanelOpen,
    setContextPanelOpen,
    contextPanelView,
    setContextPanelView,
    selectedTool,
    handleToolSelect,
    selectedMode,
    setSelectedMode,
    isProcessing,
    handleProcess,
    showDiff,
    processedResult,
    originalText,
    handleAcceptChanges,
    handleRejectChanges,
    selectedText,
    wordCount,
    textAnalysis,
    aiScore,
    isScanning,
    handleScanForAI,
    isCheckingPlagiarism,
    plagiarismResult,
    plagiarismError,
    handleCheckPlagiarism,
    savedReferences,
    setSavedReferences,
    citationFormat,
    setCitationFormat,
    citationSuggestions,
    isCitationSearching,
    searchPapers,
    getSimilarPapers,
    suggestFromText,
    handleSaveReference,
    handleInsertInlineCitation,
    aiIsGenerating,
    aiStreamedText,
    aiError,
    aiGenerate,
    aiAbort,
    aiReset,
    handleAiInsert,
    inlineEnabled,
    setInlineEnabled,
    checkLimit,
    trackUsage,
    isPro,
    checkFeatureAccess,
    setUpgradeLimitType,
    setShowUpgradeModal,
  } = ctx;

  const [panelWidth, setPanelWidth] = useState(320);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (moveE) => {
      const diff = startX - moveE.clientX;
      const newWidth = Math.min(Math.max(startWidth + diff, 280), 500);
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [panelWidth]);

  const mappedView = contextPanelView === "actions" ? "write"
    : contextPanelView === "cowriter" ? "write"
    : contextPanelView === "citations" ? "research"
    : contextPanelView === "review" ? "improve"
    : contextPanelView;

  const activeTab = PANEL_TABS.find(t => t.id === mappedView) ? mappedView : "write";

  const handleTabChange = (tabId) => {
    if (tabId === "write") setContextPanelView("actions");
    else if (tabId === "research") setContextPanelView("citations");
    else if (tabId === "improve") setContextPanelView("review");
    else setContextPanelView(tabId);
  };

  if (!contextPanelOpen) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: panelWidth, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={springTransition}
      className="border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1520]/50 flex flex-col shrink-0 relative"
      style={{ width: panelWidth }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand/20 transition-colors z-10"
      />

      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex-1 py-3 text-[11px] font-bold uppercase tracking-tight transition-all",
              activeTab === tab.id
                ? "text-brand border-b-2 border-brand"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4">
            <AnimatePresence mode="wait">
              {activeTab === "write" && (
                <motion.div
                  key="write"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <AiCoWriterPanel
                    editor={editor}
                    isGenerating={aiIsGenerating}
                    streamedText={aiStreamedText}
                    error={aiError}
                    onGenerate={aiGenerate}
                    onAbort={aiAbort}
                    onReset={aiReset}
                    onInsert={handleAiInsert}
                    inlineEnabled={inlineEnabled}
                    onToggleInline={setInlineEnabled}
                  />

                  <Separator className="my-3" />

                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {selectedText ? "Apply to selection" : "Apply to document"}
                  </p>

                  {AI_TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className={cn(
                        "w-full p-2.5 rounded-lg border text-left transition-all",
                        selectedTool === tool.id
                          ? "border-brand bg-brand/5 ring-1 ring-brand"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-brand/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn("p-1.5 rounded-lg", tool.bgColor)}>
                          <tool.icon className={cn("h-3.5 w-3.5", tool.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-xs">{tool.name}</h3>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{tool.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {selectedTool === "paraphrase" && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-[10px] font-medium mb-2 text-zinc-500">Mode</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PARAPHRASE_MODES.map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={cn(
                              "p-2 rounded-lg border text-[11px] transition-all text-center",
                              selectedMode === mode.id
                                ? "border-brand bg-brand/10 text-brand font-medium"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-brand/50"
                            )}
                          >
                            {mode.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTool && (
                    <Button
                      onClick={() => handleProcess()}
                      disabled={isProcessing}
                      className="w-full bg-brand hover:bg-brand/90"
                      size="lg"
                    >
                      {isProcessing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" />Enhance Text</>
                      )}
                    </Button>
                  )}

                  {showDiff && processedResult && (
                    <DiffPreview
                      original={originalText}
                      modified={processedResult}
                      onAccept={handleAcceptChanges}
                      onReject={handleRejectChanges}
                    />
                  )}

                  <Separator className="my-3" />
                  <WritingTemplates
                    onApply={(content) => {
                      if (editor) editor.commands.setContent(content);
                    }}
                  />
                </motion.div>
              )}

              {activeTab === "research" && (
                <motion.div
                  key="research"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <CitationSuggestionPanel
                    suggestions={citationSuggestions}
                    isSearching={isCitationSearching}
                    onSearch={searchPapers}
                    onSuggestFromText={suggestFromText}
                    onGetSimilar={getSimilarPapers}
                    onSave={handleSaveReference}
                    onInsertInline={handleInsertInlineCitation}
                    citationFormat={citationFormat}
                    onFormatChange={setCitationFormat}
                    editorText={editor?.getText() || ""}
                    savedReferences={savedReferences}
                    checkLimit={checkLimit}
                    trackUsage={trackUsage}
                    onLimitReached={(type) => {
                      setUpgradeLimitType(type);
                      setShowUpgradeModal(true);
                    }}
                  />
                  <Separator className="my-4" />
                  <ResearchSearchPanel
                    onSearch={searchPapers}
                    suggestions={citationSuggestions}
                    isSearching={isCitationSearching}
                    onSave={handleSaveReference}
                    onInsertSummary={(summary) => {
                      if (editor) {
                        editor.chain().focus().insertContent({
                          type: "paragraph",
                          content: [{ type: "text", text: summary }],
                        }).run();
                      }
                    }}
                    editorText={editor?.getText() || ""}
                    onSuggestFromText={suggestFromText}
                  />
                  <Separator className="my-4" />
                  <ReferenceListPanel
                    references={savedReferences}
                    onRemove={(index) => {
                      setSavedReferences((prev) => prev.filter((_, i) => i !== index));
                    }}
                    onInsert={(formattedCitation) => {
                      if (editor) {
                        editor.chain().focus().insertContent({
                          type: "paragraph",
                          content: [{ type: "text", text: formattedCitation }],
                        }).run();
                      }
                    }}
                    citationFormat={citationFormat}
                    onCopyAll={async () => {
                      if (savedReferences.length === 0) return;
                      const formatted = savedReferences.map((ref) => formatCitation(ref, citationFormat)).join("\n\n");
                      try { await navigator.clipboard.writeText(formatted); } catch {}
                    }}
                  />
                  <Separator className="my-4" />
                  <CitationLookup
                    onSave={handleSaveReference}
                    onInsert={(formattedCitation) => {
                      if (editor) {
                        editor.chain().focus().insertContent({
                          type: "paragraph",
                          content: [{ type: "text", text: formattedCitation }],
                        }).run();
                      }
                    }}
                    citationFormat={citationFormat}
                    onFormatChange={setCitationFormat}
                    checkLimit={checkLimit}
                    trackUsage={trackUsage}
                    onLimitReached={(type) => {
                      setUpgradeLimitType(type);
                      setShowUpgradeModal(true);
                    }}
                  />
                  <Separator className="my-4" />
                  <CitationFormatHelper />
                </motion.div>
              )}

              {activeTab === "improve" && (
                <motion.div
                  key="improve"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <WritingAnalysisPanel analysis={textAnalysis} />
                  <Separator />
                  <AIScorePanel aiScore={aiScore} isScanning={isScanning} />
                  <Button
                    onClick={handleScanForAI}
                    disabled={isScanning || wordCount < 50}
                    variant="outline"
                    className="w-full"
                  >
                    {isScanning ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
                    ) : (
                      <><FlaskConical className="h-4 w-4 mr-2" />Scan for AI Content</>
                    )}
                  </Button>
                  {wordCount < 50 && (
                    <p className="text-[10px] text-zinc-400 text-center">50+ words needed for AI detection</p>
                  )}
                  <Separator />
                  <PlagiarismCheckPanel
                    result={plagiarismResult}
                    isChecking={isCheckingPlagiarism}
                    error={plagiarismError}
                    onRetry={handleCheckPlagiarism}
                  />
                  <Button
                    onClick={handleCheckPlagiarism}
                    disabled={isCheckingPlagiarism || wordCount < 50}
                    variant="outline"
                    className="w-full"
                  >
                    {isCheckingPlagiarism ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking...</>
                    ) : (
                      <><FileSearch className="h-4 w-4 mr-2" />Check Plagiarism</>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-surface/50">
          <div className="relative">
            <textarea
              className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs p-3 pr-10 focus:ring-1 focus:ring-brand min-h-[60px] resize-none placeholder:text-zinc-400"
              placeholder="Ask AI to write, research, or improve..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const val = e.target.value.trim();
                  if (val && !aiIsGenerating) {
                    aiGenerate(val, "instruct");
                    e.target.value = "";
                  }
                }
              }}
            />
            <button
              className="absolute bottom-2 right-2 p-1.5 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
              onClick={() => {
                const textarea = document.querySelector(".context-panel-ai-input");
                if (textarea?.value?.trim()) {
                  aiGenerate(textarea.value.trim(), "instruct");
                  textarea.value = "";
                }
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-brand" />
              Gemini Active
            </span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
