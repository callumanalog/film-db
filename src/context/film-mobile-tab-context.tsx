"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type FilmMobileTab = "overview" | "scans" | "reviews" | "lists";

interface FilmMobileTabContextValue {
  activeTab: FilmMobileTab;
  setActiveTab: (tab: FilmMobileTab) => void;
}

const FilmMobileTabContext = createContext<FilmMobileTabContextValue | null>(null);

export function useFilmMobileTab() {
  return useContext(FilmMobileTabContext);
}

export function FilmMobileTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<FilmMobileTab>("overview");

  return (
    <FilmMobileTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </FilmMobileTabContext.Provider>
  );
}
