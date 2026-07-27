"use client";

import { useCallback, useEffect, useState } from "react";

export interface ScanHistoryEntry {
  id: string;
  score: number;
  riskLevel: string;
  wordCount: number;
  textPreview: string;
  analyzedAt: string;
  matchCount: number;
}

const STORAGE_KEY = "shothik:plagiarism:scan-history";
const MAX_ENTRIES = 10;

function loadHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveHistory(entries: ScanHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage full or unavailable
  }
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addEntry = useCallback(
    (entry: Omit<ScanHistoryEntry, "id">) => {
      const newEntry: ScanHistoryEntry = {
        ...entry,
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      setHistory((prev) => {
        const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(next);
        return next;
      });
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { history, addEntry, clearHistory };
}
