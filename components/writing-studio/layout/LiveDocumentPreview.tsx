'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface LiveDocumentPreviewProps {
  content: string;
  title?: string;
  projectType?: 'book' | 'research' | 'assignment';
  className?: string;
}

function stripHtmlForDisplay(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function LiveDocumentPreview({
  content,
  title = 'Untitled',
  projectType = 'book',
  className,
}: LiveDocumentPreviewProps) {
  const [displayedContent, setDisplayedContent] = useState(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayedContent(content);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content]);

  const isEmpty =
    !displayedContent ||
    displayedContent.replace(/<[^>]*>/g, '').trim().length === 0;

  return (
    <div
      className={cn(
        'flex flex-col h-full overflow-hidden border-l border-zinc-200 dark:border-zinc-800',
        className
      )}
      aria-label="Live document preview"
    >
      <div className="h-8 shrink-0 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Preview
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-100 dark:bg-zinc-900/40 flex justify-center py-8 px-4">
        {isEmpty ? (
          <div className="flex items-center justify-center w-full text-zinc-400 text-sm italic">
            Start writing to see a live preview
          </div>
        ) : (
          <PreviewPage
            html={displayedContent}
            title={title}
            projectType={projectType}
          />
        )}
      </div>
    </div>
  );
}

function PreviewPage({
  html,
  title,
  projectType,
}: {
  html: string;
  title: string;
  projectType: 'book' | 'research' | 'assignment';
}) {
  if (projectType === 'book') {
    return (
      <div className="w-[420px] min-h-[594px] bg-white shadow-2xl shadow-black/20 px-14 py-16 font-serif">
        <div className="text-center text-zinc-400 text-[9px] uppercase tracking-[0.25em] mb-12 font-sans">
          {title}
        </div>
        <div
          className="text-[14px] leading-[1.85] text-justify text-zinc-700 space-y-5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-center [&_h1]:mb-6 [&_h1]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </div>
    );
  }

  if (projectType === 'research') {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return (
      <div className="w-[420px] min-h-[594px] bg-white shadow-2xl shadow-black/20 px-12 py-12 font-sans">
        <div className="text-center mb-10 border-b border-zinc-200 pb-8">
          <p className="text-xl font-bold text-zinc-800 leading-snug mb-3">{title}</p>
          <p className="text-xs text-zinc-400 uppercase tracking-widest">{today}</p>
        </div>
        <div
          className="text-[13px] leading-[2] text-zinc-700 space-y-4 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2 [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      </div>
    );
  }

  return (
    <div className="w-[420px] min-h-[594px] bg-white shadow-2xl shadow-black/20 px-12 py-12 font-sans">
      <div className="mb-8 border-b border-zinc-200 pb-6">
        <p className="text-lg font-semibold text-zinc-800 mb-1">{title}</p>
        <p className="text-xs text-zinc-400">
          {new Date().toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
      <div
        className="text-[13px] leading-[1.9] text-zinc-700 space-y-4 [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-2 [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_strong]:font-semibold [&_em]:italic"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </div>
  );
}
