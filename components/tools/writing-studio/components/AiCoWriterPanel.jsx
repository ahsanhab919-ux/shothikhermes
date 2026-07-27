"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Loader2,
  X,
  ArrowRight,
  PenLine,
  Expand,
  Pilcrow,
  MessageSquare,
  Copy,
  Check,
  StopCircle,
  Info,
} from "lucide-react";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const MODES = [
  {
    id: "autocomplete",
    label: "Continue",
    icon: ArrowRight,
    description: "Continue writing from cursor (1-2 sentences)",
  },
  {
    id: "paragraph",
    label: "Paragraph",
    icon: Pilcrow,
    description: "Write a complete paragraph",
  },
  {
    id: "expand",
    label: "Expand",
    icon: Expand,
    description: "Expand text into 2-4 paragraphs",
  },
  {
    id: "instruction",
    label: "Instruct",
    icon: MessageSquare,
    description: "Give specific writing instructions",
  },
];

export function AiCoWriterPanel({
  editor,
  isGenerating,
  streamedText,
  error,
  onGenerate,
  onAbort,
  onReset,
  onInsert,
  inlineEnabled,
  onToggleInline,
}) {
  const [mode, setMode] = useState("autocomplete");
  const [instruction, setInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = from !== to ? editor.state.doc.textBetween(from, to, " ") : "";
    const fullText = editor.getText();

    const textToProcess = selectedText || fullText;
    if (!textToProcess.trim()) return;

    const contextWindow = fullText.slice(0, 2000);

    onGenerate({
      currentText: textToProcess,
      context: contextWindow,
      mode,
      instruction: mode === "instruction" ? instruction : "",
    });
  }, [editor, mode, instruction, onGenerate]);

  const handleInsert = useCallback(() => {
    if (!streamedText || !editor) return;
    onInsert(streamedText);
    onReset();
  }, [streamedText, editor, onInsert, onReset]);

  const handleCopy = useCallback(async () => {
    if (!streamedText) return;
    try {
      await navigator.clipboard.writeText(streamedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [streamedText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Co-Writer</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          Gemini
        </Badge>
      </div>

      <div className="p-4 bg-muted/50 shadow-sm rounded-xl space-y-3">
        <span className="text-xs text-muted-foreground font-medium">Writing Mode</span>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
                onClick={() => setMode(m.id)}
                className={cn(
                  "p-2.5 rounded-xl text-left transition-all text-xs",
                  mode === m.id
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : "bg-muted/30 hover:bg-muted/60"
                )}
                aria-label={m.description}
                aria-pressed={mode === m.id}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">{m.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                  {m.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {mode === "instruction" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
          >
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Add a conclusion paragraph summarizing the key findings..."
              className="w-full p-3 text-sm bg-muted/50 shadow-sm rounded-xl border-0 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[80px]"
              aria-label="AI instruction input"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (mode === "instruction" && !instruction.trim())}
          className="flex-1 gap-2"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Writing...
            </>
          ) : (
            <>
              <PenLine className="h-3.5 w-3.5" />
              Generate
            </>
          )}
        </Button>
        {isGenerating && (
          <Button
            onClick={onAbort}
            variant="outline"
            size="sm"
            className="gap-1"
            aria-label="Stop generation"
          >
            <StopCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {(streamedText || isGenerating) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springTransition}
            className="p-4 bg-muted/50 shadow-sm rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                AI Output
              </span>
              {isGenerating && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Streaming...</span>
                </div>
              )}
            </div>

            <div
              className="text-sm leading-relaxed max-h-[200px] overflow-y-auto prose prose-sm dark:prose-invert"
              aria-live="polite"
              aria-label="AI generated text"
            >
              {streamedText || (
                <span className="text-muted-foreground italic">Generating...</span>
              )}
            </div>

            {streamedText && !isGenerating && (
              <div className="flex gap-2">
                <Button
                  onClick={handleInsert}
                  size="sm"
                  className="flex-1 gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Insert
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  aria-label="Copy result"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  onClick={onReset}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-red-500/10 rounded-xl text-xs text-red-700 dark:text-red-400"
          role="alert"
        >
          {error}
        </motion.div>
      )}

      <Separator />

      <div className="p-4 bg-muted/50 shadow-sm rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Inline Autocomplete</span>
          </div>
          <button
            onClick={() => {
              onToggleInline?.(!inlineEnabled);
              if (editor) {
                editor.commands.clearSuggestion?.();
              }
            }}
            className={cn(
              "relative w-8 h-4.5 rounded-full transition-colors",
              inlineEnabled ? "bg-primary" : "bg-muted-foreground/30"
            )}
            role="switch"
            aria-checked={inlineEnabled}
            aria-label="Toggle inline autocomplete"
          >
            <span
              className={cn(
                "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm",
                inlineEnabled ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
          Pause typing for suggestions. Press Tab to accept, Esc to dismiss.
        </p>
      </div>
    </motion.div>
  );
}

export default AiCoWriterPanel;
