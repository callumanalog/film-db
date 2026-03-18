"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Plus } from "lucide-react";
import type { FilmBrand, FilmStock, FilmType } from "@/lib/types";
import { FILM_TYPE_LABELS } from "@/lib/types";
import type { SearchStocksResult } from "@/app/actions/search";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

function buildSpecLine(type?: string, iso?: number | null, format?: string[]): string {
  const typeStr = type
    ? (FILM_TYPE_LABELS[type as FilmType] ?? "—").toUpperCase()
    : "—";
  const isoStr = iso != null ? `ISO ${iso}` : "ISO —";
  const formats = format ?? [];
  const formatStr = formats.length ? formats.map((f) => f.toUpperCase()).join(", ") : "—";
  return `${typeStr} | ${isoStr} | ${formatStr}`;
}

type ListCardIcon = "chevron" | "plus";

interface FilmStockListCardBaseProps {
  name: string;
  imageUrl?: string | null;
  brandInitial?: string;
  specLine: string;
  priority?: boolean;
  icon?: ListCardIcon;
}

function FilmStockListCardInner({
  name,
  imageUrl,
  brandInitial,
  specLine,
  priority = false,
  icon = "chevron",
}: FilmStockListCardBaseProps) {
  const ActionIcon = icon === "plus" ? Plus : ChevronRight;
  return (
    <>
      <div className="flex items-center gap-3 py-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={64}
              height={64}
              sizes="64px"
              className="h-full w-full object-contain"
              priority={priority}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              unoptimized={imageUrl.startsWith("http")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
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
        <div className="shrink-0 pl-1 pr-2">
          <ActionIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      </div>
      <div className="ml-[4.75rem] border-b border-border" aria-hidden />
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
      <FilmStockListCardInner
        name={stock.name}
        imageUrl={stock.image_url}
        brandInitial={stock.brand?.name?.charAt(0)}
        specLine={buildSpecLine(stock.type, stock.iso, stock.format)}
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
      <FilmStockListCardInner
        name={stock.name}
        imageUrl={stock.imageUrl}
        brandInitial={stock.brandName?.charAt(0)}
        specLine={buildSpecLine(stock.type, stock.iso, stock.format)}
        icon="plus"
      />
    </button>
  );
}
