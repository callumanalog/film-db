"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

/** Sets the mobile nav title to the vibe name (back + centered h1 style). */
export function SetVibeMobileHeader({ label }: { label: string }) {
  const ctx = useMobileHeaderTitle();
  useEffect(() => {
    if (!ctx) return;
    ctx.setMobileHeaderTitle(label);
    ctx.setMobileHeroMeta(null);
    return () => {
      ctx.setMobileHeaderTitle(null);
      ctx.setMobileHeroMeta(null);
    };
  }, [label, ctx]);
  return null;
}
