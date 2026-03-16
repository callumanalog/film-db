"use client";

import Link from "next/link";
import Image from "next/image";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { Camera } from "lucide-react";

interface FilmCardProps {
  stock: FilmStock & { brand: FilmBrand };
  /** Preload image for LCP (e.g. first row on films list). */
  priority?: boolean;
  /** Optional badge, e.g. "Budget" for budget-friendly carousel. */
  badge?: "budget";
  /** Compact variant: smaller title (text-xs), for Budget carousel. */
  compact?: boolean;
}

const TYPE_ACCENT: Record<string, string> = {
  color_negative: "text-amber-700",
  color_reversal: "text-emerald-700",
  bw_negative: "text-zinc-500",
  bw_reversal: "text-zinc-600",
  instant: "text-sky-700",
};

const CARD_IMAGE_SIZES = "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw";

/** Low-resolution blur placeholder (10x10 gray) so layout doesn't jump when image loads. */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

export function FilmCard({
  stock,
  priority = false,
  badge,
  compact = false,
}: FilmCardProps) {
  const accent = TYPE_ACCENT[stock.type] || TYPE_ACCENT.color_negative;
  const displayName = stock.name;

  return (
    <div className="group relative block">
      <Link href={`/films/${stock.slug}`} className="block">
        {/* Image card: square, 7px corners */}
        <div className="relative aspect-square w-full overflow-hidden rounded-card border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          {!compact && badge === "budget" && (
            <span className="absolute left-1.5 top-1.5 z-10 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Budget
            </span>
          )}
          <div className="flex h-full w-full items-center justify-center bg-white p-2 relative">
            {stock.image_url ? (
              <Image
                src={stock.image_url}
                alt={displayName}
                width={200}
                height={200}
                sizes={CARD_IMAGE_SIZES}
                priority={priority}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
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
          <h3
            className={`m-0 min-w-0 truncate font-semibold leading-tight text-foreground font-sans transition-colors group-hover:text-primary ${compact ? "text-xs" : "text-sm"}`}
          >
            {displayName}
          </h3>
        </div>
      </Link>
    </div>
  );
}
