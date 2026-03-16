"use client";

import Link from "next/link";
import Image from "next/image";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { Camera, CircleCheck } from "lucide-react";
import { useUserActions } from "@/context/user-actions-context";

interface FilmCardProps {
  stock: FilmStock & { brand: FilmBrand };
  /** Slugs of films the user has shot. If not passed, uses context. Shows tick at bottom-left when included. */
  shotSlugs?: string[];
  /** Preload image for LCP (e.g. first row on films list). */
  priority?: boolean;
}

const TYPE_ACCENT: Record<string, string> = {
  color_negative: "text-amber-700",
  color_reversal: "text-emerald-700",
  bw_negative: "text-zinc-500",
  bw_reversal: "text-zinc-600",
  instant: "text-sky-700",
};

const CARD_IMAGE_SIZES = "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw";

export function FilmCard({
  stock,
  shotSlugs: shotSlugsProp,
  priority = false,
}: FilmCardProps) {
  const { shotSlugs: contextShotSlugs } = useUserActions();
  const shotSlugs = shotSlugsProp ?? contextShotSlugs;
  const accent = TYPE_ACCENT[stock.type] || TYPE_ACCENT.color_negative;
  const displayName = stock.name;

  const hasShot = shotSlugs?.includes(stock.slug);

  return (
    <div className="group relative block">
      <Link href={`/films/${stock.slug}`} className="block">
        <div className="relative overflow-hidden rounded-card border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="bg-white flex items-center justify-center overflow-hidden px-2 py-2 h-36 sm:h-40 relative">
            {stock.discontinued && (
              <span
                className="absolute left-2 top-2 z-10 inline-flex rounded-full px-2.5 py-1 text-label font-semibold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                aria-hidden
              >
                Discontinued
              </span>
            )}
            {stock.image_url ? (
              <Image
                src={stock.image_url}
                alt={displayName}
                width={200}
                height={112}
                sizes={CARD_IMAGE_SIZES}
                priority={priority}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-80">
                <Camera className={`h-7 w-7 ${accent}`} />
                <span className={`text-tiny font-medium ${accent}`}>
                  ISO {stock.iso}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 px-3 py-3 flex flex-col gap-1 min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <h3
                className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors font-sans"
              >
                {displayName}
              </h3>
              {hasShot && (
                <CircleCheck
                  className="size-4 shrink-0 text-primary"
                  strokeWidth={2}
                  aria-label="You've shot this stock"
                />
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
