"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

/** Call from film detail page to set nav hero title on mobile (metadata is shown below image). */
export function SetFilmMobileHeader({
  name,
  slug,
  typeLabel,
  iso,
  format,
}: {
  name: string;
  slug: string;
  typeLabel: string;
  iso: number | null;
  format: string[];
}) {
  const ctx = useMobileHeaderTitle();
  useEffect(() => {
    if (!ctx) return;
    ctx.setMobileHeaderTitle(name);
    ctx.setMobileHeroMeta(null);
    ctx.setFilmSlug(slug);
    return () => {
      ctx.setMobileHeaderTitle(null);
      ctx.setMobileHeroMeta(null);
      ctx.setFilmSlug(null);
      ctx.setFilmMobileActiveTab(null);
    };
  }, [name, slug, ctx]);
  return null;
}
