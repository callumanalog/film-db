"use client";

import { useEffect } from "react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";

export function SetImageDestinationMobileHeader({
  title,
  filmSlug,
  observeElementId,
}: {
  title: string;
  filmSlug: string;
  observeElementId: string;
}) {
  const ctx = useMobileHeaderTitle();

  useEffect(() => {
    if (!ctx) return;
    ctx.setMobileHeaderTitle(title);
    ctx.setFilmSlug(filmSlug);
    ctx.setTitleScrolledPast(false);
    return () => {
      ctx.setMobileHeaderTitle(null);
      ctx.setFilmSlug(null);
      ctx.setTitleScrolledPast(false);
    };
  }, [ctx, title, filmSlug]);

  useEffect(() => {
    if (!ctx) return;
    const el = document.getElementById(observeElementId);
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      // Match film-detail intent: once title scrolls up under the header row, collapse title into nav.
      ctx.setTitleScrolledPast(rect.top <= 44);
    };

    const observer = new IntersectionObserver(() => {
      compute();
    }, { threshold: 0, rootMargin: "-44px 0px 0px 0px" });

    compute();
    observer.observe(el);
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [ctx, observeElementId]);

  return null;
}
