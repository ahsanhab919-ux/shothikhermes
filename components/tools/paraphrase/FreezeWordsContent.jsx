"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MinusCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { protectedPhrases, protectedSingleWords } from "./extentions";

export default function FreezeWordsContent({
  close = () => {},
  freeze_props = {},
  readOnly = false,
}) {
  const {
    recommendedWords = [],
    frozenWords = [],
    frozenPhrases = [],
    onAddWords = () => {},
    onAddPhrases = () => {},
    onRemoveWord = () => {},
    onRemovePhrase = () => {},
    onClearAll = () => {},
  } = freeze_props;

  const [input, setInput] = useState("");
  const [localRecs, setLocalRecs] = useState([...recommendedWords]);

  // Separate user-added from protected words for better management
  const [userFrozenWords, setUserFrozenWords] = useState(new Set(frozenWords));
  const [userFrozenPhrases, setUserFrozenPhrases] = useState(
    new Set(frozenPhrases),
  );

  const protectedWordsSet = new Set(protectedSingleWords);
  const protectedPhrasesSet = new Set(protectedPhrases);

  // Sync external props - only update user words, not protected ones
  useEffect(() => {
    setLocalRecs([...recommendedWords]);
  }, [recommendedWords]);

  useEffect(() => {
    setUserFrozenWords(new Set(frozenWords));
  }, [frozenWords]);

  useEffect(() => {
    setUserFrozenPhrases(new Set(frozenPhrases));
  }, [frozenPhrases]);

  // Combine user and protected words for display
  const allFrozenWords = [
    ...Array.from(userFrozenWords),
    ...Array.from(userFrozenPhrases),
  ].sort();

  const handleRecClick = (word) => {
    if (readOnly) return;

    setLocalRecs((prev) => prev.filter((w) => w !== word));

    // Determine if it's a phrase or single word
    if (word.includes(" ")) {
      setUserFrozenPhrases((prev) => new Set([...prev, word]));
      onAddPhrases([word]);
    } else {
      setUserFrozenWords((prev) => new Set([...prev, word]));
      onAddWords([word]);
    }
  };

  const handleRemoveFrozen = (item) => {
    if (readOnly) return;

    // Don't allow removal of protected words
    if (protectedWordsSet.has(item) || protectedPhrasesSet.has(item)) {
      return;
    }

    // Remove from local state based on actual source
    if (userFrozenWords.has(item)) {
      setUserFrozenWords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item);
        return newSet;
      });
      onRemoveWord(item);
    } else if (userFrozenPhrases.has(item)) {
      setUserFrozenPhrases((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item);
        return newSet;
      });
      onRemovePhrase(item);
    }

    // Add back to recommendations if it was originally recommended
    if (recommendedWords.includes(item)) {
      setLocalRecs((prev) => [...prev, item]);
    }
  };

  const handleClearAll = () => {
    if (readOnly) return;

    // Only clear user-added words, keep protected ones
    setUserFrozenWords(new Set());
    setUserFrozenPhrases(new Set());
    setLocalRecs([...recommendedWords]);
    onClearAll();
  };

  const handleAddInput = () => {
    if (readOnly) return;

    const raw = String(input).trim();
    if (!raw) return;

    const entries = raw
      .split(",")
      .map((w) => String(w).trim())
      .filter((w) => w.length > 0);

    const words = entries.filter((w) => !w.includes(" "));
    const phrases = entries.filter((w) => w.includes(" "));

    if (words.length) {
      setUserFrozenWords((prev) => new Set([...prev, ...words]));
      onAddWords(words);
    }

    if (phrases.length) {
      setUserFrozenPhrases((prev) => new Set([...prev, ...phrases]));
      onAddPhrases(phrases);
    }

    setInput("");
  };

  const isProtectedItem = (item) => {
    return protectedWordsSet.has(item) || protectedPhrasesSet.has(item);
  };

  const isFreezeDisabled = readOnly || !String(input).trim();
  const hasUserFrozenItems =
    userFrozenWords.size > 0 || userFrozenPhrases.size > 0;

  return (
    <div className="bg-background flex max-h-[80vh] w-[90vw] flex-col rounded-lg p-2 shadow-lg sm:w-[300px] md:w-[500px] lg:w-[600px]">
      <div className="mb-2 flex flex-row items-center justify-between">
        <div className="text-base font-semibold">Freeze Words</div>
        <Button aria-label="close" onClick={close} variant="ghost" size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden md:flex-row">
        {/* Left panel - Recommendations */}
        <div className="flex flex-1 flex-col">
          <div className="text-sm font-medium">Recommended Words</div>
          <div className="border-border mt-1 flex-1 overflow-y-auto rounded-md border p-1">
            {localRecs.length > 0 ? (
              <ul className="m-0 list-none p-0">
                {localRecs.map((word) => (
                  <li key={word} className="m-0 p-0">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleRecClick(word)}
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground w-full rounded-md px-3 py-2 text-left",
                        readOnly && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {word}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground p-1 text-sm">
                No recommendations available
              </div>
            )}
          </div>

          {/* Add custom words input */}
          <div className="mt-2">
            <label className="mb-1 block text-sm font-medium">
              Enter word(s) to freeze
            </label>
            <Textarea
              placeholder="Separate words with commas"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={readOnly}
              className="min-h-[72px]"
            />
            <Button
              className="mt-1 w-full"
              disabled={isFreezeDisabled}
              onClick={handleAddInput}
            >
              Freeze
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1 hidden lg:block" />

        {/* Right panel - Active Frozen Words */}
        <div className="flex flex-1 flex-col">
          <div className="text-sm font-medium">
            Active Frozen Words ({allFrozenWords.length})
          </div>
          <div className="border-border xs:max-h-[100px] mt-1 max-h-[250px] flex-1 overflow-y-auto rounded-md border p-1 md:max-h-[250px]">
            {allFrozenWords.length > 0 ? (
              <ul className="m-0 list-none p-0">
                {allFrozenWords.map((item) => {
                  const isProtected = isProtectedItem(item);
                  return (
                    <li
                      key={item}
                      className={cn(
                        "flex items-center justify-between px-2 py-2",
                        isProtected && "opacity-70",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item}</span>
                        {isProtected && (
                          <Badge
                            variant="outline"
                            className="h-5 px-2 text-[0.65rem]"
                          >
                            Protected
                          </Badge>
                        )}
                      </div>
                      {!readOnly && !isProtected && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFrozen(item)}
                          aria-label="remove"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-muted-foreground p-1 text-sm">
                {readOnly
                  ? "No frozen words"
                  : "Add words to freeze them during paraphrasing"}
              </div>
            )}
          </div>

          {/* Clear user words button */}
          {!readOnly && hasUserFrozenItems && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="mt-1 w-full"
            >
              Clear User Words
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
