"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { FilmBrand } from "@/lib/types";
import type { FilmStock } from "@/lib/types";
import { FILM_TYPE_LABELS } from "@/lib/types";

interface FilmStockListCardProps {
  stock: FilmStock & { brand: FilmBrand };
  priority?: boolean;
}

function specLine(stock: FilmStock): string {
  const typeStr = (FILM_TYPE_LABELS[stock.type] ?? "—").toUpperCase();
  const isoStr = stock.iso != null ? `ISO ${stock.iso}` : "ISO —";
  const formats = stock.format ?? [];
  const formatStr = formats.length ? formats.map((f) => f.toUpperCase()).join(", ") : "—";
  return `${typeStr} | ${isoStr} | ${formatStr}`;
}

/** Full-width list row for search/browse: thumbnail, stock name, type | ISO | format line, chevron. */
export function FilmStockListCard({ stock, priority = false }: FilmStockListCardProps) {
  const { name, slug, image_url, brand } = stock;
  const brandName = brand?.name;

  return (
    <Link
      href={`/films/${slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <div className="flex items-center gap-3 py-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-white">
          {image_url ? (
            <Image
              src={image_url}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority={priority}
              unoptimized={image_url.startsWith("http")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
              {brandName?.charAt(0) ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-base font-semibold text-foreground">{name}</p>
          <p className="truncate font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {specLine(stock)}
          </p>
        </div>
        <div className="shrink-0 pl-1 pr-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      </div>
      {/* Inset divider: line starts where the text column begins (w-16 + gap-3 = 4.75rem) */}
      <div className="ml-[4.75rem] border-b border-border" aria-hidden />
    </Link>
  );
}
