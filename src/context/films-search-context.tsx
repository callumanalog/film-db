"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const RECENT_SEARCHES_KEY = "film-db-recent-searches";
const MAX_RECENT = 10;

interface FilmsSearchContextValue {
  isSearchFocused: boolean;
  setIsSearchFocused: (v: boolean) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

const FilmsSearchContext = createContext<FilmsSearchContextValue | null>(null);

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(list: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

export function FilmsSearchProvider({ children }: { children: ReactNode }) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const addRecentSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  const value: FilmsSearchContextValue = {
    isSearchFocused,
    setIsSearchFocused,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };

  return (
    <FilmsSearchContext.Provider value={value}>
      {children}
    </FilmsSearchContext.Provider>
  );
}

export function useFilmsSearch() {
  return useContext(FilmsSearchContext);
}
