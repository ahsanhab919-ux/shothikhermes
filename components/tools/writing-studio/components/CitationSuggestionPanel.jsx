"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { formatCitation } from "@/lib/citation-lookup";
import {
  Search,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
  GraduationCap,
  Quote,
  ChevronDown,
  ChevronUp,
  FileText,
  Star,
  Globe,
  Lightbulb,
} from "lucide-react";

export function CitationSuggestionPanel({
  suggestions,
  isSearching,
  onSearch,
  onSuggestFromText,
  onGetSimilar,
  onSave,
  onInsertInline,
  citationFormat,
  onFormatChange,
  editorText,
  savedReferences,
  checkLimit,
  trackUsage,
  onLimitReached,
}) {
  const [manualQuery, setManualQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [insertedIndex, setInsertedIndex] = useState(null);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);

  const formats = ["apa", "mla", "chicago", "ieee", "harvard", "vancouver"];

  const handleManualSearch = async () => {
    if (!manualQuery.trim() || manualQuery.length < 3) return;
    if (checkLimit && !checkLimit("citations")) {
      onLimitReached?.("citations");
      return;
    }
    await onSearch(manualQuery);
    trackUsage?.("citations");
  };

  const handleAutoSuggest = async () => {
    if (!editorText || editorText.trim().length < 30) {
      toast.info("Write at least 30 words to get auto-suggestions");
      return;
    }
    if (checkLimit && !checkLimit("citations")) {
      onLimitReached?.("citations");
      return;
    }
    setShowAutoSuggest(true);
    await onSuggestFromText(editorText);
    trackUsage?.("citations");
  };

  const handleCopy = async (item, index) => {
    const formatted = formatCitation(item, citationFormat);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedIndex(index);
      toast.success("Citation copied!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSave = (item, index) => {
    if (onSave) {
      const wasAdded = onSave(item);
      if (wasAdded) {
        setSavedIndex(index);
        setTimeout(() => setSavedIndex(null), 2000);
      }
    }
  };

  const handleInsert = (item, index) => {
    if (onInsertInline) {
      onInsertInline(null, item);
      setInsertedIndex(index);
      setTimeout(() => setInsertedIndex(null), 2000);
    }
  };

  const isAlreadySaved = (item) => {
    return savedReferences?.some(
      (ref) =>
        (ref.doi && ref.doi === item.doi) ||
        (ref.title?.toLowerCase() === item.title?.toLowerCase() &&
          ref.year === item.year)
    );
  };

  return (
    <div className="space-y-3">
      <div className="p-4 bg-muted/30 shadow-sm rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Smart Citation Finder</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Search 214M+ academic papers from Semantic Scholar, CrossRef, and Open Library
        </p>

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Search by title, author, keyword, DOI..."
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            className="text-sm h-8"
            aria-label="Citation search input"
          />
          <Button
            size="sm"
            onClick={handleManualSearch}
            disabled={isSearching || manualQuery.length < 3}
            className="h-8 px-3"
          >
            {isSearching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoSuggest}
          disabled={isSearching || !editorText || editorText.trim().length < 30}
          className="w-full h-7 text-xs gap-1"
        >
          <Lightbulb className="h-3 w-3" />
          {isSearching && showAutoSuggest
            ? "Finding relevant papers..."
            : "Auto-suggest citations from your text"}
        </Button>

        <div className="flex gap-1 mt-3 flex-wrap">
          {formats.map((format) => (
            <button
              key={format}
              onClick={() => onFormatChange?.(format)}
              className={cn(
                "px-2 py-0.5 text-[10px] rounded transition-colors uppercase",
                citationFormat === format
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">
              {suggestions.length} papers found
            </span>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-2">
              {suggestions.map((item, index) => {
                const expanded = expandedIndex === index;
                const alreadySaved = isAlreadySaved(item);

                return (
                  <div
                    key={`${item.paperId || item.doi || index}`}
                    className={cn(
                      "p-3 bg-muted/30 shadow-sm rounded-xl text-xs transition-all",
                      expanded && "ring-1 ring-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() =>
                            setExpandedIndex(expanded ? null : index)
                          }
                          className="text-left w-full"
                        >
                          <div className="font-medium text-sm leading-tight hover:text-primary transition-colors">
                            {item.title}
                          </div>
                        </button>
                        <div className="text-muted-foreground mt-1">
                          {item.authors
                            ?.slice(0, 3)
                            .map((a) => a.family)
                            .join(", ")}
                          {item.authors?.length > 3 && " et al."}
                          {item.year ? ` (${item.year})` : ""}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {item.journal && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                              {item.journal}
                            </span>
                          )}
                          {item.citationCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] h-4 px-1.5 gap-0.5"
                            >
                              <Star className="h-2.5 w-2.5" />
                              {item.citationCount.toLocaleString()} cited
                            </Badge>
                          )}
                          {item.isOpenAccess && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] h-4 px-1.5 gap-0.5 bg-green-500/10 text-green-700"
                            >
                              <Globe className="h-2.5 w-2.5" />
                              Open Access
                            </Badge>
                          )}
                          {item.fieldsOfStudy?.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1.5"
                            >
                              {item.fieldsOfStudy[0]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleInsert(item, index)}
                                className="h-6 w-6 p-0"
                                disabled={isSearching}
                              >
                                {insertedIndex === index ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Quote className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              Insert inline citation
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSave(item, index)}
                                className="h-6 w-6 p-0"
                                disabled={alreadySaved}
                              >
                                {savedIndex === index || alreadySaved ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              {alreadySaved
                                ? "Already in references"
                                : "Add to reference list"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopy(item, index)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              Copy formatted citation
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {item.tldr && (
                          <div className="p-2 bg-primary/5 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-[10px] font-medium text-primary">
                                AI Summary
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item.tldr}
                            </p>
                          </div>
                        )}

                        {item.abstract && !item.tldr && (
                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              Abstract
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-4">
                              {item.abstract}
                            </p>
                          </div>
                        )}

                        <div className="p-2 bg-muted/50 rounded-lg">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Formatted ({citationFormat.toUpperCase()})
                          </span>
                          <p className="text-xs mt-0.5 font-mono leading-relaxed break-all">
                            {formatCitation(item, citationFormat)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {item.doi && (
                            <a
                              href={`https://doi.org/${item.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              DOI
                            </a>
                          )}
                          {item.openAccessUrl && (
                            <a
                              href={item.openAccessUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:underline"
                            >
                              <FileText className="h-2.5 w-2.5" />
                              Free PDF
                            </a>
                          )}
                          {item.paperId && (
                            <a
                              href={`https://www.semanticscholar.org/paper/${item.paperId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                            >
                              <BookOpen className="h-2.5 w-2.5" />
                              Semantic Scholar
                            </a>
                          )}
                        </div>

                        {item.paperId && onGetSimilar && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onGetSimilar(item.paperId)}
                            className="w-full h-6 text-[10px] gap-1"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            Find similar papers
                          </Button>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setExpandedIndex(expanded ? null : index)
                      }
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> Details
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {suggestions.length === 0 && !isSearching && (
        <div className="p-6 text-center text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            Search for papers or use auto-suggest to find relevant citations for
            your writing
          </p>
        </div>
      )}

      {isSearching && suggestions.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
          <p className="text-xs">Searching academic databases...</p>
        </div>
      )}
    </div>
  );
}

export default CitationSuggestionPanel;
