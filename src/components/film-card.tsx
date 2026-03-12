"use client";

import Link from "next/link";
import Image from "next/image";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { Camera, Check, Star } from "lucide-react";
import { useUserActions } from "@/context/user-actions-context";

interface FilmCardProps {
  stock: FilmStock & { brand: FilmBrand };
  /** When true, use Work Sans for the title (e.g. on films listing page). */
  useWorkSansTitle?: boolean;
  /** Slugs of films the user has shot. If not passed, uses context. Shows tick at bottom-left when included. */
  shotSlugs?: string[];
  /** Real average rating from stats (user ratings). When passed, overrides stock.rating on the card. */
  avgRating?: number | null;
}

const TYPE_ACCENT: Record<string, string> = {
  color_negative: "text-amber-700",
  color_reversal: "text-emerald-700",
  bw_negative: "text-zinc-500",
  bw_reversal: "text-zinc-600",
  instant: "text-sky-700",
};

export function FilmCard({
  stock,
  useWorkSansTitle = false,
  shotSlugs: shotSlugsProp,
  avgRating: avgRatingProp,
}: FilmCardProps) {
  const { shotSlugs: contextShotSlugs } = useUserActions();
  const shotSlugs = shotSlugsProp ?? contextShotSlugs;
  const accent = TYPE_ACCENT[stock.type] || TYPE_ACCENT.color_negative;
  const displayName = stock.name;

  const hasShot = shotSlugs?.includes(stock.slug);
  const displayRating = avgRatingProp != null ? avgRatingProp : (stock as { rating?: number }).rating;

  return (
    <div className="group relative block">
      <Link href={`/films/${stock.slug}`} className="block">
        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="bg-white flex items-center justify-center overflow-hidden px-2 py-2 h-36 sm:h-40 relative">
            {stock.discontinued && (
              <span
                className="absolute left-2 top-2 z-10 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                aria-hidden
              >
                Discontinued
              </span>
            )}
            {hasShot && (
              <span
                className="absolute left-2 bottom-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                aria-label="You've shot this stock"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
            {stock.image_url ? (
              <Image
                src={stock.image_url}
                alt={displayName}
                width={200}
                height={112}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-80">
                <Camera className={`h-7 w-7 ${accent}`} />
                <span className={`text-[9px] font-medium ${accent}`}>
                  ISO {stock.iso}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-border/50 px-3 py-3 flex items-center justify-between gap-2 min-w-0 min-h-[3.25rem]">
            <h3
              className={`min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors ${
                useWorkSansTitle ? "font-sans" : "font-advercase"
              }`}
            >
              {displayName}
            </h3>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <Star className="size-[0.875rem] fill-amber-400 text-amber-400" strokeWidth={0} aria-hidden />
              <span className="text-xs font-semibold tracking-tight tabular-nums text-foreground" aria-label={displayRating != null ? `Average rating ${displayRating} out of 5` : "No average rating yet"}>
                {displayRating != null ? displayRating.toFixed(1) : "—"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
