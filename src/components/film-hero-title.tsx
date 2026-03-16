"use client";

import { useEffect, useRef } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

/** Metadata line: TYPE LABEL | ISO N | FORMAT1, FORMAT2 (uppercase) */
function formatMeta(typeLabel: string, iso: number | null, format: string[]) {
  const isoStr = iso != null ? `ISO ${iso}` : "ISO —";
  const formatStr = format.length ? format.map((f) => f.toUpperCase()).join(", ") : "—";
  return `${(typeLabel ?? "—").toUpperCase()} | ${isoStr} | ${formatStr}`;
}

interface FilmHeroTitleProps {
  name: string;
  typeLabel: string;
  iso: number | null;
  format: string[];
}

export function FilmHeroTitle({ name, typeLabel, iso, format }: FilmHeroTitleProps) {
  const ref = useRef<HTMLElement>(null);
  const { setNavTitleVisible } = useMobileHeaderTitle() ?? {};

  useEffect(() => {
    const el = ref.current;
    const setVisible = setNavTitleVisible;
    if (!el || !setVisible) return;
    setVisible(false); // reset when hero mounts (e.g. navigated to film page)
    const observer = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (e) setVisible(!e.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -1px 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      setVisible(false);
    };
  }, [setNavTitleVisible]);

  const meta = formatMeta(typeLabel, iso, format);

  return (
    <header
      ref={ref}
      className="w-full bg-white px-4 py-4 text-center md:hidden sm:px-6"
      data-film-hero-title
    >
      <h1 className="font-advercase text-3xl font-bold tracking-tight">{name}</h1>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {meta}
      </p>
    </header>
  );
}
