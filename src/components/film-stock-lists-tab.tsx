"use client";

import Link from "next/link";
import type { StockListFilmRow } from "@/app/actions/stock-lists";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function FilmStockListsTab({
  filmSlug,
  rows,
  hasMore,
}: {
  filmSlug: string;
  rows: readonly StockListFilmRow[];
  hasMore: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">No lists include this stock yet.</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <ul className="flex flex-col divide-y divide-border/50 border-y border-border/50">
        {rows.map((r) => (
          <li key={r.listId}>
            <Link
              href={`/lists/${r.listId}`}
              className="flex items-center gap-3 py-3.5 pr-1 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-semibold text-foreground">{r.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">by {r.ownerDisplayName}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <Link
          href={`/films/${filmSlug}/lists`}
          className={cn(
            "mt-4 flex w-full items-center justify-center rounded-full border border-border/70 py-3 text-sm font-medium text-primary",
            "transition-colors hover:bg-muted/50"
          )}
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}
