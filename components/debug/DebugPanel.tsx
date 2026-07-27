'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { debugLog, type DebugLogEntry, type LogLevel } from '@/lib/debug-log';
import { Bug, X, Trash2, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

const LEVEL_STYLES: Record<LogLevel, { bg: string; text: string; label: string }> = {
  info:  { bg: 'bg-muted',           text: 'text-muted-foreground', label: 'INFO' },
  warn:  { bg: 'bg-type-assignment-subtle', text: 'text-type-assignment',  label: 'WARN' },
  error: { bg: 'bg-destructive/10',  text: 'text-destructive',      label: 'ERR' },
  api:   { bg: 'bg-brand/10',        text: 'text-brand',            label: 'API' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
}

function LogEntry({ entry }: { entry: DebugLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = LEVEL_STYLES[entry.level];
  const hasMeta = entry.meta && Object.keys(entry.meta).length > 0;

  return (
    <div className="px-2 py-1 hover:bg-muted/30 border-b border-border/50 text-[11px] leading-relaxed font-mono">
      <div className="flex items-start gap-1.5">
        <span className="text-muted-foreground shrink-0 tabular-nums">{formatTime(entry.timestamp)}</span>
        <span className={`shrink-0 px-1 rounded text-[9px] font-bold ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        <span className="text-muted-foreground shrink-0">[{entry.source}]</span>
        <span className="text-foreground break-all flex-1">{entry.message}</span>
        {hasMeta && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-0.5 hover:bg-muted rounded"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        )}
      </div>
      {expanded && hasMeta && (
        <pre className="mt-1 ml-16 text-[10px] text-muted-foreground bg-muted/50 rounded p-1.5 overflow-x-auto">
          {JSON.stringify(entry.meta, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DebugLogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    setEntries(debugLog.getAll());
    const unsub = debugLog.subscribe(() => {
      setEntries(debugLog.getAll());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 40;
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(debugLog.export());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = debugLog.export();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleClear = useCallback(() => {
    debugLog.clear();
    setEntries([]);
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.level === filter);

  const counts = {
    all: entries.length,
    info: entries.filter(e => e.level === 'info').length,
    warn: entries.filter(e => e.level === 'warn').length,
    error: entries.filter(e => e.level === 'error').length,
    api: entries.filter(e => e.level === 'api').length,
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 z-[9999] w-10 h-10 rounded-full bg-background border-2 border-brand/30 shadow-lg flex items-center justify-center hover:bg-brand/10 hover:border-brand/50 transition-colors"
        aria-label="Open debug log"
      >
        <Bug size={16} className="text-brand" />
        {counts.error > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
            {counts.error > 9 ? '9+' : counts.error}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 z-[9999] w-[480px] max-w-[calc(100vw-2rem)] h-[400px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-brand" />
          <span className="text-xs font-semibold text-foreground">Debug Log</span>
          <span className="text-[10px] text-muted-foreground">({entries.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label="Copy all logs"
            title="Copy all logs"
          >
            {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} className="text-muted-foreground" />}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label="Clear logs"
            title="Clear logs"
          >
            <Trash2 size={12} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close debug panel"
          >
            <X size={12} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/10">
        {(['all', 'error', 'warn', 'api', 'info'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              filter === level
                ? 'bg-brand/10 text-brand'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {level.toUpperCase()} ({counts[level]})
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No log entries yet
          </div>
        ) : (
          filtered.map(entry => <LogEntry key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
