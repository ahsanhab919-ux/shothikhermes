"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setShowLoginModal } from "@/redux/slices/auth";
import { AlertTriangle, Download, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { trackEvent } from "@/analysers/eventTracker";
import InitialInputActions from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection/InitialInputActions";
import FileDropzone from "@/components/plagiarism/FileDropzone";
import OriginalityBadge from "@/components/plagiarism/OriginalityBadge";
import PlagiarismInputEditor from "@/components/plagiarism/PlagiarismInputEditor";
import PlagiarismResultsPanel from "@/components/plagiarism/PlagiarismResultsPanel";
import { getOriginalityScore } from "@/components/plagiarism/plagiarism-modernization";
import WordCounter from "@/components/tools/common/WordCounter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import useResponsive from "@/hooks/ui/useResponsive";
import useGlobalPlagiarismCheck from "@/hooks/useGlobalPlagiarismCheck";
import { useScanHistory } from "@/hooks/useScanHistory";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { preprocessText, detectSTEMContent } from "@/services/stemPreprocessor";
import { trackToolUsed } from "@/lib/posthog";
import useCitationAnalysis from "@/hooks/useCitationAnalysis";
import { pdfDownload } from "./helpers/pdfDownload";

const PLAGIARISM_SAMPLE_TEXT = "Machine learning has revolutionized the field of natural language processing, enabling significant advances in text classification, sentiment analysis, and language generation. Recent studies by Smith et al. (2023) demonstrated that transformer-based architectures achieve state-of-the-art performance on benchmark datasets including GLUE and SuperGLUE. The attention mechanism, first introduced by Vaswani et al. (2017) in the seminal paper 'Attention Is All You Need,' allows models to capture long-range dependencies in text sequences more effectively than recurrent neural networks. In the domain of medical informatics, deep learning approaches have shown promising results for clinical text mining and electronic health record analysis (Johnson & Lee, 2024). However, concerns remain regarding model interpretability, particularly in high-stakes applications such as diagnostic support systems. The methodology employed in this study follows the experimental framework established by Brown et al. (2020), utilizing a fine-tuning approach on pre-trained language models with domain-specific corpora.";

const PlagiarismCheckerContentSection = () => {
  const { t } = useTranslation();
  const { addEntry } = useScanHistory();
  const { user } = useSelector((state) => state.auth);
  const [enableScan, setEnableScan] = useState(true);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [excludeReferences, setExcludeReferences] = useState(false);
  const [excludeQuotes, setExcludeQuotes] = useState(false);
  const [excludeLatex, setExcludeLatex] = useState(false);
  const [excludeCode, setExcludeCode] = useState(false);
  const [stemDetection, setStemDetection] = useState({ hasLatex: false, hasCode: false });
  const scanStartTimeRef = useRef(null);
  const isScanningRef = useRef(false);
  const isMobile = useResponsive("down", "lg");
  const params = useSearchParams();
  const share_id = params.get("share_id");

  useEffect(() => {
    if (inputText.trim().length > 10) {
      const detection = detectSTEMContent(inputText);
      setStemDetection(detection);
      if (detection.hasLatex && !excludeLatex) {
        setExcludeLatex(true);
      }
      if (detection.hasCode && !excludeCode) {
        setExcludeCode(true);
      }
    } else {
      setStemDetection({ hasLatex: false, hasCode: false });
    }
  }, [inputText]);

  const preprocessResult = useMemo(() => {
    return preprocessText(inputText, {
      excludeLatex,
      excludeCode,
      excludeReferences,
      excludeQuotes,
    });
  }, [inputText, excludeLatex, excludeCode, excludeReferences, excludeQuotes]);

  const textForScan = preprocessResult.processedText;

  const excludedDecorations = useMemo(() => {
    if (!preprocessResult.excludedRegions.length || !inputText) return [];

    const charToPos = [];
    let proseMirrorPos = 1;
    for (let i = 0; i < inputText.length; i++) {
      charToPos.push(proseMirrorPos);
      if (inputText[i] === "\n") {
        proseMirrorPos += 1;
      } else {
        proseMirrorPos += 1;
      }
    }

    return preprocessResult.excludedRegions
      .map((region) => {
        if (region.start < 0 || region.end > inputText.length || region.start >= region.end) return null;
        const from = charToPos[region.start];
        const to = region.end < inputText.length ? charToPos[region.end] : proseMirrorPos;
        if (typeof from !== "number" || typeof to !== "number" || from >= to) return null;
        return {
          from,
          to,
          type: region.type,
        };
      })
      .filter(Boolean);
  }, [preprocessResult.excludedRegions, inputText]);

  const {
    loading,
    report,
    error,
    inlineError,
    fromCache,
    triggerCheck,
    retryWithBackoff,
    reset,
  } = useGlobalPlagiarismCheck(textForScan);

  const hasReport = Boolean(report);
  const originalityScore = getOriginalityScore(report);
  const [resultsPanelOpen, setResultsPanelOpen] = useState(true);

  const plagiarismSourcesForCitation = useMemo(() => {
    if (!report) return [];
    const sources = [];
    const addSources = (items, prefix) => {
      items?.forEach((item, idx) => {
        item.sources?.forEach((s) => {
          sources.push({
            url: s.url || "",
            title: s.title || "",
            snippet: s.snippet || "",
            matchId: `${prefix}-${idx}`,
            similarity: item.similarity ?? (prefix === "exact" ? 100 : 0),
          });
        });
      });
    };
    addSources(report.exactMatches, "exact");
    addSources(report.sections, "section");
    return sources;
  }, [report]);

  const citationAnalysis = useCitationAnalysis(
    inputText,
    plagiarismSourcesForCitation,
    hasReport
  );
  
  const highlightRanges = useMemo(() => {
    if (!report || !inputText) {
      return [];
    }

    const ranges = [];
    const usedPositions = new Set(); // Track used positions to avoid duplicates
    
    // Helper function to find snippet in input text (case-insensitive, handles variations)
    const findSnippetInInput = (sourceSnippet) => {
      if (!sourceSnippet || !inputText) return null;
      
      const trimmedSnippet = sourceSnippet.trim();
      if (!trimmedSnippet || trimmedSnippet.length === 0) return null;
      
      // Strategy 1: Try exact match (case-insensitive on original strings)
      const snippetLower = trimmedSnippet.toLowerCase();
      const inputLower = inputText.toLowerCase();
      let index = inputLower.indexOf(snippetLower);
      
      if (index !== -1) {
        const end = Math.min(inputText.length, index + trimmedSnippet.length);
        return { start: index, end };
      }
      
      const normalizeWhitespace = (text) => text.replace(/\s+/g, ' ').trim();
      const normalizedSnippet = normalizeWhitespace(snippetLower);
      const normalizedInput = normalizeWhitespace(inputLower);
      index = normalizedInput.indexOf(normalizedSnippet);

      const mapNormalizedToOriginal = (normalizedIdx, snippetLen) => {
        const trimmedLower = inputLower.replace(/^\s+/, '');
        const leadingSpaces = inputLower.length - trimmedLower.length;
        let normPos = 0;
        let origStart = -1;
        let origEnd = -1;
        let matchNormStart = normalizedIdx;
        let matchNormEnd = normalizedIdx + snippetLen;
        
        for (let i = leadingSpaces; i < inputText.length && normPos <= matchNormEnd; i++) {
          if (/\s/.test(inputText[i])) {
            if (i > leadingSpaces && !/\s/.test(inputText[i - 1])) {
              normPos++;
            }
          } else {
            if (normPos === matchNormStart && origStart === -1) {
              origStart = i;
            }
            normPos++;
            if (normPos === matchNormEnd && origEnd === -1) {
              origEnd = i + 1;
            }
          }
        }
        if (origStart !== -1 && origEnd === -1) origEnd = inputText.length;
        return origStart !== -1 ? { start: origStart, end: origEnd } : null;
      };
      
      if (index !== -1) {
        const mapped = mapNormalizedToOriginal(index, normalizedSnippet.length);
        if (mapped) return mapped;
      }
      
      if (normalizedSnippet.length > 20) {
        const partialSnippet = normalizedSnippet.substring(0, 20);
        index = normalizedInput.indexOf(partialSnippet);
        
        if (index !== -1) {
          const mapped = mapNormalizedToOriginal(index, normalizedSnippet.length);
          if (mapped) return mapped;
        }
      }
      
      return null;
    };
    
    // Process exact matches first (they have highest priority)
    if (report.exactMatches?.length) {
      
      report.exactMatches.forEach((match, matchIndex) => {
        
        // For exact matches, use source snippets to find matches in input
        if (match.sources && match.sources.length > 0) {
          match.sources.forEach((source) => {
            const sourceSnippet = source.snippet;
            
            if (!sourceSnippet) {
              return;
            }
            
            const found = findSnippetInInput(sourceSnippet);
            
            if (found) {
              const positionKey = `${found.start}-${found.end}`;
              
              // Avoid duplicate highlights
              if (!usedPositions.has(positionKey)) {
                usedPositions.add(positionKey);
                
                ranges.push({
                  start: found.start,
                  end: found.end,
                  similarity: 100,
                  isExact: true,
                  matchId: `exact-${matchIndex}`,
                });
              }
            }
          });
        }
      });
    }

    // Process sections (paraphrased content)
    if (report.sections?.length) {
      
      report.sections.forEach((section, sectionIndex) => {
        
        // Use source snippets to find matches in input
        if (section.sources && section.sources.length > 0) {
          section.sources.forEach((source) => {
            const sourceSnippet = source.snippet;
            
            if (!sourceSnippet) {
              return;
            }
            
            const found = findSnippetInInput(sourceSnippet);
            
            if (found) {
              const positionKey = `${found.start}-${found.end}`;
              
              // Avoid duplicate highlights (exact matches take priority)
              if (!usedPositions.has(positionKey)) {
                usedPositions.add(positionKey);
                
                ranges.push({
                  start: found.start,
                  end: found.end,
                  similarity: section.similarity ?? 0,
                  isExact: false,
                  matchId: `section-${sectionIndex}`,
                });
              }
            }
          });
        }
      });
    }

    // Sort ranges by start position
    ranges.sort((a, b) => a.start - b.start);
    
    return ranges;
  }, [report, inputText]);

  // Don't auto-reset - only reset on explicit user actions (clear button or significant text change)
  // This prevents the report from disappearing after scan completes

  // Track scan start time (no setInterval - calculate on-demand for better performance)
  useEffect(() => {
    if (loading && !scanStartTimeRef.current) {
      // Scan just started
      scanStartTimeRef.current = Date.now();
    } else if (!loading && scanStartTimeRef.current) {
      // Scan completed
      scanStartTimeRef.current = null;
    }
  }, [loading]);

  // Calculate elapsed time on-demand for display (updates only when needed)
  // This approach is more efficient than setInterval and doesn't interfere with scan performance
  const [displayElapsedTime, setDisplayElapsedTime] = useState(0);

  useEffect(() => {
    if (!loading || !scanStartTimeRef.current) {
      setDisplayElapsedTime(0);
      return;
    }

    // Update every second for display (minimal performance impact)
    // Using a longer interval to reduce re-renders and ensure no interference with scan
    const interval = setInterval(() => {
      if (scanStartTimeRef.current) {
        const elapsed = (Date.now() - scanStartTimeRef.current) / 1000;
        setDisplayElapsedTime(elapsed);
      }
    }, 1000); // Update every second - minimal overhead

    return () => clearInterval(interval);
  }, [loading]);

  // Track loading state with ref to avoid closure issues
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  // Reset enableScan when loading completes
  // This handles both fresh results (loading: true → false) and cached results (loading stays false)
  useEffect(() => {
    if (!loading && !enableScan) {
      setEnableScan(true);
    }
    // Clear scanning flag when loading completes (with a small delay to prevent race conditions)
    if (!loading && isScanningRef.current) {
      // Small delay to ensure state updates are processed
      const timeoutId = setTimeout(() => {
        isScanningRef.current = false;
      }, 500); // 500ms grace period after loading completes
      return () => clearTimeout(timeoutId);
    }
  }, [loading, enableScan]);

  const handleInputChange = (nextValue) => {
    const previousText = inputText;
    setInputText(nextValue);
    setEnableScan(true);
    
    // Don't reset if we're currently scanning - this prevents race conditions
    // where the editor updates during/after scan completion
    if (isScanningRef.current) {
      return;
    }
    
    // Only reset if text actually changed (not just whitespace) and we had a report
    // Check report directly (not hasReport from closure) to avoid stale values
    const currentHasReport = Boolean(report);
    if (currentHasReport && previousText.trim() !== nextValue.trim()) {
      reset();
    }
  };

  const handleClear = () => {
    setInputText("");
    setEnableScan(true);
    reset();
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user?._id) {
      setLoginDialogOpen(true);
      return;
    }

    // Prevent multiple clicks - check both enableScan and loading
    if (!enableScan || loading) {
      return;
    }

    trackEvent("click", "plagiarism-checker", "plagiarism-checker_click", 1);
    const wordCount = (textForScan || "").trim().split(/\s+/).filter(Boolean).length;
    trackToolUsed("plagiarism-checker", wordCount);

    // Disable scan button immediately to prevent double clicks
    setEnableScan(false);
    // Mark that we're scanning to prevent reset during scan
    isScanningRef.current = true;

    try {
      const scanResult = await triggerCheck(true);
      if (scanResult && scanResult.score != null) {
        addEntry({
          score: scanResult.score,
          riskLevel: scanResult.riskLevel || "LOW",
          wordCount: (textForScan || "").trim().split(/\s+/).filter(Boolean).length,
          textPreview: (textForScan || "").slice(0, 120),
          analyzedAt: scanResult.analyzedAt || new Date().toISOString(),
          matchCount: (scanResult.sections?.length ?? 0) + (scanResult.exactMatches?.length ?? 0),
        });
      }
    } catch (error) {
      setEnableScan(true);
      isScanningRef.current = false;
    }
  };

  const handleRefresh = async () => {
    await retryWithBackoff();
  };

  const handleNewScan = () => {
    reset();
    setInputText("");
    setEnableScan(true);
    setExcludeLatex(false);
    setExcludeCode(false);
    setStemDetection({ hasLatex: false, hasCode: false });
  };

  const handleHighlightClick = useCallback((matchId) => {
    setActiveMatchId(matchId);
    if (isMobile) setMobileTab("results");
    document.getElementById(matchId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setActiveMatchId(null), 2000);
  }, [isMobile]);

  const handleSectionClick = useCallback((matchId) => {
    setActiveMatchId(matchId);
    if (isMobile) setMobileTab("editor");
    setTimeout(() => {
      const el = document.querySelector(`[data-match-id="${matchId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('plagiarism-highlight-flash');
        setTimeout(() => {
          el.classList.remove('plagiarism-highlight-flash');
          setActiveMatchId(null);
        }, 1500);
      }
    }, isMobile ? 100 : 0);
  }, [isMobile]);

  const [mobileTab, setMobileTab] = useState("editor");

  useEffect(() => {
    if (isMobile && hasReport && !loading) {
      setMobileTab("results");
    }
  }, [hasReport, loading, isMobile]);

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadReport = async () => {
    if (!report) {
      return;
    }

    try {
      setIsDownloading(true);
      await pdfDownload({
        report,
        inputText,
      });
    } catch (error) {
    } finally {
      setIsDownloading(false);
    }
  };

  const compactErrorMessage = inlineError?.shortMessage || error;
  const CompactProgressRing = ({ loading, score }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const progress = loading ? 35 : Math.max(0, Math.min(100, score));
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-3 py-2">
        <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90">
          <circle cx="19" cy="19" r={radius} stroke="currentColor" strokeWidth="4" className="text-muted/50 fill-none" />
          <circle
            cx="19"
            cy="19"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("fill-none transition-all", loading ? "text-primary" : "text-emerald-500")}
          />
        </svg>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {loading ? "Scanning" : "Originality"}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {loading ? "Analyzing text..." : `${score}% original`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      isMobile ? "h-auto overflow-y-auto p-2 sm:p-4" : "h-[calc(100vh-120px)] overflow-hidden p-4"
    )}>
      {isMobile && (
        <div className="mb-3 flex w-full rounded-xl bg-muted/50 p-1 shadow-sm" role="tablist" aria-label={t("tools.plagiarism.tabs.ariaLabel")}>
          <button
            id="editor-tab"
            role="tab"
            aria-selected={mobileTab === "editor"}
            aria-controls="editor-panel"
            tabIndex={mobileTab === "editor" ? 0 : -1}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              mobileTab === "editor"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMobileTab("editor")}
          >
            {t("tools.plagiarism.tabs.editor")}
          </button>
          <button
            id="results-tab"
            role="tab"
            aria-selected={mobileTab === "results"}
            aria-controls="results-panel"
            tabIndex={mobileTab === "results" ? 0 : -1}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              mobileTab === "results"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMobileTab("results")}
          >
            {t("tools.plagiarism.tabs.results")}
            {hasReport && (
              <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
                {(report?.sections?.length ?? 0) + (report?.exactMatches?.length ?? 0)}
              </span>
            )}
          </button>
        </div>
      )}
      <div className={cn(
        "flex w-full flex-col gap-3",
        isMobile ? "h-auto" : "lg:flex-row lg:h-full"
      )}>
        {/* Input Section */}
        <div
          id="editor-panel"
          role="tabpanel"
          aria-labelledby="editor-tab"
          className={cn(
            "flex min-h-0 flex-col",
            isMobile ? (mobileTab === "editor" ? "h-auto min-h-[350px]" : "hidden") : "h-full lg:flex-1"
          )}
        >
          <div className="bg-card relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl shadow-sm lg:max-w-[550px] xl:max-w-full">
            {(inputText || report) && (
              <div className={cn(
                "flex shrink-0 flex-wrap items-center gap-3 bg-muted/30",
                isMobile ? "gap-2 px-2 py-2 sm:px-4" : "px-4 py-2"
              )}>
                <FileDropzone
                  compact
                  onExtracted={(text) => {
                    reset();
                    setInputText(text);
                  }}
                  disabled={loading}
                />
                <div className="bg-border mx-1 hidden h-5 w-px sm:block" />
                <div className="flex items-center gap-2">
                  <Switch
                    id="exclude-references"
                    checked={excludeReferences}
                    onCheckedChange={setExcludeReferences}
                    disabled={loading}
                  />
                  <Label htmlFor="exclude-references" className="text-sm cursor-pointer">
                    {t("tools.plagiarism.controls.excludeReferences")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="exclude-quotes"
                    checked={excludeQuotes}
                    onCheckedChange={setExcludeQuotes}
                    disabled={loading}
                  />
                  <Label htmlFor="exclude-quotes" className="text-sm cursor-pointer">
                    {t("tools.plagiarism.controls.excludeQuotes")}
                  </Label>
                </div>
                {stemDetection.hasLatex && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="exclude-latex"
                      checked={excludeLatex}
                      onCheckedChange={setExcludeLatex}
                      disabled={loading}
                    />
                    <Label htmlFor="exclude-latex" className="text-sm cursor-pointer">
                      {t("tools.plagiarism.controls.excludeLatex")}
                    </Label>
                  </div>
                )}
                {stemDetection.hasCode && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="exclude-code"
                      checked={excludeCode}
                      onCheckedChange={setExcludeCode}
                      disabled={loading}
                    />
                    <Label htmlFor="exclude-code" className="text-sm cursor-pointer">
                      {t("tools.plagiarism.controls.excludeCode")}
                    </Label>
                  </div>
                )}
              </div>
            )}
            {(hasReport && highlightRanges.length > 0) || excludedDecorations.length > 0 ? (
              <div className={cn(
                "flex shrink-0 flex-wrap items-center gap-4 bg-muted/20",
                isMobile ? "px-2 py-1.5 sm:px-4" : "px-4 py-1.5"
              )}>
                {hasReport && highlightRanges.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-muted-foreground text-xs">{t("tools.plagiarism.legend.exactMatch")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground text-xs">{t("tools.plagiarism.legend.paraphrased")}</span>
                    </div>
                  </>
                )}
                {excludeLatex && stemDetection.hasLatex && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground text-xs">{t("tools.plagiarism.legend.latexExcluded")}</span>
                  </div>
                )}
                {excludeCode && stemDetection.hasCode && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-500" />
                    <span className="text-muted-foreground text-xs">{t("tools.plagiarism.legend.codeExcluded")}</span>
                  </div>
                )}
              </div>
            ) : null}
            <div className={cn(
              "relative min-h-0 flex-1 overflow-y-auto",
              isMobile ? "p-2 sm:p-4" : "p-4"
            )}>
              <PlagiarismInputEditor
                value={inputText}
                onChange={handleInputChange}
                highlights={highlightRanges}
                excludedRegions={excludedDecorations}
                disabled={loading}
                onHighlightClick={handleHighlightClick}
              />
              {!inputText && !share_id && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-4 px-4">
                    <FileDropzone
                      onExtracted={(text) => setInputText(text)}
                      disabled={loading}
                    />
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      <span className="bg-border h-px flex-1" />
                      <span>{t("common.or") || "or"}</span>
                      <span className="bg-border h-px flex-1" />
                    </div>
                    <InitialInputActions
                      className={"flex-nowrap"}
                      setInput={(text) => {
                        setInputText(text);
                      }}
                      sample={PLAGIARISM_SAMPLE_TEXT}
                      showSample={true}
                      showPaste={true}
                      showInsertDocument={false}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {inputText && (
                <div className={cn(
                  "bg-muted/30 py-3",
                  isMobile ? "px-2 sm:px-4" : "px-4"
                )}>
                  <div
                    className={cn(
                      "mb-3 flex flex-wrap items-center justify-between gap-3",
                      !hasReport && !loading && !compactErrorMessage && "hidden"
                    )}
                    aria-live="polite"
                  >
                    {(loading || hasReport) && (
                      <div className="flex flex-wrap items-center gap-3">
                        <CompactProgressRing loading={loading} score={originalityScore} />
                        {!loading && hasReport ? <OriginalityBadge originality={originalityScore} /> : null}
                      </div>
                    )}

                    {compactErrorMessage ? (
                      <div
                        role="alert"
                        className="flex max-w-full flex-1 flex-wrap items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        <AlertTriangle className="size-4 shrink-0" />
                        <span className="max-w-[420px] truncate">
                          {String(compactErrorMessage).slice(0, 140)}
                        </span>
                        <button
                          type="button"
                          onClick={handleRefresh}
                          className="font-semibold underline underline-offset-4"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <WordCounter
                    btnDisabled={!enableScan || loading}
                    btnText={t("tools.plagiarism.actions.scan")}
                    toolName="plagiarism-checker"
                    userInput={inputText}
                    isLoading={loading}
                    handleClearInput={handleClear}
                    handleSubmit={handleSubmit}
                    userPackage={user?.package}
                    sticky={0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div
          id="results-panel"
          role="tabpanel"
          aria-labelledby="results-tab"
          className={cn(
            "flex min-h-0 flex-col",
            isMobile ? (mobileTab === "results" ? "h-auto min-h-[350px] flex-1" : "hidden") : "h-full xl:w-[420px] 2xl:w-[460px]"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {hasReport && !loading ? (
              <div className={cn("flex shrink-0 items-center", isMobile ? "flex-wrap gap-2" : "gap-3")}>
                <Button
                  variant="outline"
                  onClick={handleNewScan}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Plus className="size-4" />
                  {t("tools.plagiarism.actions.newScan")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2"
                  disabled={isDownloading || !report}
                >
                  <Download className="size-4" />
                  {isDownloading ? t("tools.plagiarism.actions.downloading") : t("tools.plagiarism.actions.downloadReport")}
                </Button>
              </div>
            ) : null}

            <PlagiarismResultsPanel
              open={isMobile ? true : resultsPanelOpen}
              onToggle={() => setResultsPanelOpen((prev) => !prev)}
              report={report}
              loading={loading && !fromCache}
              fromCache={fromCache}
              inputText={inputText}
              error={error}
              inlineError={inlineError}
              onRetry={handleRefresh}
              activeMatchId={activeMatchId}
              onSectionClick={handleSectionClick}
              citationAnalysis={citationAnalysis}
              elapsedTime={displayElapsedTime}
            />
          </div>
        </div>
      </div>
      <LoginDialog
        loginDialogOpen={loginDialogOpen}
        setLoginDialogOpen={setLoginDialogOpen}
      />
    </div>
  );
};

// Note: This code is for alerting user to login
const LoginDialog = ({ loginDialogOpen, setLoginDialogOpen }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("tools.plagiarism.login.authRequired")}</DialogTitle>
          <DialogDescription>
            {t("tools.plagiarism.login.loginMessage")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              dispatch(setShowLoginModal(true));
              setLoginDialogOpen(false);
            }}
          >
            {t("tools.plagiarism.login.loginButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// function UsesLimit({ userLimit }) {
//   const progressPercentage = () => {
//     if (!userLimit) return 0;
//     const totalWords = userLimit.totalWordLimit;
//     const remainingWords = userLimit.remainingWord;
//     return (remainingWords / totalWords) * 100;
//   };

//   return (
//     <div className="flex justify-end p-2">
//       <div className="w-[220px] sm:w-[250px]">
//         <LinearProgress
//           sx={{ height: 6 }}
//           variant="determinate"
//           value={progressPercentage()}
//         />
//         <p className="mt-1 text-xs sm:text-sm">
//           {formatNumber(userLimit?.totalWordLimit)} words /{" "}
//           {formatNumber(userLimit?.remainingWord)} words left
//         </p>
//       </div>
//     </div>
//   );
// }

export default PlagiarismCheckerContentSection;
