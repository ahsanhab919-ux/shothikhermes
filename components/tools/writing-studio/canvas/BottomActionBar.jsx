"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  CheckCircle2,
  Bot,
  Brain,
  FileSearch,
  FlaskConical,
  GraduationCap,
  FileDown,
  Sparkles,
  Loader2,
  ChevronUp,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWritingStudio } from "../providers/WritingStudioProvider";
import { PARAPHRASE_MODES } from "../constants";

const springTransition = { type: "spring", stiffness: 400, damping: 30 };

const BOTTOM_TOOLS = [
  { id: "paraphrase", label: "Paraphrase", icon: RefreshCw, hasDropdown: true, panel: "actions", color: "text-blue-500" },
  { id: "grammar", label: "Fix", icon: CheckCircle2, panel: "actions", color: "text-green-500" },
  { id: "humanize", label: "Humanize", icon: Bot, panel: "actions", color: "text-purple-500" },
  { id: "cowriter", label: "AI Write", icon: Brain, panel: "cowriter", color: "text-amber-500" },
  { id: "divider" },
  { id: "plagiarism", label: "Plagiarism", icon: FileSearch, panel: "review", color: "text-red-500" },
  { id: "ai-check", label: "AI Check", icon: FlaskConical, panel: "review", color: "text-teal-500" },
  { id: "cite", label: "Cite", icon: GraduationCap, panel: "citations", color: "text-indigo-500" },
  { id: "divider2" },
  { id: "checklist", label: "Pre-Submit", icon: ClipboardCheck, panel: "review", color: "text-orange-500" },
  { id: "export", label: "Export", icon: FileDown, panel: null, color: "text-zinc-500" },
];

export function BottomActionBar() {
  const {
    selectedTool,
    isProcessing,
    selectedText,
    contextPanelView,
    setContextPanelView,
    setContextPanelOpen,
    handleProcess,
    handleScanForAI,
    handleCheckPlagiarism,
    setShowExportPanel,
    setSelectedMode,
    handleToolSelect,
    wordCount,
  } = useWritingStudio();

  const handleToolClick = (tool) => {
    if (tool.id === "export") {
      setShowExportPanel(true);
      return;
    }

    if (tool.id === "plagiarism") {
      handleCheckPlagiarism();
      setContextPanelView("review");
      setContextPanelOpen(true);
      return;
    }

    if (tool.id === "ai-check") {
      handleScanForAI();
      setContextPanelView("review");
      setContextPanelOpen(true);
      return;
    }

    if (tool.id === "checklist") {
      setContextPanelView("review");
      setContextPanelOpen(true);
      return;
    }

    if (tool.panel === "cowriter") {
      setContextPanelView("cowriter");
      setContextPanelOpen(true);
      return;
    }

    if (tool.id === "cite") {
      setContextPanelView("citations");
      setContextPanelOpen(true);
      return;
    }

    if (tool.id === "paraphrase" || tool.id === "grammar" || tool.id === "humanize") {
      if (selectedText) {
        handleProcess(tool.id);
      } else {
        handleToolSelect(tool.id);
      }
      setContextPanelView("actions");
      setContextPanelOpen(true);
      return;
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springTransition}
      className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-xl border-t"
    >
      <div className="flex items-center justify-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-hide">
        {BOTTOM_TOOLS.map((tool) => {
          if (tool.id === "divider" || tool.id === "divider2") {
            return (
              <div key={tool.id} className="w-px h-6 bg-border mx-1 shrink-0" />
            );
          }

          const isActive = (tool.id === selectedTool && tool.panel === "actions") ||
            (tool.panel && tool.panel === contextPanelView && tool.id !== "export");
          const Icon = tool.icon;

          if (tool.hasDropdown) {
            return (
              <div key={tool.id} className="flex items-center shrink-0">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleToolClick(tool)}
                        disabled={isProcessing}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {isProcessing && selectedTool === tool.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Icon className={cn("h-3.5 w-3.5", isActive && tool.color)} />
                        )}
                        <span className="hidden sm:inline">{tool.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {selectedText ? `${tool.label} selected text` : tool.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="min-w-[140px]">
                    {PARAPHRASE_MODES.map((mode) => (
                      <DropdownMenuItem
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode.id);
                          if (selectedText) {
                            handleProcess("paraphrase");
                          } else {
                            handleToolSelect("paraphrase");
                          }
                        }}
                      >
                        <span className="text-xs">{mode.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{mode.description}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          return (
            <TooltipProvider key={tool.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleToolClick(tool)}
                    disabled={isProcessing && (tool.id === "plagiarism" || tool.id === "ai-check")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive && tool.color)} />
                    <span className="hidden sm:inline">{tool.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {tool.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {selectedText && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-primary/5 px-4 py-1 flex items-center justify-center gap-2 overflow-hidden"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              {selectedText.split(/\s+/).length} words selected — click a tool to apply
            </span>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
