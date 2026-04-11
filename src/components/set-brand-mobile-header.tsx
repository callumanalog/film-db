"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

/** Sets compact nav title on mobile for brand detail (no film follow / more actions). */
export function SetBrandMobileHeader({ name }: { name: string }) {
  const ctx = useMobileHeaderTitle();
  useEffect(() => {
    if (!ctx) return;
    ctx.setMobileHeaderTitle(name);
    ctx.setMobileHeroMeta(null);
    ctx.setFilmSlug(null);
    ctx.setTitleScrolledPast(false);
    return () => {
      ctx.setMobileHeaderTitle(null);
      ctx.setMobileHeroMeta(null);
      ctx.setFilmSlug(null);
      ctx.setTitleScrolledPast(false);
    };
  }, [name, ctx]);
  return null;
}
