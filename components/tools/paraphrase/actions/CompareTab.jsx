"use client";
import { modes } from "@/_mock/tools/paraphrase";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Copy, RefreshCcw, RotateCcw } from "lucide-react";

const SYNONYMS = {
  20: "Basic",
  40: "Intermediate",
  60: "Advanced",
  80: "Expert",
};

// Extracted SuggestionCard component
const SuggestionCard = ({
  card,
  idx,
  minStep,
  maxStep,
  sliderMarks,
  handleLocalSliderChange,
  handleSliderChange,
  handleRefresh,
  handleReplay,
  handleSelect,
  selectedMode,
}) => {
  const { label, plain, loading, selected, sliderValue, history } = card;
  const onSelect = () => handleSelect(plain, label);
  const onCopy = () => {
    navigator.clipboard.writeText(plain);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="bg-muted/30 shadow-sm mb-2 rounded-xl">
      <CardContent className="pb-0">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs font-medium">
            {label}
          </div>
          <div className="flex items-center gap-2">
            <Slider
              aria-label="Synonyms"
              value={[sliderValue]}
              min={minStep}
              max={maxStep}
              step={minStep}
              className="w-28"
              onValueChange={(val) => handleLocalSliderChange(idx, val[0])}
              onPointerUp={() => handleSliderChange(idx, sliderValue)}
            />
            <div className="text-muted-foreground text-[11px]">
              {SYNONYMS[sliderValue]}
            </div>
          </div>
        </div>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-full" />
        ) : (
          <div className="mt-1 text-sm">{plain}</div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRefresh(idx)}
            disabled={loading}
            aria-label="Refresh suggestion"
          >
            <RefreshCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleReplay(idx)}
            disabled={history.length === 0}
            aria-label="Replay suggestion"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
        <div className="flex items-center">
          <Button
            size="sm"
            variant={selected ? "default" : "outline"}
            onClick={onSelect}
            disabled={loading}
          >
            {selected ? "Selected" : "Select"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCopy}
            disabled={loading}
            aria-label="Copy suggestion"
            className="ml-1"
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const CompareTab = ({
  sentence,
  highlightSentence,
  outputText,
  setOutputText,
  selectedMode,
  setSelectedMode,
  selectedLang,
  freezeWords,
  selectedSynonymLevel,
}) => {
  const { accessToken } = useSelector((state) => state.auth);

  const allowedSteps = Object.keys(SYNONYMS).map(Number);
  const minStep = Math.min(...allowedSteps);
  const maxStep = Math.max(...allowedSteps);
  const initialStep = allowedSteps.includes(selectedSynonymLevel)
    ? selectedSynonymLevel
    : minStep;
  const sliderMarks = allowedSteps.map((value) => ({
    value,
    label: SYNONYMS[value],
  }));

  const [suggestions, setSuggestions] = useState(
    modes.map((mode) => ({
      label: mode.value,
      mode: mode.value,
      plain: "",
      loading: false,
      selected: mode.value.toLowerCase() === selectedMode?.toLowerCase(),
      sliderValue: initialStep,
      history: [],
      historyIndex: -1,
    })),
  );
  const redirectPrefix = "p-v2";
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL + "/" + redirectPrefix + "/api";
  // process.env.NEXT_PUBLIC_PARAPHRASE_API_URL + "/api";

  const getSynonymLabel = (step) => SYNONYMS[step] ?? SYNONYMS[minStep];

  const requestCardUpdate = (idx, stepValue, recordHistory = false) => {
    setSuggestions((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newHistory = recordHistory
          ? [
              ...item.history,
              { plain: item.plain, sliderValue: item.sliderValue },
            ]
          : item.history;
        const newIndex = recordHistory
          ? newHistory.length - 1
          : item.historyIndex;
        return {
          ...item,
          loading: true,
          history: newHistory,
          historyIndex: newIndex,
        };
      }),
    );

    const card = suggestions[idx];
    const synonymLabel = getSynonymLabel(stepValue).toLowerCase();
    const payload = {
      text: sentence,
      mode: card.mode.toLowerCase(),
      synonym: synonymLabel,
      language: selectedLang,
      freeze: freezeWords,
    };

    fetch(`${API_BASE}/paraphrase-single-mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSuggestions((prev) =>
          prev.map((item, i) =>
            i === idx
              ? {
                  ...item,
                  plain: data.plain.replace(/[{}]/g, ""), // removing curly braces from output/preserved frozen words
                  loading: false,
                }
              : item,
          ),
        );
      })
      .catch((error) => {
        setSuggestions((prev) =>
          prev.map((item, i) =>
            i === idx
              ? { ...item, plain: "Upgrade plan", loading: false }
              : item,
          ),
        );
        // enqueueSnackbar(`Mode "${card.mode}" error: Limited acce`, { variant: "error" });
      });
  };

  const handleLocalSliderChange = (idx, value) => {
    setSuggestions((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, sliderValue: value } : item,
      ),
    );
  };

  useEffect(() => {
    if (!sentence) return;

    setSuggestions(
      modes.map((mode) => ({
        label: mode.value,
        mode: mode.value,
        plain: "",
        loading: false,
        selected: mode.value.toLowerCase() === selectedMode?.toLowerCase(),
        sliderValue: initialStep,
        history: [],
        historyIndex: -1,
      })),
    );
    allowedSteps.forEach((_, idx) => requestCardUpdate(idx, initialStep));
  }, [sentence]);

  const handleSliderChange = (idx, value) =>
    requestCardUpdate(idx, value, true);
  const handleRefresh = (idx) =>
    requestCardUpdate(idx, suggestions[idx].sliderValue, true);
  const handleReplay = (idx) => {
    setSuggestions((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const hist = item.history;
        if (!hist.length) return item;
        const len = hist.length;
        const currentIndex =
          item.historyIndex >= 0 ? item.historyIndex : len - 1;
        const entry = hist[currentIndex];
        const nextIndex = (currentIndex - 1 + len) % len;
        return {
          ...item,
          plain: entry.plain,
          sliderValue: entry.sliderValue,
          historyIndex: nextIndex,
        };
      }),
    );
  };

  const handleSelect = (plainText, mode) => {
    const newOutput = [...outputText];
    newOutput[highlightSentence] = plainText
      .split(/\s+/)
      .map((w) => ({ word: w, type: "none", synonyms: [] }));
    setOutputText(newOutput);
    setSelectedMode(mode);
    toast.success("Sentence replaced");
  };

  return (
    <div id="compare_tab" className="px-2 py-1">
      <div className="text-base font-semibold">Compare Modes</div>
      <div className="bg-border/50 h-px mb-2" />

      {/* Original Sentence Card */}
      <Card className="bg-muted shadow-sm mb-2 rounded-xl">
        <CardContent>
          <div className="text-muted-foreground mb-1 text-xs font-medium">
            Original Sentence
          </div>
          <div className="text-sm">{sentence}</div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(sentence);
              toast.success("Copied to clipboard");
            }}
            aria-label="Copy original sentence"
          >
            <Copy className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={
                selectedMode === "OriginalSentence" ? "default" : "outline"
              }
              onClick={() => handleSelect(sentence, "Original Sentence")}
            >
              {selectedMode === "Original Sentence" ? "Selected" : "Select"}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(sentence);
                toast.success("Copied to clipboard");
              }}
              aria-label="Copy original sentence"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Suggestion Cards */}
      {suggestions.map((s, idx) => (
        <SuggestionCard
          key={s.mode}
          card={s}
          idx={idx}
          minStep={minStep}
          maxStep={maxStep}
          sliderMarks={sliderMarks}
          handleLocalSliderChange={handleLocalSliderChange}
          handleSliderChange={handleSliderChange}
          handleRefresh={handleRefresh}
          handleReplay={handleReplay}
          handleSelect={handleSelect}
          selectedMode={selectedMode}
        />
      ))}
    </div>
  );
};

export default CompareTab;
