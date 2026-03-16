"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface MobileHeaderTitleContextValue {
  mobileHeaderTitle: string | null;
  setMobileHeaderTitle: (title: string | null) => void;
  mobileHeroMeta: string | null;
  setMobileHeroMeta: (meta: string | null) => void;
}

const MobileHeaderTitleContext = createContext<MobileHeaderTitleContextValue | null>(null);

export function MobileHeaderTitleProvider({ children }: { children: ReactNode }) {
  const [mobileHeaderTitle, setMobileHeaderTitle] = useState<string | null>(null);
  const [mobileHeroMeta, setMobileHeroMeta] = useState<string | null>(null);
  const value: MobileHeaderTitleContextValue = {
    mobileHeaderTitle,
    setMobileHeaderTitle: useCallback((title: string | null) => setMobileHeaderTitle(title), []),
    mobileHeroMeta,
    setMobileHeroMeta: useCallback((meta: string | null) => setMobileHeroMeta(meta), []),
  };
  return (
    <MobileHeaderTitleContext.Provider value={value}>
      {children}
    </MobileHeaderTitleContext.Provider>
  );
}

export function useMobileHeaderTitle() {
  return useContext(MobileHeaderTitleContext);
}
