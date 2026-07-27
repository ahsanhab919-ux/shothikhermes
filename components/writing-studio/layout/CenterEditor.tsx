'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Quote,
  History,
  Undo,
  Redo,
  Search,
  Loader2,
  X,
  SplitSquareHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useCitationSuggestions, type CitationResult } from '@/hooks/useCitationSuggestions';
import type { CitationStyle } from '@/lib/reference-list';
import { useGhostText } from '@/hooks/useGhostText';

interface CenterEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  chapterTitle?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRollbackClick?: () => void;
  citationStyle?: CitationStyle;
  onAppendContent?: (html: string) => void;
  onTogglePreview?: () => void;
  showPreview?: boolean;
}

export function CenterEditor({
  content = '',
  onChange,
  chapterTitle = 'Untitled',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRollbackClick,
  citationStyle = 'APA',
  onAppendContent,
  onTogglePreview,
  showPreview = false,
}: CenterEditorProps) {
  const [showCitationPanel, setShowCitationPanel] = useState(false);
  const [citationQuery, setCitationQuery] = useState('');
  const citationInputRef = useRef<HTMLInputElement>(null);
  const footnoteCountRef = useRef(0);

  const { suggestion, isLoading: ghostLoading, accept: acceptGhost, dismiss: dismissGhost } = useGhostText(content);

  const { suggestions, isSearching, searchPapers, clearSuggestions } = useCitationSuggestions();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        class: 'outline-none',
        role: 'textbox',
        'aria-label': 'Document editor',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (currentHtml !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);

  const buildCitationText = (result: CitationResult): string => {
    const firstAuthor = result.authors[0];
    const familyName = firstAuthor?.family || 'Unknown';
    const hasMultiple = result.authors.length > 1;
    const year = result.year || 'n.d.';

    switch (citationStyle) {
      case 'APA':
      case 'Harvard':
        return hasMultiple
          ? `(${familyName} et al., ${year})`
          : `(${familyName}, ${year})`;
      case 'MLA':
        return `(${familyName})`;
      case 'Chicago': {
        footnoteCountRef.current += 1;
        const num = footnoteCountRef.current;
        const doi = (result as any).doi ? ` doi:${(result as any).doi}.` : '';
        const footnoteText = `${familyName}, "${result.title}" (${year}).${doi}`;
        if (onAppendContent) {
          onAppendContent(`<p><sup>${num}</sup> ${footnoteText}</p>`);
        }
        return `<sup>${num}</sup>`;
      }
      default:
        return `(${familyName}, ${year})`;
    }
  };

  const handleCitationSearch = (q: string) => {
    setCitationQuery(q);
    if (q.length >= 3) searchPapers(q);
  };

  const handleInsertCitation = (result: CitationResult) => {
    if (!editor) return;
    const citationText = buildCitationText(result);
    editor
      .chain()
      .focus()
      .insertContent(` <cite title="${result.title}">${citationText}</cite> `)
      .run();
    setShowCitationPanel(false);
    setCitationQuery('');
    clearSuggestions();
  };

  const openCitationPanel = () => {
    setShowCitationPanel(true);
    setTimeout(() => citationInputRef.current?.focus(), 100);
  };

  return (
    <section
      className="flex-1 flex flex-col bg-white dark:bg-zinc-900/40 relative overflow-hidden"
      onKeyDown={e => {
        if (e.key === 'Tab' && suggestion) { e.preventDefault(); acceptGhost(editor); }
        if (e.key === 'Escape' && suggestion) { e.preventDefault(); dismissGhost(); }
      }}
    >
      {/* Toolbar */}
      <div className="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-brand-surface/80 backdrop-blur-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

          <div className="relative">
            <button
              onClick={openCitationPanel}
              className={cn(
                'p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 text-[11px] font-medium transition-colors',
                showCitationPanel && 'bg-brand/10 text-brand'
              )}
            >
              <Quote className="w-4 h-4" />
              Cite
              <span className="text-[9px] font-bold uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1 rounded">
                {citationStyle}
              </span>
            </button>

            <AnimatePresence>
              {showCitationPanel && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                      setShowCitationPanel(false);
                      clearSuggestions();
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-[360px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-40 overflow-hidden"
                  >
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700 focus-within:border-brand transition-colors">
                        <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                          ref={citationInputRef}
                          type="text"
                          value={citationQuery}
                          onChange={e => handleCitationSearch(e.target.value)}
                          placeholder="Search papers, authors, DOI..."
                          className="flex-1 text-xs bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                        />
                        {isSearching && <Loader2 className="w-3.5 h-3.5 text-brand animate-spin shrink-0" />}
                        {citationQuery && !isSearching && (
                          <button
                            onClick={() => { setCitationQuery(''); clearSuggestions(); }}
                            className="text-zinc-400 hover:text-zinc-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[280px] overflow-y-auto">
                      {citationQuery.length < 3 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          Type at least 3 characters to search Semantic Scholar
                        </div>
                      ) : isSearching ? (
                        <div className="p-4 text-center text-xs text-zinc-400">Searching...</div>
                      ) : suggestions.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          No results found. Try different keywords.
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {suggestions.slice(0, 8).map((result, idx) => (
                            <button
                              key={result.paperId || idx}
                              onClick={() => handleInsertCitation(result)}
                              className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                            >
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 group-hover:text-brand transition-colors">
                                {result.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-zinc-400">
                                  {result.authors.slice(0, 2).map(a => a.family).join(', ')}
                                  {result.authors.length > 2 ? ' et al.' : ''}
                                </span>
                                {result.year && <span className="text-[10px] text-zinc-400">{result.year}</span>}
                                {result.citationCount !== undefined && (
                                  <span className="text-[10px] text-zinc-400">{result.citationCount} citations</span>
                                )}
                                {result.isOpenAccess && (
                                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">OA</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <p className="text-[10px] text-zinc-400 text-center">
                        Powered by Semantic Scholar · Inserting as {citationStyle}
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRollbackClick}
            className="px-2 py-1 text-[10px] font-bold flex items-center gap-1.5 bg-brand/10 text-brand hover:bg-brand/20 rounded-md transition-all border border-brand/20"
          >
            <History className="w-3.5 h-3.5" />
            ROLLBACK
          </button>

          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {onTogglePreview && (
            <>
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
              <ToolbarButton
                onClick={onTogglePreview}
                isActive={showPreview}
                title={showPreview ? 'Hide preview' : 'Live preview'}
              >
                <SplitSquareHorizontal className="w-4 h-4" />
              </ToolbarButton>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto py-16 px-8 min-h-full">
          <h1 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">
            {chapterTitle}
          </h1>

          <div className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-6">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Ghost text loading dot */}
      {ghostLoading && !suggestion && (
        <span className="absolute bottom-4 right-6 w-2 h-2 rounded-full bg-brand animate-pulse z-10" />
      )}

      {/* Ghost text suggestion pill */}
      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-brand-dark border border-zinc-700 rounded-full px-4 py-2 shadow-2xl max-w-[90%]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse" />
            <span className="font-mono text-xs text-zinc-400 italic truncate max-w-[280px]">
              {suggestion.slice(0, 70)}{suggestion.length > 70 ? '…' : ''}
            </span>
            <button
              onClick={() => acceptGhost(editor)}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-900/20 px-2 py-0.5 rounded shrink-0 transition-colors"
            >
              Tab ↵
            </button>
            <button
              onClick={dismissGhost}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 shrink-0 transition-colors"
            >
              Esc
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ToolbarButton({
  children,
  onClick,
  isActive,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        'min-w-[44px] min-h-[44px] flex items-center justify-center rounded transition-colors',
        isActive
          ? 'bg-white dark:bg-zinc-700 text-brand shadow-sm'
          : disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
      )}
    >
      {children}
    </button>
  );
}
