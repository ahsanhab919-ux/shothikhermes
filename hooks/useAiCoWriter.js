"use client";

import { useState, useCallback, useRef } from "react";

export function useAiCoWriter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const generate = useCallback(
    async ({ currentText, context = "", mode = "autocomplete", instruction = "" }) => {
      abort();

      if (!currentText && !instruction) {
        setError("Please provide text or an instruction");
        return "";
      }

      setIsGenerating(true);
      setStreamedText("");
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let fullText = "";

      try {
        const response = await fetch("/api/ai-cowriter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentText, context, mode, instruction }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.done) break;
              if (data.content) {
                fullText += data.content;
                setStreamedText(fullText);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes("JSON")) {
                throw parseErr;
              }
            }
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return fullText;
        }
        const msg = err.message || "AI generation failed";
        setError(msg);
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }

      return fullText;
    },
    [abort]
  );

  const reset = useCallback(() => {
    abort();
    setStreamedText("");
    setError(null);
  }, [abort]);

  return {
    generate,
    abort,
    reset,
    isGenerating,
    streamedText,
    error,
  };
}
