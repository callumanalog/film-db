"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { SearchListCard } from "@/components/search-list-card";
import {
  getTrendingStocks,
  getTrendingBrands,
  getLatestShots,
  getLatestNotes,
  getLatestUsers,
  type SearchTab,
  type SearchStocksResult,
  type SearchBrandsResult,
  type SearchShotsResult,
  type SearchNotesResult,
  type SearchUsersResult,
} from "@/app/actions/search";

const TABS: SearchTab[] = ["stocks", "shots", "notes", "brands", "users"];

export function MobileSearchEmptyState() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: SearchTab = TABS.includes(tabParam as SearchTab)
    ? (tabParam as SearchTab)
    : "stocks";

  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<SearchStocksResult[]>([]);
  const [brands, setBrands] = useState<SearchBrandsResult[]>([]);
  const [shots, setShots] = useState<SearchShotsResult[]>([]);
  const [notes, setNotes] = useState<SearchNotesResult[]>([]);
  const [users, setUsers] = useState<SearchUsersResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getTrendingStocks(),
      getTrendingBrands(),
      getLatestShots(),
      getLatestNotes(),
      getLatestUsers(),
    ]).then(([s, b, sh, n, u]) => {
      if (!cancelled) {
        setStocks(s);
        setBrands(b);
        setShots(sh);
        setNotes(n);
        setUsers(u);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="py-2">
      {loading ? (
        <div className="space-y-0 border-b border-slate-50 [&>div]:border-b [&>div]:border-slate-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="h-16 w-16 shrink-0 rounded-md bg-slate-100 animate-pulse" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                <div className="mt-1.5 h-3 w-16 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === "stocks" && (
            <>
              <h2 className="text-sm font-semibold text-foreground">Trending film stocks</h2>
              <div className="mt-2 space-y-0 border-b border-slate-50">
                {stocks.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No trending stocks.</p>
                ) : (
                  stocks.map((s) => (
                    <SearchListCard
                      key={s.slug}
                      href={`/films/${s.slug}`}
                      thumb={
                        s.imageUrl ? (
                          <Image
                            src={s.imageUrl}
                            alt=""
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-100" />
                        )
                      }
                      title={s.name}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "shots" && (
            <>
              <h2 className="text-sm font-semibold text-foreground">Latest shots</h2>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {shots.length === 0 ? (
                  <p className="col-span-2 py-4 text-sm text-muted-foreground">No shots yet.</p>
                ) : (
                  shots.map((s) => (
                    <Link
                      key={s.id}
                      href={`/films/${s.stockSlug}?shot=${s.id}`}
                      className="block overflow-hidden rounded-md border border-border/50 bg-card"
                    >
                      <div className="relative aspect-[3/4] w-full bg-slate-100">
                        {s.imageUrl ? (
                          <Image
                            src={s.imageUrl}
                            alt={s.stockName ?? "Shot"}
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
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <>
              <h2 className="text-sm font-semibold text-foreground">Latest notes</h2>
              <div className="mt-2 space-y-3">
                {notes.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  notes.map((n) => (
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
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "brands" && (
            <>
              <h2 className="text-sm font-semibold text-foreground">Trending brands</h2>
              <div className="mt-2 space-y-0 border-b border-slate-50">
                {brands.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No trending brands.</p>
                ) : (
                  brands.map((b) => (
                    <SearchListCard
                      key={b.slug}
                      href={`/brands/${b.slug}`}
                      thumb={<div className="h-full w-full bg-slate-100" />}
                      title={b.name}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "users" && (
            <>
              <h2 className="text-sm font-semibold text-foreground">Latest users</h2>
              <div className="mt-2 space-y-0 border-b border-slate-50">
                {users.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No users yet.</p>
                ) : (
                  users.map((u) => (
                    <SearchListCard
                      key={u.id}
                      href={`/profile/${u.id}`}
                      thumb={
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-200 text-sm font-semibold text-slate-600">
                          {(u.display_name ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                      }
                      title={u.display_name ?? "Unknown"}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
