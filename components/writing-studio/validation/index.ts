'use client';

export { AccessibilityReportPanel } from './AccessibilityReportPanel';
export { validateEpubAccessibility, validateContentAccessibility } from '@/lib/validation/EpubAccessibilityValidator';
export type { 
  AccessibilityReport, 
  AccessibilityIssue,
  EpubContent,
  TocEntry,
  HtmlFile,
  ImageFile,
  CssFile
} from '@/lib/validation/EpubAccessibilityValidator';
