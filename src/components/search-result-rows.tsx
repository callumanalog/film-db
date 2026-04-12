"use client";

import Link from "next/link";
import { Camera as CameraIcon } from "lucide-react";
import { FilmStockSummaryRow } from "@/components/film-stock-list-card";
import { buildFilmStockTypeSpecLine } from "@/lib/film-stock-spec-line";
import type { SearchCamerasResult, SearchStocksResult } from "@/app/actions/search";

export function cleanCameraName(camera: SearchCamerasResult): string {
  const raw = camera.name.trim();
  const brand = camera.brandName.trim();
  if (!raw) return brand || "Camera";
  if (!brand) return raw;
  const rawLower = raw.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (rawLower.startsWith(`${brandLower} `)) return raw;
  return `${brand} ${raw}`;
}

/** Avoid "Kodak Kodak Portra 400" when catalog `name` already includes the brand. */
export function cleanStockDisplayName(stock: Pick<SearchStocksResult, "brandName" | "name">): string {
  const raw = stock.name.trim();
  const brand = stock.brandName.trim();
  if (!raw) return brand || "Film stock";
  if (!brand) return raw;
  const rawLower = raw.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (rawLower === brandLower || rawLower.startsWith(`${brandLower} `)) return raw;
  return `${brand} ${raw}`.trim();
}

export function StockSearchRow({
  stock,
  hideTrailing = false,
}: {
  stock: SearchStocksResult;
  /** When true, omit the chevron (e.g. brand detail lists). */
  hideTrailing?: boolean;
}) {
  return (
    <Link
      href={`/films/${stock.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={stock.name}
        imageUrl={stock.imageUrl}
        brandInitial={stock.brandName?.charAt(0)}
        specLine={buildFilmStockTypeSpecLine(stock.type, stock.iso, stock.format)}
        showDivider={false}
        hideTrailing={hideTrailing}
      />
    </Link>
  );
}

export function CameraSearchRow({
  camera,
  hideTrailing = false,
}: {
  camera: SearchCamerasResult;
  hideTrailing?: boolean;
}) {
  return (
    <Link
      href={`/cameras/${camera.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={cleanCameraName(camera)}
        specLine="CAMERA"
        showDivider={false}
        hideTrailing={hideTrailing}
        customThumb={
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <CameraIcon className="h-5 w-5" aria-hidden />
          </div>
        }
      />
    </Link>
  );
}
