import { useCallback, useEffect, useRef, useState } from "react";
import { detectSTEMContent, preprocessText } from "@/services/stemPreprocessor";

export const useSTEMFreeze = ({
  userInput,
  frozenPhrases,
  enabled = true,
  debounceMs = 1000,
}) => {
  const [stemRegions, setStemRegions] = useState([]);
  const [stemStats, setStemStats] = useState({ hasLatex: false, hasCode: false, latexCount: 0, codeBlockCount: 0 });
  const prevFrozenRef = useRef(new Set());
  const timerRef = useRef(null);

  const detectAndFreeze = useCallback(() => {
    if (!enabled || !userInput || userInput.trim().length === 0) {
      setStemRegions([]);
      setStemStats({ hasLatex: false, hasCode: false, latexCount: 0, codeBlockCount: 0 });
      return;
    }

    const detection = detectSTEMContent(userInput);
    setStemStats(detection);

    if (!detection.hasLatex && !detection.hasCode) {
      for (const phrase of prevFrozenRef.current) {
        frozenPhrases.remove(phrase);
      }
      prevFrozenRef.current.clear();
      setStemRegions([]);
      return;
    }

    const result = preprocessText(userInput, {
      excludeLatex: true,
      excludeCode: true,
      excludeReferences: false,
      excludeQuotes: false,
    });

    setStemRegions(result.excludedRegions);

    const newPhrases = new Set();
    for (const region of result.excludedRegions) {
      const content = region.content.trim();
      if (content.length > 0) {
        newPhrases.add(content);
      }
    }

    for (const phrase of prevFrozenRef.current) {
      if (!newPhrases.has(phrase)) {
        frozenPhrases.remove(phrase);
      }
    }

    for (const phrase of newPhrases) {
      if (!frozenPhrases.has(phrase)) {
        frozenPhrases.add(phrase);
      }
    }

    prevFrozenRef.current = newPhrases;
  }, [userInput, enabled, frozenPhrases]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(detectAndFreeze, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [detectAndFreeze, debounceMs]);

  return {
    stemStats,
    stemRegions,
    hasStemContent: stemStats.hasLatex || stemStats.hasCode,
  };
};
