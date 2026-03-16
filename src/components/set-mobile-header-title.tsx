"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

/** Call from film detail page so the header shows the stock name on mobile instead of "FilmDB". */
export function SetMobileHeaderTitle({ name }: { name: string }) {
  const { setMobileHeaderTitle } = useMobileHeaderTitle() ?? {};
  useEffect(() => {
    if (!setMobileHeaderTitle) return;
    setMobileHeaderTitle(name);
    return () => setMobileHeaderTitle(null);
  }, [name, setMobileHeaderTitle]);
  return null;
}
