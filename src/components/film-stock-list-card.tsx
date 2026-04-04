"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { FilmBrand, FilmStock } from "@/lib/types";
import type { SearchStocksResult } from "@/app/actions/search";
import { buildFilmStockTypeSpecLine } from "@/lib/film-stock-spec-line";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

export interface FilmStockSummaryRowProps {
  name: string;
  imageUrl?: string | null;
  brandInitial?: string;
  specLine: string;
  priority?: boolean;
  /** Hide chevron (e.g. lightbox @ stock row). */
  hideTrailing?: boolean;
  /** Bottom divider under row (list cards only). */
  showDivider?: boolean;
  /** `sm` = 32px thumb (lightbox); default 64px list row. */
  thumbSize?: "sm" | "md";
}

/** Shared thumbnail + title + spec line (list cards, lightbox stock row). */
export function FilmStockSummaryRow({
  name,
  imageUrl,
  brandInitial,
  specLine,
  priority = false,
  hideTrailing = false,
  showDivider = true,
  thumbSize = "md",
}: FilmStockSummaryRowProps) {
  const thumbPx = thumbSize === "sm" ? 32 : 64;
  const thumbBox = thumbSize === "sm" ? "h-8 w-8" : "h-16 w-16";
  const initialText =
    thumbSize === "sm" ? "text-[9px] font-medium" : "text-xs font-medium";

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        <div
          className={`${thumbBox} shrink-0 overflow-hidden rounded-md border border-border bg-white`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={thumbPx}
              height={thumbPx}
              sizes={`${thumbPx}px`}
              className="h-full w-full object-contain"
              priority={priority}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              unoptimized={imageUrl.startsWith("http")}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center text-muted-foreground ${initialText}`}
            >
              {brandInitial ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-base font-semibold text-foreground">{name}</p>
          <p className="truncate font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {specLine}
          </p>
        </div>
        {!hideTrailing ? (
          <div className="shrink-0 pl-1 pr-2">
            <ChevronRight className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
        ) : null}
      </div>
      {showDivider ? <div className="ml-[4.75rem] border-b border-border" aria-hidden /> : null}
    </>
  );
}

interface FilmStockListCardProps {
  stock: FilmStock & { brand: FilmBrand };
  priority?: boolean;
}

/** Link-based list card for the search/browse page. */
export function FilmStockListCard({ stock, priority = false }: FilmStockListCardProps) {
  return (
    <Link
      href={`/films/${stock.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={stock.name}
        imageUrl={stock.image_url}
        brandInitial={stock.brand?.name?.charAt(0)}
        specLine={buildFilmStockTypeSpecLine(stock.type, stock.iso, stock.format)}
        priority={priority}
      />
    </Link>
  );
}

interface FilmStockListCardButtonProps {
  stock: SearchStocksResult;
  onSelect: (slug: string) => void;
}

/** Button-based list card for drawers/modals where tapping selects the stock. */
export function FilmStockListCardButton({ stock, onSelect }: FilmStockListCardButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(stock.slug)}
      className="flex w-full flex-col bg-white text-left transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={stock.name}
        imageUrl={stock.imageUrl}
        brandInitial={stock.brandName?.charAt(0)}
        specLine={buildFilmStockTypeSpecLine(stock.type, stock.iso, stock.format)}
      />
    </button>
  );
}
