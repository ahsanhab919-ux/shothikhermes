"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  Loader2,
  BookOpen,
  ExternalLink,
  Plus,
  Quote,
  Users,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from "lucide-react";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

export function ResearchSearchPanel({
  onSearch,
  suggestions,
  isSearching,
  onSave,
  onInsertSummary,
  editorText,
  onSuggestFromText,
}) {
  const [query, setQuery] = useState("");
  const [expandedPaper, setExpandedPaper] = useState(null);

  const handleSearch = useCallback(
    (e) => {
      e?.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  const handleAutoSuggest = useCallback(() => {
    if (editorText && editorText.trim().length > 50) {
      onSuggestFromText(editorText);
    }
  }, [editorText, onSuggestFromText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Research Papers</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          214M+ papers
        </Badge>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, topics, or authors..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 shadow-sm rounded-xl border-0 focus:outline-none focus:ring-1 focus:ring-primary/30"
            aria-label="Search academic papers"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isSearching || !query.trim()}
          className="gap-1"
        >
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAutoSuggest}
        disabled={isSearching || !editorText || editorText.trim().length < 50}
        className="w-full gap-1.5 text-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Find Related Papers from Your Text
      </Button>

      {suggestions && suggestions.length > 0 && (
        <ScrollArea className="max-h-[350px]" aria-label="Search results">
          <div className="space-y-2 pr-1">
            {suggestions.map((paper, idx) => {
              const isExpanded = expandedPaper === idx;
              return (
                <motion.div
                  key={paper.paperId || paper.doi || idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: idx * 0.05 }}
                  className="p-3 bg-muted/50 shadow-sm rounded-xl space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium leading-tight line-clamp-2">
                        {paper.title}
                      </h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {paper.authors && paper.authors.length > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" />
                            {paper.authors
                              .slice(0, 3)
                              .map((a) => a.name || a)
                              .join(", ")}
                            {paper.authors.length > 3 && " et al."}
                          </span>
                        )}
                        {paper.year && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" />
                            {paper.year}
                          </span>
                        )}
                        {paper.citationCount != null && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Hash className="h-2.5 w-2.5" />
                            {paper.citationCount} citations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedPaper(isExpanded ? null : idx)}
                    className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" /> More
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springTransition}
                        className="overflow-hidden space-y-2"
                      >
                        {paper.tldr && (
                          <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                            {typeof paper.tldr === "string"
                              ? paper.tldr
                              : paper.tldr.text || ""}
                          </p>
                        )}
                        {paper.abstract && !paper.tldr && (
                          <p className="text-[11px] text-muted-foreground line-clamp-4">
                            {paper.abstract}
                          </p>
                        )}
                        {paper.fieldsOfStudy && paper.fieldsOfStudy.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {paper.fieldsOfStudy.map((field) => (
                              <Badge
                                key={field}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0"
                              >
                                {field}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                            View on Semantic Scholar
                          </a>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-[10px] gap-1"
                      onClick={() => onSave(paper)}
                      aria-label={`Save ${paper.title} to references`}
                    >
                      <Plus className="h-3 w-3" />
                      Save Ref
                    </Button>
                    {(paper.tldr || paper.abstract) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[10px] gap-1"
                        onClick={() => {
                          const summary =
                            typeof paper.tldr === "string"
                              ? paper.tldr
                              : paper.tldr?.text || paper.abstract || "";
                          if (summary) {
                            onInsertSummary(summary, paper);
                          }
                        }}
                        aria-label={`Insert summary from ${paper.title}`}
                      >
                        <Quote className="h-3 w-3" />
                        Insert Summary
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {suggestions && suggestions.length === 0 && !isSearching && query && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          <Search className="h-6 w-6 mx-auto mb-2 opacity-40" />
          No papers found. Try different search terms.
        </div>
      )}
    </motion.div>
  );
}

export default ResearchSearchPanel;
