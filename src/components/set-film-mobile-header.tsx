"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

function formatMeta(typeLabel: string, iso: number | null, format: string[]) {
  const isoStr = iso != null ? `ISO ${iso}` : "ISO —";
  const formatStr = format.length ? format.map((f) => f.toUpperCase()).join(", ") : "—";
  return `${(typeLabel ?? "—").toUpperCase()} | ${isoStr} | ${formatStr}`;
}

/** Call from film detail page to set nav hero title + metadata on mobile. */
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
    ctx.setMobileHeroMeta(formatMeta(typeLabel, iso, format));
    return () => {
      ctx.setMobileHeaderTitle(null);
      ctx.setMobileHeroMeta(null);
    };
  }, [name, typeLabel, iso, ctx, format.join(",")]);
  return null;
}
