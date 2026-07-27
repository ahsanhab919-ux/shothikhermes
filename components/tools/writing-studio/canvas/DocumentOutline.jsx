"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Plus,
  FileText,
  CheckCircle2,
  Pencil,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWritingStudio } from "../providers/WritingStudioProvider";

function extractSections(editor) {
  if (!editor) return [];
  const doc = editor.getJSON();
  if (!doc?.content) return [];

  const sections = [];
  let currentSection = null;
  let wordCount = 0;

  for (const node of doc.content) {
    if (node.type === "heading" && node.attrs?.level <= 2) {
      if (currentSection) {
        currentSection.words = wordCount;
        sections.push(currentSection);
      }
      const text = node.content?.map((c) => c.text || "").join("") || "Untitled Section";
      currentSection = {
        id: `section-${sections.length}`,
        title: text,
        level: node.attrs.level,
        words: 0,
        status: "in-progress",
      };
      wordCount = 0;
    } else if (node.type === "paragraph" && node.content) {
      const text = node.content.map((c) => c.text || "").join("");
      wordCount += text.split(/\s+/).filter(Boolean).length;
    }
  }

  if (currentSection) {
    currentSection.words = wordCount;
    sections.push(currentSection);
  }

  return sections;
}

export function DocumentOutline() {
  const { editor, wordCount } = useWritingStudio();
  const [expanded, setExpanded] = useState({});
  const [dailyGoal] = useState(1000);

  const sections = useMemo(() => extractSections(editor), [editor, wordCount]);

  const dailyProgress = Math.min((wordCount / dailyGoal) * 100, 100);

  const scrollToSection = (sectionTitle) => {
    if (!editor) return;

    const editorEl = document.getElementById("writing-studio-editor");
    if (editorEl) {
      const headings = editorEl.querySelectorAll("h1, h2, h3");
      for (const h of headings) {
        if (h.textContent === sectionTitle) {
          h.scrollIntoView({ behavior: "smooth", block: "center" });
          break;
        }
      }
    }

    let found = false;
    editor.state.doc.descendants((node, pos) => {
      if (found) return false;
      if (node.type.name === "heading") {
        const text = node.textContent || "";
        if (text === sectionTitle) {
          editor.chain().focus().setTextSelection(pos + 1).run();
          found = true;
          return false;
        }
      }
    });
  };

  return (
    <aside className="w-60 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/80 dark:bg-[#0d1520]/50 shrink-0">
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Outline
        </h3>
        <button
          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Add section"
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertContent({
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "New Section" }],
              }).run();
            }
          }}
        >
          <Plus className="h-3.5 w-3.5 text-zinc-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 scrollbar-hide">
        {sections.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Add headings to your document to see the outline here
            </p>
          </div>
        ) : (
          sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.title)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all group",
                "hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80",
                section.level === 1 ? "font-semibold" : "ml-3"
              )}
            >
              <GripVertical className="h-3 w-3 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab" />
              <span className={cn(
                "truncate flex-1",
                section.level === 1 ? "text-xs text-zinc-800 dark:text-zinc-200" : "text-[11px] text-zinc-600 dark:text-zinc-400"
              )}>
                {section.title}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                {section.words}w
              </span>
            </button>
          ))
        )}
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-brand/5 dark:bg-brand/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-wide flex items-center gap-1">
              <Target className="h-3 w-3" />
              Writing Goal
            </span>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
              {wordCount} / {dailyGoal.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="bg-brand h-full rounded-full transition-all duration-500"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
