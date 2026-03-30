"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { StockListFilmRow } from "@/app/actions/stock-lists";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import { cn } from "@/lib/utils";

export function FilmStockListsAllClient({
  filmSlug,
  stockName,
  rows,
}: {
  filmSlug: string;
  stockName: string;
  rows: StockListFilmRow[];
}) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-white dark:bg-background">
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-white dark:bg-background"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center px-4 pb-2 pt-2 sm:px-6">
          <Link
            href={`/films/${filmSlug}`}
            className={topLeftNavIconButtonClassName}
            aria-label="Back to film"
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </Link>
        </div>
        <div className="px-4 pb-4 pt-0 sm:px-6">
          <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground md:text-[1.75rem]">
            Lists with {stockName}
          </h1>
          <span className="mt-1 block font-sans text-[10px] font-medium uppercase leading-tight tracking-wider text-muted-foreground">
            {rows.length} {rows.length === 1 ? "list" : "lists"}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-4 pb-24 pt-0 sm:px-6 md:pb-8">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No lists yet.</p>
        ) : (
          <ul className={cn("flex flex-col divide-y divide-border/50 border-y border-border/50")}>
            {rows.map((r) => (
              <li key={r.listId}>
                <Link
                  href={`/lists/${r.listId}`}
                  className="flex flex-col gap-0.5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <span className="font-sans text-sm font-semibold text-foreground">{r.title}</span>
                  <span className="text-xs text-muted-foreground">by {r.ownerDisplayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
