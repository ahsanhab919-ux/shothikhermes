'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ConvexAutosaveResult {
  isSaving: boolean;
  lastCloudSave: Date | null;
  cloudError: string | null;
  cloudContent: string | null;
  cloudWordCount: number;
}

export function useConvexAutosave(
  localProjectId: string | undefined,
  content: string,
  wordCount: number,
  clerkUserId?: string
): ConvexAutosaveResult {
  const [isSaving, setIsSaving] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<Date | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>('');

  const autosaveMutation = useMutation(api.writing.autosave);

  const savedData = useQuery(
    api.writing.getAutosave,
    localProjectId ? { localProjectId } : 'skip'
  );

  const save = useCallback(async (id: string, text: string, wc: number) => {
    if (text === lastSavedContent.current) return;
    setIsSaving(true);
    setCloudError(null);
    try {
      await autosaveMutation({
        localProjectId: id,
        content: text,
        wordCount: wc,
      });
      lastSavedContent.current = text;
      setLastCloudSave(new Date());
    } catch (err: any) {
      setCloudError(err?.message || 'Cloud sync failed');
    } finally {
      setIsSaving(false);
    }
  }, [autosaveMutation]);

  useEffect(() => {
    if (!localProjectId || !content) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      save(localProjectId, content, wordCount);
    }, 4000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content, localProjectId, wordCount, save]);

  return {
    isSaving,
    lastCloudSave,
    cloudError,
    cloudContent: savedData?.content ?? null,
    cloudWordCount: savedData?.wordCount ?? 0,
  };
}
