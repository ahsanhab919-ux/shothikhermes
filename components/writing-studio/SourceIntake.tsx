'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FileText,
  Link2,
  Type,
  Youtube,
  X,
  Plus,
  Loader2,
  Upload,
  ArrowRight,
  ChevronRight,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { debugLog } from '@/lib/debug-log';
import { getPdfExtractionRoute } from '@/lib/document-parsing/client';

export interface ProjectSource {
  id: string;
  type: 'pdf' | 'url' | 'youtube' | 'text';
  title: string;
  text: string;
  preview: string;
}

interface SourceIntakeProps {
  onComplete: (sources: ProjectSource[]) => void;
  onSkip: () => void;
  initialSources?: ProjectSource[];
  embedded?: boolean;
}

type InputMode = 'file' | 'link' | 'text';

function generateId() {
  return `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text.slice(0, 6000));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

export function SourceIntake({ onComplete, onSkip, initialSources, embedded }: SourceIntakeProps) {
  const [mode, setMode] = useState<InputMode>('file');
  const [sources, setSources] = useState<ProjectSource[]>(initialSources || []);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const MAX_SOURCES = 5;

  // Focus trap + Escape key dismiss
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => Array.from(overlay.querySelectorAll<HTMLElement>(focusableSelectors));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    overlay.addEventListener('keydown', handleKeyDown);
    // Focus first element on mount
    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();

    return () => overlay.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  const addSource = (source: ProjectSource) => {
    if (sources.length >= MAX_SOURCES) return;
    setSources(prev => [...prev, source]);
    setError(null);
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    setIsLoading(true);
    setError(null);

    for (const file of arr) {
      if (sources.length >= MAX_SOURCES) break;
      const allowed = ['application/pdf', 'text/plain', 'text/markdown', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const ext = file.name.toLowerCase();
      const isPdf = ext.endsWith('.pdf');
      const isTxt = ext.endsWith('.txt') || ext.endsWith('.md');

      if (!allowed.includes(file.type) && !isPdf && !isTxt) {
        setError('Only PDF, TXT, and Markdown files are supported.');
        continue;
      }

      try {
        let text: string;
        let preview: string;
        let title: string = file.name;

        if (isPdf) {
          debugLog.info('SourceIntake', 'PDF extraction started', { fileName: file.name, fileSize: file.size });
          setLoadingLabel(`Extracting ${file.name}…`);
          const fd = new FormData();
          fd.append('file', file);
          const extractionRoute = getPdfExtractionRoute();
          const res = await fetch(extractionRoute, { method: 'POST', body: fd });
          if (res.ok) {
            const data = await res.json();
            text = data.text || `[PDF: ${file.name}]`;
            preview = data.preview || text.slice(0, 100);
            title = data.title || file.name;
            debugLog.info('SourceIntake', 'PDF extraction completed', {
              fileName: file.name,
              textLength: text.length,
              parser: data.parser || 'unknown',
              route: extractionRoute,
              imageBased: Boolean(data.imageBased),
            });
          } else {
            text = `[PDF Document: ${file.name}]\nThis PDF was uploaded as reference material.`;
            preview = `PDF · ${(file.size / 1024).toFixed(0)} KB`;
          }
        } else {
          setLoadingLabel(`Reading ${file.name}…`);
          text = await extractTextFromFile(file);
          preview = text.slice(0, 100);
        }

        addSource({
          id: generateId(),
          type: isPdf ? 'pdf' : 'text',
          title,
          text,
          preview,
        });
      } catch {
        setError(`Could not read ${file.name}`);
      }
    }
    setIsLoading(false);
    setLoadingLabel('');
  }, [sources.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleAddUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    if (sources.length >= MAX_SOURCES) return;

    setIsLoading(true);
    setLoadingLabel('Fetching content...');
    setError(null);
    let safeHost = 'unknown';
    try { safeHost = new URL(url).hostname; } catch {}
    debugLog.info('SourceIntake', 'URL fetch started', { host: safeHost });

    try {
      const res = await fetch('/api/extract-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      debugLog.info('SourceIntake', 'URL fetch completed', { host: safeHost, type: data.type, textLength: data.text?.length });
      addSource({
        id: generateId(),
        type: data.type,
        title: data.title || url,
        text: data.text,
        preview: data.preview || url.slice(0, 100),
      });
      setUrlInput('');
    } catch (err: any) {
      setError(err.message || 'Could not fetch URL');
    } finally {
      setIsLoading(false);
      setLoadingLabel('');
    }
  }, [urlInput, sources.length]);

  const handleAddText = useCallback(() => {
    const text = textInput.trim();
    if (!text || text.length < 20) {
      setError('Please paste at least 20 characters of text.');
      return;
    }
    debugLog.info('SourceIntake', 'Text note added', { textLength: text.length });
    addSource({
      id: generateId(),
      type: 'text',
      title: `Text note ${sources.length + 1}`,
      text: text.slice(0, 6000),
      preview: text.slice(0, 100),
    });
    setTextInput('');
  }, [textInput, sources.length]);

  const sourceIcon = (type: ProjectSource['type']) => {
    switch (type) {
      case 'pdf': return <File className="w-3.5 h-3.5 text-red-400" />;
      case 'youtube': return <Youtube className="w-3.5 h-3.5 text-red-400" />;
      case 'url': return <Link2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const modes: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'file', label: 'File', icon: <Upload className="w-3.5 h-3.5" /> },
    { id: 'link', label: 'Link', icon: <Link2 className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Add reference sources"
      className={embedded ? "h-full bg-background flex flex-col overflow-hidden" : "fixed inset-0 z-[200] bg-background flex flex-col overflow-hidden"}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-brand" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">Add Sources</span>
          {sources.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-brand/20 text-brand text-[10px] font-bold rounded-full">
              {sources.length}/{MAX_SOURCES}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Step 1 of 2</span>
          <div className="flex gap-1">
            <div className="w-8 h-1 rounded-full bg-brand" />
            <div className="w-8 h-1 rounded-full bg-border" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <h1 className="text-2xl font-bold text-foreground mb-1 text-center">
            Add reference material
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Upload PDFs, paste links, or add text — the AI will use them to build a richer outline.
          </p>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-muted rounded-xl p-1">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setError(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                  mode === m.id
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* File drop zone */}
          <AnimatePresence mode="wait">
            {mode === 'file' && (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                    isDragging
                      ? 'border-brand bg-brand/8'
                      : 'border-border hover:border-border hover:bg-muted'
                  )}
                >
                  <Upload className={cn('w-8 h-8 mx-auto mb-3 transition-colors', isDragging ? 'text-brand' : 'text-muted-foreground')} />
                  <p className="text-foreground text-sm font-medium">
                    {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">PDF, TXT, Markdown — up to 5 files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleFiles(e.target.files)}
                />
              </motion.div>
            )}

            {mode === 'link' && (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                    placeholder="https://... or youtube.com/watch?v=..."
                    autoFocus
                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-brand/50 transition-colors"
                  />
                  <button
                    onClick={handleAddUrl}
                    disabled={!urlInput.trim() || isLoading || sources.length >= MAX_SOURCES}
                    className="px-4 py-3 bg-brand hover:bg-brand/90 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </div>
                <p className="text-muted-foreground text-xs mt-2 px-1">
                  Supports any article URL or YouTube video link
                </p>
              </motion.div>
            )}

            {mode === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Paste notes, an outline, research excerpts, or any text you want the AI to reference..."
                  rows={5}
                  autoFocus
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-brand/50 transition-colors resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-muted-foreground text-xs">{textInput.length} chars</span>
                  <button
                    onClick={handleAddText}
                    disabled={textInput.trim().length < 20 || sources.length >= MAX_SOURCES}
                    className="px-4 py-1.5 bg-brand hover:bg-brand/90 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add note
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mt-3 px-1">
              <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
              <span className="text-muted-foreground text-xs">{loadingLabel || 'Processing...'}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Source list */}
          <AnimatePresence>
            {sources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-1.5 overflow-hidden"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-2">
                  Added sources
                </p>
                {sources.map(source => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-xl group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {sourceIcon(source.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-xs font-medium truncate">{source.title}</p>
                      <p className="text-muted-foreground text-[10px] truncate">{source.preview}</p>
                    </div>
                    <button
                      onClick={() => removeSource(source.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4 flex items-center justify-between">
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip — describe my idea instead
          <ChevronRight className="w-4 h-4" />
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onComplete(sources)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-brand/20"
        >
          {sources.length === 0 ? 'Continue without sources' : `Continue with ${sources.length} source${sources.length !== 1 ? 's' : ''}`}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
