"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

/** Call from film detail page to set nav hero title on mobile (metadata is shown below image). */
export function SetFilmMobileHeader({
  name,
  typeLabel,
  iso,
  format,
}: {
  name: string;
  typeLabel: string;
  iso: number | null;
  format: string[];
}) {
  const ctx = useMobileHeaderTitle();
  useEffect(() => {
    if (!ctx) return;
    ctx.setMobileHeaderTitle(name);
    ctx.setMobileHeroMeta(null); // metadata line moved below image
    return () => {
      ctx.setMobileHeaderTitle(null);
      ctx.setMobileHeroMeta(null);
    };
  }, [name, ctx]);
  return null;
}
