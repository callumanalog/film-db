"use client";

import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import { FilmStockListCardButton } from "@/components/film-stock-list-card";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import {
  mobileHeaderLeadingRowClassName,
  mobileHeaderSafeAreaStyle,
  mobileHeaderShellClassName,
} from "@/lib/mobile-header";
import { cn } from "@/lib/utils";
import type { SearchStocksResult } from "@/app/actions/search";

interface MobileStockPickerPanelProps {
  mode: "review" | "upload";
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelectStock: (stock: SearchStocksResult) => void;
  stocks: SearchStocksResult[];
}

function filterStocks(stocks: SearchStocksResult[], query: string): SearchStocksResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return stocks;
  const words = normalized.split(/\s+/).filter(Boolean);
  return stocks.filter((stock) => {
    const searchable = `${stock.brandName} ${stock.name}`.toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}

export function MobileStockPickerPanel({
  mode,
  query,
  onQueryChange,
  onClose,
  onSelectStock,
  stocks,
}: MobileStockPickerPanelProps) {
  const prompt =
    mode === "upload" ? "Find the film stock you shot..." : "Find a film stock to review...";

  const filteredStocks = useMemo(() => filterStocks(stocks, query), [query, stocks]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden bg-white md:hidden">
      <header
        aria-label="Select film stock"
        className={cn("sticky top-0 z-10", mobileHeaderShellClassName)}
        style={mobileHeaderSafeAreaStyle}
      >
        <div className={mobileHeaderLeadingRowClassName}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className={cn(
              topLeftNavIconButtonClassName,
              "shrink-0 text-muted-foreground hover:text-foreground"
            )}
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </button>
          <h1 className="min-w-0 flex-1 truncate font-sans text-lg font-semibold leading-tight tracking-tight text-foreground">
            Choose your film stock
          </h1>
        </div>
        <div className="px-4 pb-3 pt-3 sm:px-6">
          <SearchPageHeaderForm
            value={query}
            onChange={onQueryChange}
            onClear={() => onQueryChange("")}
            autoFocus
            placeholder={prompt}
            ariaLabel={prompt}
          />
        </div>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white">
        {filteredStocks.length > 0 ? (
          <div
            className="mobile-safe-bottom-clear-bar mx-auto max-w-7xl overflow-x-hidden bg-white px-4"
            style={{ ["--mobile-bottom-clearance" as string]: "4.5rem" }}
          >
            <section aria-label="Film stocks">
              <div className="space-y-0 rounded-card overflow-hidden bg-white">
                {filteredStocks.map((stock) => (
                  <FilmStockListCardButton
                    key={stock.slug}
                    stock={stock}
                    onSelect={() => onSelectStock(stock)}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="px-4 py-16 text-center">
            <p className="font-sans text-base font-semibold text-foreground">No matching film stocks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different stock name or brand.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
