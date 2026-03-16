"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { SearchListCard } from "@/components/search-list-card";
import type { FilmBrand } from "@/lib/types";
import type {
  SearchShotsResult,
  SearchNotesResult,
  SearchUsersResult,
} from "@/app/actions/search";

type DiscoverTab = "shots" | "notes" | "brands" | "users";

interface DiscoverTabPanelsProps {
  tab: DiscoverTab;
  latestShots: SearchShotsResult[] | null;
  latestNotes: SearchNotesResult[] | null;
  brands: FilmBrand[];
  latestUsers: SearchUsersResult[] | null;
}

export function DiscoverTabPanels({
  tab,
  latestShots,
  latestNotes,
  brands,
  latestUsers,
}: DiscoverTabPanelsProps) {
  if (tab === "shots") {
    const shots = latestShots ?? [];
    return (
      <div className="py-2">
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
      </div>
    );
  }

  if (tab === "notes") {
    const notes = latestNotes ?? [];
    return (
      <div className="py-2">
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
      </div>
    );
  }

  if (tab === "brands") {
    return (
      <div className="py-2">
        <h2 className="text-sm font-semibold text-foreground">Brands</h2>
        <div className="mt-2 space-y-0">
          {brands.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No brands.</p>
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
      </div>
    );
  }

  if (tab === "users") {
    const users = latestUsers ?? [];
    return (
      <div className="py-2">
        <h2 className="text-sm font-semibold text-foreground">Latest users</h2>
        <div className="mt-2 space-y-0">
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
      </div>
    );
  }

  return null;
}
