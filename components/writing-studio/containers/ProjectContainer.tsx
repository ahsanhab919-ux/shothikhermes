'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ModeSwitcherHeader } from '../navigation/ModeSwitcherHeader';
import { PolishedWriteView } from '../PolishedWriteView';
import { PublishingPage } from '../PublishingPage';
import { FormattingView } from '@/components/tools/writing-studio/workspace/FormattingView';

type Mode = 'write' | 'format' | 'publish';

interface ProjectContainerProps {
  projectId?: string;
  initialMode?: Mode;
}

const RESEARCH_SECTIONS = ['abstract', 'intro', 'lit-review', 'methodology', 'results', 'discussion', 'conclusion', 'references'];
const ASSIGNMENT_SECTIONS = ['intro', 'body-1', 'body-2', 'conclusion', 'references'];
const AUTOSAVE_DEBOUNCE_MS = 1500;
const AUTOSAVE_INTERVAL_MS = 30_000;

function collectLocalStorageSections(projectId: string): Record<string, string> {
  const sections: Record<string, string> = {};
  for (const prefix of ['research-draft', 'assignment-draft']) {
    const allSections = prefix === 'research-draft' ? RESEARCH_SECTIONS : ASSIGNMENT_SECTIONS;
    for (const sectionId of allSections) {
      const key = `${prefix}-${projectId}-${sectionId}`;
      const value = localStorage.getItem(key);
      if (value) sections[key] = value;
    }
  }
  return sections;
}

function countWordsInSections(sections: Record<string, string>): number {
  let total = 0;
  for (const html of Object.values(sections)) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || '';
    total += text.trim().split(/\s+/).filter(Boolean).length;
  }
  return total;
}

export function ProjectContainer({
  projectId,
  initialMode = 'write',
}: ProjectContainerProps) {
  const { user } = useSelector((state: any) => state.auth);
  const clerkUserId = user?._id || user?.id || '';

  const [currentMode, setCurrentMode] = useState<Mode>(initialMode);
  const [projectName, setProjectName] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [migrationDone, setMigrationDone] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const isValidConvexId = projectId && /^[a-zA-Z0-9_]+$/.test(projectId) && projectId.length > 10;

  const convexProject = useQuery(
    api.projects.get,
    isValidConvexId ? { id: projectId as Id<'projects'> } : 'skip'
  );

  const savedSections = useQuery(
    api.writing.getSections,
    projectId ? { localProjectId: projectId } : 'skip'
  );

  const updateProject = useMutation(api.projects.update);
  const saveSectionsMutation = useMutation(api.writing.saveSections);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (convexProject && convexProject.title) {
      setProjectName(convexProject.title);
    } else if (!convexProject && projectId) {
      const savedName = localStorage.getItem(`project-name-${projectId}`);
      if (savedName) setProjectName(savedName);
    }
  }, [convexProject, projectId]);

  const handleSaveToConvex = useCallback(async () => {
    if (!projectId || isSaving || !isMounted.current) return;

    setIsSaving(true);
    try {
      const sections = collectLocalStorageSections(projectId);
      const wordCount = countWordsInSections(sections);

      const promises: Promise<any>[] = [
        saveSectionsMutation({
          localProjectId: projectId,
          sections,
        }),
      ];

      if (isValidConvexId) {
        const flatContent = Object.values(sections).join('\n');
        promises.push(
          updateProject({
            id: projectId as Id<'projects'>,
            content: flatContent,
            wordCount,
          })
        );
      }

      await Promise.all(promises);
      if (isMounted.current) setLastSaved(new Date());
    } catch (err) {
      console.error('[ProjectContainer] Save failed:', err);
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [projectId, isSaving, isValidConvexId, saveSectionsMutation, updateProject]);

  const handleSave = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSaveToConvex();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [handleSaveToConvex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaving) handleSaveToConvex();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [handleSaveToConvex, isSaving]);

  useEffect(() => {
    if (!projectId || !clerkUserId || migrationDone) return;
    const migrationKey = `convex-migrated-${projectId}`;
    if (localStorage.getItem(migrationKey)) {
      setMigrationDone(true);
      return;
    }
    if (savedSections === null) {
      (async () => {
        try {
          const sections = collectLocalStorageSections(projectId);
          if (Object.keys(sections).length === 0) {
            localStorage.setItem(migrationKey, '1');
            setMigrationDone(true);
            return;
          }
          await saveSectionsMutation({
            localProjectId: projectId,
            sections,
          });
          localStorage.setItem(migrationKey, '1');
          if (isMounted.current) setMigrationDone(true);
        } catch (err) {
          console.error('[ProjectContainer] Migration failed:', err);
          if (isMounted.current) setMigrationDone(true);
        }
      })();
    } else {
      setMigrationDone(true);
    }
  }, [projectId, clerkUserId, savedSections, migrationDone, saveSectionsMutation]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) setHistoryIndex((prev) => prev - 1);
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) setHistoryIndex((prev) => prev + 1);
  }, [history, historyIndex]);

  const handleModeChange = useCallback(
    (mode: Mode) => {
      handleSaveToConvex();
      setCurrentMode(mode);
    },
    [handleSaveToConvex]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setProjectName(newTitle);
      if (projectId) localStorage.setItem(`project-name-${projectId}`, newTitle);
    },
    [projectId]
  );

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-brand-canvas">
      <ModeSwitcherHeader
        currentMode={currentMode}
        onModeChange={handleModeChange}
        projectName={projectName}
        onSave={handleSaveToConvex}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />

      <div className="flex-1 overflow-hidden">
        {currentMode === 'write' && (
          <PolishedWriteView
            bookTitle={projectName}
            project={convexProject ?? ({ _id: projectId, title: projectName, content: '', type: 'book' } as any)}
          />
        )}

        {currentMode === 'format' && (
          <FormattingView
            project={convexProject || { _id: projectId, id: projectId, title: projectName }}
          />
        )}

        {currentMode === 'publish' && (
          <PublishingPage
            project={{ id: projectId, name: projectName }}
            onBackToEditor={() => setCurrentMode('write')}
          />
        )}
      </div>
    </div>
  );
}
