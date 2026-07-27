"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FileDown,
  FileText,
  Upload,
  HelpCircle,
  PanelRightOpen,
  PanelRightClose,
  BookOpen,
  Cloud,
  CloudOff,
  FilePlus2,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWritingStudio } from "../providers/WritingStudioProvider";

export function NotebookHeader() {
  const {
    documentTitle,
    setDocumentTitle,
    wordCount,
    isPro,
    contextPanelOpen,
    setContextPanelOpen,
    setShowExportPanel,
    setShowDocumentImport,
    setShowOnboarding,
    setShowTemplatePicker,
    documentFormat,
    savedReferences,
    handleExport,
  } = useWritingStudio();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef(null);
  const [targetWords] = useState(3000);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const progress = Math.min((wordCount / targetWords) * 100, 100);
  const charCount = wordCount * 5;
  const readingTime = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-brand-surface/50 backdrop-blur-md z-30 relative shrink-0">
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <BookOpen className="h-5 w-5 text-brand shrink-0" />
        <div className="flex flex-col min-w-0">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
              }}
              className="bg-transparent border-none focus:ring-0 font-semibold text-sm w-48 p-0 outline-none"
              aria-label="Document title"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="font-semibold text-sm truncate text-left hover:text-brand transition-colors max-w-[200px]"
              title="Click to rename"
            >
              {documentTitle}
            </button>
          )}
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Cloud className="h-3 w-3 text-green-500" />
            Auto-saved
            {documentFormat && documentFormat !== "generic" && (
              <span className="ml-1 px-1 py-0 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-bold uppercase">
                {documentFormat}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center w-1/3 px-8">
        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="bg-brand h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] mt-1 uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-medium">
          {wordCount.toLocaleString()} / {targetWords.toLocaleString()} words
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 w-1/3">
        <button
          onClick={() => setShowTemplatePicker(true)}
          className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
          title="New document"
        >
          <FilePlus2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">New</span>
        </button>

        <button
          onClick={() => setShowDocumentImport(true)}
          className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5"
          title="Import"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Import</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5">
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowExportPanel(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              Professional PDF (LaTeX)
              <Badge variant="outline" className="ml-auto text-[10px]">New</Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("docx")}>
              <FileText className="h-4 w-4 mr-2" />
              Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("html")}>
              <FileText className="h-4 w-4 mr-2" />
              HTML (.html)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("txt")}>
              <FileText className="h-4 w-4 mr-2" />
              Plain Text (.txt)
            </DropdownMenuItem>
            {savedReferences.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[10px] text-muted-foreground" disabled>
                  {savedReferences.length} reference{savedReferences.length > 1 ? "s" : ""} included
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setShowOnboarding(true)}
          className="p-1.5 text-zinc-500 hover:text-brand transition-colors rounded-lg"
          title="Tour"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <button
          onClick={() => setContextPanelOpen(!contextPanelOpen)}
          className="p-1.5 text-zinc-500 hover:text-brand transition-colors rounded-lg"
          aria-label={contextPanelOpen ? "Close panel" : "Open panel"}
        >
          {contextPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
