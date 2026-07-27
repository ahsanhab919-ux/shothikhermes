"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { searchAll, formatCitation } from "@/lib/citation-lookup";
import {
  BookOpen,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Info,
  Search,
  ExternalLink,
  Plus,
  Copy,
  Trash2,
  FileText,
  FileSearch,
  FlaskConical,
  RefreshCw,
  Loader2,
  Check,
  ListOrdered as ListIcon,
} from "lucide-react";

export function WritingAnalysisPanel({ analysis }) {
  if (!analysis || analysis.wordCount === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="text-center text-muted-foreground py-4">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Start writing to see analysis</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getPassiveStatus = (percentage) => {
    if (percentage < 10) return { color: "text-yellow-600", label: "Low (consider adding some)" };
    if (percentage <= 25) return { color: "text-green-600", label: "Good for academic writing" };
    if (percentage <= 40) return { color: "text-yellow-600", label: "Slightly high" };
    return { color: "text-red-600", label: "Too much passive voice" };
  };

  const passiveStatus = getPassiveStatus(analysis.passiveVoice.percentage);

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Academic Tone Score
          </span>
          <span className={cn("text-2xl font-bold", getScoreColor(analysis.academicToneScore))}>
            {analysis.academicToneScore}
          </span>
        </div>
        <Progress value={analysis.academicToneScore} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">
          Based on vocabulary complexity, passive voice usage, and readability
        </p>
      </div>

      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm font-medium">Readability</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-background rounded">
            <div className={cn("text-lg font-semibold", analysis.readabilityInfo.color)}>
              {analysis.readingEase}
            </div>
            <div className="text-xs text-muted-foreground">Flesch Score</div>
          </div>
          <div className="text-center p-2 bg-background rounded">
            <div className="text-lg font-semibold">{analysis.gradeLevel}</div>
            <div className="text-xs text-muted-foreground">Grade Level</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={analysis.readabilityInfo.color}>{analysis.readabilityInfo.label}</span>
          <span className="text-muted-foreground">{analysis.gradeLevelLabel}</span>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Statistics</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Words</span>
            <span className="font-medium">{analysis.wordCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sentences</span>
            <span className="font-medium">{analysis.sentenceCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paragraphs</span>
            <span className="font-medium">{analysis.paragraphCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg. Sentence</span>
            <span className="font-medium">{analysis.avgSentenceLength} words</span>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Writing Style</span>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                    Passive Voice
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Academic writing often uses 10-25% passive voice.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className={passiveStatus.color}>
                {Math.round(analysis.passiveVoice.percentage)}%
              </span>
            </div>
            <Progress value={analysis.passiveVoice.percentage} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{passiveStatus.label}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                    Complex Words
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Words with 3+ syllables. Academic writing typically has 15-25%.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">
                {Math.round(analysis.complexWords.percentage)}%
              </span>
            </div>
            <Progress value={analysis.complexWords.percentage} className="h-1.5" />
            {analysis.complexWords.words.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.complexWords.words.slice(0, 5).map((word, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {word}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1 text-muted-foreground">
                    Hedging Language
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Words like "might", "perhaps". Some hedging is appropriate.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">
                {analysis.hedgingLanguage.count} uses
              </span>
            </div>
            {analysis.hedgingLanguage.instances.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.hedgingLanguage.instances.slice(0, 4).map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {h.word} ({h.count})
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Word Choice</span>
        </div>
        <div className="space-y-3 text-sm">
          {analysis.weakWords?.count > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Weak Words</span>
                <span className="font-medium text-yellow-600">
                  {analysis.weakWords.count} found
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.weakWords.instances.slice(0, 5).map((w, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-700">
                    {w.word} ({w.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.informalLanguage?.count > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Informal Language</span>
                <span className="font-medium text-orange-600">
                  {analysis.informalLanguage.count} found
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.informalLanguage.instances.slice(0, 5).map((w, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-orange-500/10 text-orange-700">
                    {w.word} ({w.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.repetition?.count > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Repeated Words</span>
                <span className="font-medium">
                  {analysis.repetition.count} words
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.repetition.instances.slice(0, 5).map((w, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {w.word} ({w.count}x)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(!analysis.weakWords?.count && !analysis.informalLanguage?.count && !analysis.repetition?.count) && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No word choice issues detected
            </p>
          )}
        </div>
      </div>

      {analysis.sentenceVariety && analysis.sentenceCount > 2 && (
        <div className="p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Sentence Variety</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Variety Score</span>
              <span className={cn(
                "font-medium",
                analysis.sentenceVariety.varietyScore >= 50 ? "text-green-600" : 
                analysis.sentenceVariety.varietyScore >= 30 ? "text-yellow-600" : "text-orange-600"
              )}>
                {analysis.sentenceVariety.varietyScore}%
              </span>
            </div>
            <Progress value={analysis.sentenceVariety.varietyScore} className="h-1.5" />
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
              <div className="p-1 bg-background rounded">
                <div className="font-medium">{analysis.sentenceVariety.shortCount}</div>
                <div className="text-muted-foreground">Short</div>
              </div>
              <div className="p-1 bg-background rounded">
                <div className="font-medium">{analysis.sentenceVariety.mediumCount}</div>
                <div className="text-muted-foreground">Medium</div>
              </div>
              <div className="p-1 bg-background rounded">
                <div className="font-medium">{analysis.sentenceVariety.longCount}</div>
                <div className="text-muted-foreground">Long</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CitationFormatHelper() {
  const [selectedFormat, setSelectedFormat] = useState("apa");
  
  const formats = {
    apa: {
      name: "APA 7th",
      book: "Author, A. A. (Year). Title of work: Capital letter also for subtitle. Publisher.",
      journal: "Author, A. A., & Author, B. B. (Year). Title of article. Title of Periodical, volume(issue), page–page.",
      website: "Author, A. A. (Year, Month Day). Title of page. Site Name. URL",
    },
    mla: {
      name: "MLA 9th",
      book: "Author Last, First. Title of Book. Publisher, Year.",
      journal: "Author Last, First. \"Title of Article.\" Journal Name, vol. #, no. #, Year, pp. #-#.",
      website: "Author Last, First. \"Title of Page.\" Website Name, Publisher, Day Month Year, URL.",
    },
    chicago: {
      name: "Chicago 17th",
      book: "Last, First. Title of Book. Place: Publisher, Year.",
      journal: "Last, First. \"Article Title.\" Journal Name Volume, no. Issue (Year): pages.",
      website: "Last, First. \"Page Title.\" Website Name. Last modified Month Day, Year. URL.",
    },
    ieee: {
      name: "IEEE",
      book: "A. Author, Title of Book. Publisher, Year.",
      journal: "A. Author, \"Title of article,\" Journal, vol. #, no. #, pp. #-#, Year.",
      website: "A. Author, \"Page Title,\" Website. [Online]. Available: URL.",
    },
    harvard: {
      name: "Harvard",
      book: "Author, A. (Year) Title of Book. Publisher.",
      journal: "Author, A. (Year) 'Title of article', Journal, vol(issue), pp. #-#.",
      website: "Author, A. (Year) Title of page. Available at: URL (Accessed: Date).",
    },
    vancouver: {
      name: "Vancouver",
      book: "Author A. Title of book. Publisher; Year.",
      journal: "Author A. Title of article. Journal. Year;vol(issue):pages.",
      website: "Author A. Title of page [Internet]. Year [cited Date]. Available from: URL.",
    },
  };

  const current = formats[selectedFormat];

  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4" />
        <span className="text-sm font-medium">Citation Formats</span>
      </div>
      <div className="flex gap-1 mb-3">
        {Object.entries(formats).map(([key, format]) => (
          <button
            key={key}
            onClick={() => setSelectedFormat(key)}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              selectedFormat === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {format.name}
          </button>
        ))}
      </div>
      <div className="space-y-2 text-xs">
        <div className="p-2 bg-background rounded">
          <div className="font-medium text-muted-foreground mb-1">Book</div>
          <div className="font-mono text-[10px] break-all">{current.book}</div>
        </div>
        <div className="p-2 bg-background rounded">
          <div className="font-medium text-muted-foreground mb-1">Journal</div>
          <div className="font-mono text-[10px] break-all">{current.journal}</div>
        </div>
        <div className="p-2 bg-background rounded">
          <div className="font-medium text-muted-foreground mb-1">Website</div>
          <div className="font-mono text-[10px] break-all">{current.website}</div>
        </div>
      </div>
    </div>
  );
}

export function CitationLookup({ onSave, onInsert, citationFormat, onFormatChange, checkLimit, trackUsage, onLimitReached }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [insertedIndex, setInsertedIndex] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() || query.length < 3) return;
    
    if (checkLimit && !checkLimit("citations")) {
      onLimitReached?.("citations");
      return;
    }
    
    setIsSearching(true);
    try {
      const searchResults = await searchAll(query);
      setResults(searchResults);
      trackUsage?.("citations");
    } catch (error) {
      toast.error("Failed to search citations");
    } finally {
      setIsSearching(false);
    }
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
    if (onInsert) {
      const formatted = formatCitation(item, citationFormat);
      onInsert(formatted);
      setInsertedIndex(index);
      setTimeout(() => setInsertedIndex(null), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4" />
        <span className="text-sm font-medium">Citation Lookup</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Search by title, author, DOI, or ISBN
      </p>
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Enter DOI, ISBN, or search term..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm h-8"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={isSearching || query.length < 3}
          className="h-8 px-3"
        >
          {isSearching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <div className="flex gap-1 mb-3 flex-wrap">
        {["apa", "mla", "chicago", "ieee", "harvard", "vancouver"].map((format) => (
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

      {results.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {results.map((item, index) => (
            <div
              key={index}
              className="p-2 bg-background rounded border text-xs group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title}</div>
                  <div className="text-muted-foreground truncate">
                    {item.authors?.map((a) => `${a.family}`).join(", ")} 
                    {item.year ? ` (${item.year})` : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {item.type === "book" ? "📚 Book" : "📄 Article"}
                    {item.journal && ` • ${item.journal}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsert(item, index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Insert into document"
                  >
                    {insertedIndex === index ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSave(item, index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add to references"
                  >
                    {savedIndex === index ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(item, index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy citation"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              {item.doi && (
                <a
                  href={`https://doi.org/${item.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  DOI
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.length >= 3 && !isSearching && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No results found. Try a different search term.
        </p>
      )}
    </div>
  );
}

export function ReferenceListPanel({ references, onRemove, onInsert, citationFormat, onCopyAll }) {
  const [insertedIndex, setInsertedIndex] = useState(null);
  
  const handleCopy = async (item) => {
    const formatted = formatCitation(item, citationFormat);
    try {
      await navigator.clipboard.writeText(formatted);
      toast.success("Citation copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleInsert = (item, index) => {
    if (onInsert) {
      const formatted = formatCitation(item, citationFormat);
      onInsert(formatted);
      setInsertedIndex(index);
      setTimeout(() => setInsertedIndex(null), 2000);
    }
  };

  if (references.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-2">
          <ListIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Reference List</span>
        </div>
        <p className="text-xs text-muted-foreground text-center py-3">
          No references saved yet. Use Citation Lookup to find and save sources.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Reference List</span>
          <Badge variant="secondary" className="text-[10px]">
            {references.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onCopyAll}
          className="h-6 text-[10px] px-2"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy All
        </Button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {references.map((item, index) => (
          <div
            key={index}
            className="p-2 bg-background rounded border text-xs group hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.title}</div>
                <div className="text-muted-foreground truncate">
                  {item.authors?.map((a) => `${a.family}`).join(", ")} 
                  {item.year ? ` (${item.year})` : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleInsert(item, index)}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Insert into document"
                >
                  {insertedIndex === index ? (
                    <Check className="h-2.5 w-2.5 text-green-500" />
                  ) : (
                    <FileText className="h-2.5 w-2.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(item)}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy citation"
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(index)}
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  title="Remove"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlagiarismCheckPanel({ result, isChecking, error, onRetry }) {
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return "bg-muted";
    if (score <= 10) return "bg-green-500";
    if (score <= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score) => {
    if (score === null || score === undefined) return "Not checked";
    if (score <= 10) return "Original";
    if (score <= 25) return "Some matches found";
    return "High similarity";
  };

  const score = result?.score ?? null;

  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <FileSearch className="h-4 w-4" />
          Plagiarism Check
        </span>
        {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      
      {error ? (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={onRetry} className="w-full">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Similarity</span>
            <span className={cn(
              "font-medium",
              score !== null && score <= 10 && "text-green-600",
              score !== null && score > 10 && score <= 25 && "text-yellow-600",
              score !== null && score > 25 && "text-red-600"
            )}>
              {score !== null ? `${score}%` : "—"}
            </span>
          </div>
          <Progress value={score || 0} className="h-2" />
          <div className="flex items-center gap-1 text-xs">
            <div className={cn("w-2 h-2 rounded-full", getScoreColor(score))} />
            <span className="text-muted-foreground">{getScoreLabel(score)}</span>
          </div>
          
          {result?.sections && result.sections.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium mb-2">Matches ({result.sections.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.sections.slice(0, 5).map((section, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-background rounded">
                    <span className="truncate flex-1 text-muted-foreground">
                      {section.source || section.sourceUrl || "Source"}
                    </span>
                    <span className={cn(
                      "font-medium ml-2",
                      section.similarityScore <= 25 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {section.similarityScore || 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AIScorePanel({ aiScore, isScanning }) {
  const getScoreColor = (score) => {
    if (score === null) return "bg-muted";
    if (score <= 20) return "bg-green-500";
    if (score <= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score) => {
    if (score === null) return "Not scanned";
    if (score <= 20) return "Likely Human";
    if (score <= 50) return "Mixed";
    return "Likely AI";
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          AI Detection
        </span>
        {isScanning && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">AI Probability</span>
          <span className={cn(
            "font-medium",
            aiScore !== null && aiScore <= 20 && "text-green-600",
            aiScore !== null && aiScore > 20 && aiScore <= 50 && "text-yellow-600",
            aiScore !== null && aiScore > 50 && "text-red-600"
          )}>
            {aiScore !== null ? `${aiScore}%` : "—"}
          </span>
        </div>
        <Progress value={aiScore || 0} className="h-2" />
        <div className="flex items-center gap-1 text-xs">
          <div className={cn("w-2 h-2 rounded-full", getScoreColor(aiScore))} />
          <span className="text-muted-foreground">{getScoreLabel(aiScore)}</span>
        </div>
      </div>
    </div>
  );
}
