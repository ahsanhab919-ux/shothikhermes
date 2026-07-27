"use client";

import { EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CheckCircle2,
  Bot,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { useWritingStudio } from "../providers/WritingStudioProvider";

export function WritingCanvas() {
  const {
    editor,
    isProcessing,
    handleProcess,
    setContextPanelView,
    setContextPanelOpen,
  } = useWritingStudio();

  if (!editor) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-12 px-8 min-h-full">
        <BubbleMenu editor={editor}>
          <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-1 backdrop-blur-sm">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
              onClick={() => handleProcess("paraphrase")}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Paraphrase
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
              onClick={() => handleProcess("grammar")}
              disabled={isProcessing}
            >
              <CheckCircle2 className="h-3 w-3" />
              Fix
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
              onClick={() => handleProcess("humanize")}
              disabled={isProcessing}
            >
              <Bot className="h-3 w-3" />
              Humanize
            </Button>
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
              onClick={() => {
                setContextPanelView("citations");
                setContextPanelOpen(true);
              }}
            >
              <GraduationCap className="h-3 w-3" />
              Cite
            </Button>
          </div>
        </BubbleMenu>

        <EditorContent
          editor={editor}
          className="writing-canvas-editor"
          id="writing-studio-editor"
        />
      </div>
    </div>
  );
}
