'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Navigation,
  Layout,
  Tag,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccessibilityReport, AccessibilityIssue } from '@/lib/validation/EpubAccessibilityValidator';

interface AccessibilityReportPanelProps {
  report: AccessibilityReport;
  onRevalidate?: () => void;
  className?: string;
}

export function AccessibilityReportPanel({ 
  report, 
  onRevalidate,
  className 
}: AccessibilityReportPanelProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredIssues = report.issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.type === filter.slice(0, -1); // 'errors' -> 'error'
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold",
              report.passed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              {report.score}
            </div>
            <div>
              <h3 className="font-bold text-lg">Accessibility Report</h3>
              <p className="text-sm text-zinc-500">
                ePub 3.3 + WCAG 2.2 {report.wcagLevel}
              </p>
            </div>
          </div>

          {onRevalidate && (
            <button
              onClick={onRevalidate}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Revalidate"
            >
              <RefreshCw className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Score Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-zinc-500">Accessibility Score</span>
            <span className={cn("font-bold", getScoreColor(report.score))}>
              {report.score}/100
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", getScoreBg(report.score))}
              style={{ width: `${report.score}%` }}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard 
            count={report.summary.errors} 
            label="Errors" 
            color="red"
            icon={XCircle}
          />
          <StatCard 
            count={report.summary.warnings} 
            label="Warnings" 
            color="amber"
            icon={AlertTriangle}
          />
          <StatCard 
            count={report.summary.info} 
            label="Suggestions" 
            color="blue"
            icon={Info}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(['all', 'errors', 'warnings', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              filter === f
                ? "text-brand border-b-2 border-brand"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-2 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {f === 'all' ? report.issues.length : report.summary[f.slice(0, -1) as keyof typeof report.summary]}
            </span>
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
            <p className="font-medium">No issues found!</p>
            <p className="text-sm">Your ePub meets all checked accessibility criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredIssues.map((issue) => (
              <IssueItem 
                key={issue.id}
                issue={issue}
                expanded={expandedIssues.has(issue.id)}
                onToggle={() => toggleIssue(issue.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between text-sm">
          <div className="text-zinc-500">
            {report.metadata.title && (
              <span>Book: {report.metadata.title}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!report.metadata.hasAccessibilityMetadata && (
              <span className="text-amber-500 text-xs">⚠️ Missing accessibility metadata</span>
            )}
            <a 
              href="https://www.w3.org/publishing/epub3/epub-accessibility.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline flex items-center gap-1"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  count, 
  label, 
  color, 
  icon: Icon 
}: { 
  count: number; 
  label: string; 
  color: 'red' | 'amber' | 'blue';
  icon: any;
}) {
  const colors = {
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

// Issue Item Component
function IssueItem({ 
  issue, 
  expanded, 
  onToggle 
}: { 
  issue: AccessibilityIssue;
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeColors = {
    error: 'bg-red-100 text-red-600 border-red-200',
    warning: 'bg-amber-100 text-amber-600 border-amber-200',
    info: 'bg-blue-100 text-blue-600 border-blue-200',
  };

  const typeIcons = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const categoryIcons = {
    metadata: FileText,
    structure: Layout,
    content: FileText,
    images: ImageIcon,
    navigation: Navigation,
    semantics: Tag,
  };

  const Icon = typeIcons[issue.type];
  const CategoryIcon = categoryIcons[issue.category] || FileText;

  return (
    <div className={cn(
      "p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
      expanded && "bg-zinc-50 dark:bg-zinc-800/50"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-left"
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          typeColors[issue.type]
        )}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-bold uppercase px-2 py-0.5 rounded",
              typeColors[issue.type]
            )}>
              {issue.type}
            </span>
            <span className="text-xs text-zinc-400">{issue.criterion}</span>
          </div>

          <h4 className="font-medium text-sm mb-1">{issue.message}</h4>

          {issue.location?.file && (
            <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
              <CategoryIcon className="w-3 h-3" />
              {issue.location.file}
              {issue.location.line && <span>:{issue.location.line}</span>}
            </div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {issue.details && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    {issue.details}
                  </p>
                )}

                {issue.fix && (
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg mb-3">
                    <div className="text-xs font-bold text-zinc-500 uppercase mb-1">How to fix</div>
                    <code className="text-sm text-emerald-600 dark:text-emerald-400">{issue.fix}</code>
                  </div>
                )}

                {issue.learnMore && (
                  <a
                    href={issue.learnMore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Learn more about {issue.criterion}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>
    </div>
  );
}

// Export convenience function
export { validateEpubAccessibility } from '@/lib/validation/EpubAccessibilityValidator';
export type { AccessibilityReport, AccessibilityIssue } from '@/lib/validation/EpubAccessibilityValidator';
