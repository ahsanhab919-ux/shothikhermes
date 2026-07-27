'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

import { ModeSwitcherHeader } from '@/components/writing-studio/navigation/ModeSwitcherHeader';
import { PolishedWriteView } from '@/components/writing-studio/PolishedWriteView';
import { PublishingPage } from '@/components/writing-studio/PublishingPage';
import { AccessibilityReportPanel, validateContentAccessibility } from '@/components/writing-studio/validation';
import type { AccessibilityReport } from '@/components/writing-studio/validation';
import { FeatureGate } from '@/components/subscription/FeatureGate';

type Mode = 'write' | 'format' | 'publish';

interface IntegratedWritingStudioProps {
  projectId: Id<'projects'>;
  userId?: string;
}

export function IntegratedWritingStudio({ projectId }: IntegratedWritingStudioProps) {
  const [currentMode, setCurrentMode] = useState<Mode>('write');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch project data
  const project = useQuery(api.projects.get, { id: projectId });
  
  // Mutations
  const saveVersion = useMutation(api.projects.saveVersion);

  // Save handler
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    if (!project) return;

    setIsSaving(true);
    try {
      await saveVersion({
        projectId,
        content: project.content ?? "",
        sections: (project as any).sections,
        label: "manual-save",
      });
      setLastSaved(new Date());
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  }, [project, projectId, isSaving, saveVersion]);

  if (!project) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-brand-canvas">
      <ModeSwitcherHeader
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        projectName={project.title}
        onSave={handleSave}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />

      <div className="flex-1 overflow-hidden">
        {currentMode === 'write' && (
          <PolishedWriteView
            bookTitle={project.title}
            project={project}
          />
        )}

        {currentMode === 'format' && (
          <FormatView
            project={project}
            content={project.content ?? ''}
            onPublish={() => setCurrentMode('publish')}
          />
        )}

        {currentMode === 'publish' && (
          <FeatureGate feature="publishingDistribution" fallbackAction={() => setCurrentMode('write')}>
            <PublishingPage
              project={project}
              onBackToEditor={() => setCurrentMode('write')}
            />
          </FeatureGate>
        )}
      </div>
    </div>
  );
}

// Format View Component
function FormatView({ 
  project, 
  content, 
  onPublish 
}: { 
  project: any; 
  content: string;
  onPublish: () => void;
}) {
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAccessibility = async () => {
    setIsValidating(true);
    try {
      const report = validateContentAccessibility(content, {
        title: project.title,
        language: project.language,
      });
      setAccessibilityReport(report);
    } catch (error) {
      console.error('Accessibility validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left: Format Settings */}
      <div className="w-[380px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-surface overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-lg font-bold mb-2">Format Settings</h1>
            <p className="text-sm text-zinc-500">Configure for digital or print distribution.</p>
          </div>

          {/* Typography */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-brand uppercase tracking-wider">Typography</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 rounded-xl border-2 border-brand bg-brand/5 text-brand">
                <div className="text-2xl font-serif">Aa</div>
                <div className="text-xs font-medium mt-1">Serif</div>
              </button>
              <button className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="text-2xl font-sans">Aa</div>
                <div className="text-xs font-medium mt-1">Sans</div>
              </button>
            </div>
          </section>

          {/* Accessibility Check */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Accessibility</h3>
            
            <button
              onClick={validateAccessibility}
              disabled={isValidating}
              className="w-full p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {isValidating ? 'Validating...' : 'Validate ePub 3.3 + WCAG 2.2'}
            </button>

            {accessibilityReport && (
              <div className="mt-4">
                <AccessibilityReportPanel 
                  report={accessibilityReport}
                  onRevalidate={validateAccessibility}
                />
              </div>
            )}
          </section>

          {/* Export */}
          <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={onPublish}
              className="w-full bg-brand text-white py-3 rounded-lg font-bold shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all"
            >
              🚀 Continue to Publish
            </button>
          </div>
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex-1 bg-zinc-100 dark:bg-brand-canvas/50 flex items-center justify-center p-8">
        <div className="flex gap-4">
          <div className="w-[420px] aspect-[2/3] bg-white p-12 shadow-2xl font-serif">
            <div className="text-center text-zinc-400 text-xs uppercase tracking-widest mb-16">
              {project.title}
            </div>
            <div className="text-[15px] leading-[1.6] text-justify">
              {content.substring(0, 500)}...
            </div>
          </div>
        </div>
      </div>

      {/* Right: Format Assistant */}
      <div className="w-[320px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-surface">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Format Assistant</span>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-bold text-blue-600 mb-1">💡 Recommendation</div>
              <p className="text-xs text-zinc-600">For Sci-Fi, try 1.3 line height with Caslon font.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
