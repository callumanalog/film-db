"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

const ROW_HEIGHT_ESTIMATE = 280;
const COLS_SM = 2;
const COLS_MD = 5;

interface VirtualizedFilmGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  emptyMessage?: string;
  statsBySlug?: Record<string, { avgRating: number | null }>;
  filterPaneOpen?: boolean;
  /** Min number of stocks before virtualization kicks in. Below this, render normal grid. */
  minLengthToVirtualize?: number;
}

export function VirtualizedFilmGrid({
  stocks,
  emptyMessage = "No film stocks found matching your filters.",
  statsBySlug,
  filterPaneOpen = false,
  minLengthToVirtualize = 24,
}: VirtualizedFilmGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(COLS_MD);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setColumns(mq.matches ? (filterPaneOpen ? 4 : COLS_MD) : COLS_SM);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [filterPaneOpen]);

  const rows = useMemo(() => {
    const r: (FilmStock & { brand: FilmBrand })[][] = [];
    for (let i = 0; i < stocks.length; i += columns) {
      r.push(stocks.slice(i, i + columns));
    }
    return r;
  }, [stocks, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 2,
  });

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  if (stocks.length < minLengthToVirtualize) {
    return (
      <div
        className={
          filterPaneOpen
            ? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6"
            : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5"
        }
      >
        {stocks.map((stock, index) => (
          <FilmCard key={stock.id} stock={stock} priority={index < 6} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[70vh] overflow-auto rounded-card"
      style={{ contain: "strict" }}
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowStocks = rows[virtualRow.index] ?? [];
          return (
            <div
              key={virtualRow.key}
              className={`absolute left-0 top-0 grid w-full gap-3 sm:gap-4 md:gap-6 ${filterPaneOpen ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-5"}`}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowStocks.map((stock, i) => (
                <FilmCard
                  key={stock.id}
                  stock={stock}
                  priority={virtualRow.index === 0 && i < 6}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
