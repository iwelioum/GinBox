// useSearchHistory.ts — localStorage-backed recent search history (5 items max).
// Deduplicates entries, most recent first.

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sokoul_search_history';
const MAX_ITEMS   = 5;

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(readStorage);

  const addEntry = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, MAX_ITEMS);
      writeStorage(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((term: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== term);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory } as const;
}
