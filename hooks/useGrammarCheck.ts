"use client";

import { useState, useCallback } from "react";
import { checkGrammar, applyCorrection, applyAllCorrections } from "@/lib/tools/grammar/api";
import { GrammarCheckResult, GrammarIssue } from "@/lib/tools/grammar/types";

interface UseGrammarCheckOptions {
  onSuccess?: (result: GrammarCheckResult) => void;
  onError?: (error: Error) => void;
}

export function useGrammarCheck(options: UseGrammarCheckOptions = {}) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<GrammarCheckResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(
    async (text: string, language?: string) => {
      setIsChecking(true);
      setError(null);

      try {
        const result = await checkGrammar({ text, language });
        setResult(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsChecking(false);
      }
    },
    [options]
  );

  const applySingleCorrection = useCallback(
    async (issue: GrammarIssue) => {
      if (!result) return;

      const correctedText = await applyCorrection(result.text, {
        startIndex: issue.startIndex,
        endIndex: issue.endIndex,
        suggestion: issue.suggestion,
      });

      // Remove applied issue from result
      setResult({
        ...result,
        text: correctedText,
        issues: result.issues.filter((i) => i.id !== issue.id),
      });

      return correctedText;
    },
    [result]
  );

  const applyAll = useCallback(async () => {
    if (!result) return;

    const correctedText = await applyAllCorrections(
      result.text,
      result.issues.map((i) => ({
        startIndex: i.startIndex,
        endIndex: i.endIndex,
        suggestion: i.suggestion,
      }))
    );

    setResult({
      ...result,
      text: correctedText,
      issues: [],
    });

    return correctedText;
  }, [result]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    check,
    applySingleCorrection,
    applyAll,
    reset,
    isChecking,
    result,
    error,
  };
}
