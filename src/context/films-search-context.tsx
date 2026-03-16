"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface FilmsSearchContextValue {
  isSearchFocused: boolean;
  setIsSearchFocused: (v: boolean) => void;
}

const FilmsSearchContext = createContext<FilmsSearchContextValue | null>(null);

export function FilmsSearchProvider({ children }: { children: ReactNode }) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  return (
    <FilmsSearchContext.Provider value={{ isSearchFocused, setIsSearchFocused }}>
      {children}
    </FilmsSearchContext.Provider>
  );
}

export function useFilmsSearch() {
  return useContext(FilmsSearchContext);
}
