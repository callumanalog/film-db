"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import {
  searchFilmsByTab,
  type SearchTab,
  type SearchStocksResult,
  type SearchBrandsResult,
  type SearchShotsResult,
  type SearchNotesResult,
  type SearchUsersResult,
} from "@/app/actions/search";

const TABS: SearchTab[] = ["stocks", "shots", "notes", "brands", "users"];

function SearchListSkeleton() {
  return (
    <div className="space-y-0 border-b border-slate-50 [&>div]:border-b [&>div]:border-slate-50">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="h-12 w-12 shrink-0 rounded-md bg-slate-100 animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="mt-1.5 h-3 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-200" />
        </div>
      ))}
    </div>
  );
}

function ShotsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="aspect-[3/4] rounded-md bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function NotesStackSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-card border border-border bg-card p-4">
          <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
          <div className="mt-2 flex items-center gap-2">
            <div className="h-4 w-8 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchListRow({
  href,
  thumb,
  title,
  subMeta,
}: {
  href: string;
  thumb: React.ReactNode;
  title: string;
  subMeta: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-b-0"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {thumb}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subMeta}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

interface MobileSearchResultsProps {
  searchQuery: string;
}

export function MobileSearchResults({ searchQuery }: MobileSearchResultsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: SearchTab = TABS.includes(tabParam as SearchTab)
    ? (tabParam as SearchTab)
    : "stocks";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchFilmsByTab>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchFilmsByTab(searchQuery, activeTab).then((data) => {
      if (!cancelled) {
        setResult(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, activeTab]);

  const summary =
    result?.stocks?.length != null
      ? result.stocks.length
      : result?.brands?.length != null
        ? result.brands.length
        : result?.shots?.length != null
          ? result.shots.length
          : result?.notes?.length != null
            ? result.notes.length
            : result?.users?.length != null
              ? result.users.length
              : 0;

  const tabLabel =
    activeTab === "stocks"
      ? "stocks"
      : activeTab === "shots"
        ? "shots"
        : activeTab === "notes"
          ? "notes"
          : activeTab === "brands"
            ? "brands"
            : "users";

  return (
    <div className="py-2">
      {loading ? (
        <>
          <p className="text-sm text-muted-foreground">
            Searching for <strong>{searchQuery}</strong> in {tabLabel}…
          </p>
          {activeTab === "stocks" || activeTab === "brands" || activeTab === "users" ? (
            <SearchListSkeleton />
          ) : activeTab === "shots" ? (
            <ShotsGridSkeleton />
          ) : (
            <NotesStackSkeleton />
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {summary === 0 ? (
              <>No {tabLabel} match <strong>{searchQuery}</strong></>
            ) : (
              <>Showing {summary} {tabLabel} that match <strong>{searchQuery}</strong></>
            )}
          </p>
          <div className="mt-3">
            {activeTab === "stocks" && result?.stocks && (
              <div className="space-y-0">
                {(result.stocks as SearchStocksResult[]).map((s) => (
                  <SearchListRow
                    key={s.slug}
                    href={`/films/${s.slug}`}
                    thumb={
                      s.imageUrl ? (
                        <Image
                          src={s.imageUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-100" />
                      )
                    }
                    title={s.name}
                    subMeta={[s.iso ? `ISO ${s.iso}` : null, s.type ?? null].filter(Boolean).join(" · ") || s.brandName}
                  />
                ))}
              </div>
            )}
            {activeTab === "brands" && result?.brands && (
              <div className="space-y-0">
                {(result.brands as SearchBrandsResult[]).map((b) => (
                  <SearchListRow
                    key={b.slug}
                    href={`/brands/${b.slug}`}
                    thumb={<div className="h-full w-full bg-slate-100" />}
                    title={b.name}
                    subMeta={b.country ?? "—"}
                  />
                ))}
              </div>
            )}
            {activeTab === "users" && result?.users && (
              <div className="space-y-0">
                {(result.users as SearchUsersResult[]).map((u) => (
                  <SearchListRow
                    key={u.id}
                    href={`/profile/${u.id}`}
                    thumb={
                      <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-200 text-sm font-semibold text-slate-600">
                        {(u.display_name ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                    }
                    title={u.display_name ?? "Unknown"}
                    subMeta={u.handle ?? `@${(u.display_name ?? "").replace(/\s+/g, "_").toLowerCase()}`}
                  />
                ))}
              </div>
            )}
            {activeTab === "shots" && result?.shots && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {(result.shots as SearchShotsResult[]).map((s) => (
                  <Link
                    key={s.id}
                    href={`/films/${s.stockSlug}?shot=${s.id}`}
                    className="block overflow-hidden rounded-md border border-border/50 bg-card"
                  >
                    <div className="relative aspect-[3/4] w-full bg-slate-100">
                      {s.imageUrl ? (
                        <Image
                          src={s.imageUrl}
                          alt={s.caption ?? ""}
                          fill
                          className="object-cover"
                          sizes="50vw"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-100" />
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-xs font-medium text-foreground">
                      {s.stockName}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            {activeTab === "notes" && result?.notes && (
              <div className="space-y-3 pt-2">
                {(result.notes as SearchNotesResult[]).map((n) => (
                  <Link
                    key={n.id}
                    href={`/films/${n.film_stock_slug}#reviews`}
                    className="block rounded-card border border-border bg-card p-4"
                  >
                    <p className="text-sm font-semibold text-foreground line-clamp-2">
                      {n.review_title || "Untitled review"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {n.rating != null && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {n.rating}
                        </span>
                      )}
                      {n.stockName && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                          {n.stockName}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {summary === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results. Try another term or tab.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
