"use client";

import Link from "next/link";
import Image from "next/image";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { Camera } from "lucide-react";

interface FilmCardProps {
  stock: FilmStock & { brand: FilmBrand };
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
  priority = false,
}: FilmCardProps) {
  const accent = TYPE_ACCENT[stock.type] || TYPE_ACCENT.color_negative;
  const displayName = stock.name;

  return (
    <div className="group relative block">
      <Link href={`/films/${stock.slug}`} className="block">
        {/* Image card: square, 7px corners */}
        <div className="relative aspect-square w-full overflow-hidden rounded-card border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="flex h-full w-full items-center justify-center bg-white p-2 relative">
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
                height={200}
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
        </div>
        {/* Title below the card */}
        <div className="mt-2 flex min-w-0 px-0.5">
          <h3 className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground font-sans transition-colors group-hover:text-primary">
            {displayName}
          </h3>
        </div>
      </Link>
    </div>
  );
}
