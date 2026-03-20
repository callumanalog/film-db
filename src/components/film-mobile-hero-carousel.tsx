"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeroCarouselSlide } from "@/lib/film-hero-community";

const SWIPE_THRESHOLD_PX = 48;

/** Minimal stock fields for slide 1 (matches FilmImage sizing in hero). */
export type FilmHeroCarouselStock = {
  slug: string;
  name: string;
  image_url: string | null;
};

type BuiltSlide =
  | { kind: "stock"; id: string }
  | { kind: "community"; id: string; photo: HeroCarouselSlide };

function buildSlides(stock: FilmHeroCarouselStock, community: HeroCarouselSlide[]): BuiltSlide[] {
  const out: BuiltSlide[] = [];
  if (stock.image_url?.trim()) {
    out.push({ kind: "stock", id: `${stock.slug}-stock-cover` });
  }
  for (const p of community) {
    out.push({ kind: "community", id: p.id, photo: p });
  }
  return out;
}

export function FilmMobileHeroCarousel({
  stock,
  communityPhotos,
  className,
}: {
  stock: FilmHeroCarouselStock;
  communityPhotos: HeroCarouselSlide[];
  className?: string;
}) {
  const slides = useMemo(() => buildSlides(stock, communityPhotos), [stock, communityPhotos]);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const safeIndex = count ? ((index % count) + count) % count : 0;
  const current = slides[safeIndex];
  const isWide = stock.slug === "cinestill-800t";

  const go = useCallback(
    (dir: -1 | 1) => {
      if (count < 2) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || count < 2) return;
    const end = e.changedTouches[0]?.clientX;
    if (end == null) return;
    const dx = end - start;
    if (dx > SWIPE_THRESHOLD_PX) go(-1);
    else if (dx < -SWIPE_THRESHOLD_PX) go(1);
  };

  if (!current) return null;

  const dotRail =
    count > 1 ? (
      <div
        className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 px-4 pb-1.5"
        role="tablist"
        aria-label="Choose photo"
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === safeIndex}
            aria-label={`Photo ${i + 1} of ${count}`}
            className={cn(
              "pointer-events-auto rounded-full bg-neutral-900/85 shadow-sm ring-1 ring-white/35 transition-all duration-200",
              i === safeIndex ? "h-1.5 w-4 opacity-100" : "h-1.5 w-1.5 opacity-55 hover:opacity-90"
            )}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    ) : null;

  return (
    <div
      className={cn("relative w-full select-none", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Photos — ${stock.name}`}
    >
      <div
        className="relative h-[220px] w-full shrink-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className="absolute inset-y-0 left-0 z-[1] w-[22%] max-w-[120px] cursor-pointer bg-transparent"
              onClick={() => go(-1)}
            />
            <button
              type="button"
              aria-label="Next photo"
              className="absolute inset-y-0 right-0 z-[1] w-[22%] max-w-[120px] cursor-pointer bg-transparent"
              onClick={() => go(1)}
            />
          </>
        )}

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={current.id}
            className={cn(
              "absolute inset-0 flex min-h-0 flex-col",
              current.kind === "stock" ? "bg-white dark:bg-white" : "bg-neutral-950"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* Image area: dots sit on top of the bottom edge (overlay). */}
            <div className="relative min-h-0 flex-1">
              {current.kind === "stock" ? (
                <div className="flex h-full min-h-0 flex-col items-center justify-center px-4 py-4">
                  <div className={isWide ? "h-40 w-48 shrink-0" : "h-48 w-40 shrink-0"}>
                    {stock.image_url ? (
                      <Image
                        src={stock.image_url}
                        alt={stock.name}
                        width={192}
                        height={isWide ? 160 : 192}
                        priority
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Camera className="h-14 w-14 text-muted-foreground/40" aria-hidden />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative h-full min-h-0 w-full bg-neutral-900">
                  <Image
                    src={current.photo.imageUrl}
                    alt={current.photo.alt}
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                    priority={safeIndex === 0}
                  />
                </div>
              )}
              {dotRail}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="sr-only">
        Photo {safeIndex + 1} of {count}.
      </p>
    </div>
  );
}
