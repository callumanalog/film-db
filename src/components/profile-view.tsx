"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  ListTodo,
  Star,
  StarHalf,
  Plus,
  NotebookPen,
  ImagePlus,
  ChevronRight,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { FilmCard } from "@/components/film-card";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import type { FilmStock, FilmBrand } from "@/lib/types";
import type { TrackedEntry } from "@/lib/user-store";

type StockWithBrand = FilmStock & { brand: FilmBrand };

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function MiniStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const adjusted = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - adjusted - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: adjusted }).map((_, i) => (
        <Star key={`f-${i}`} className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
      ))}
      {hasHalf && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star className="absolute text-amber-400/30" style={{ width: size, height: size }} />
          <StarHalf className="absolute text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="text-amber-400/30" style={{ width: size, height: size }} />
      ))}
    </div>
  );
}

export interface ProfileData {
  displayName: string;
  shotSlugs: string[];
  favouriteSlugs: string[];
  tracked: TrackedEntry[];
  ratings: Record<string, number>;
  reviewCount?: number;
  uploadCount?: number;
  reviews?: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads?: { id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[];
}

interface ProfileViewProps {
  profile: ProfileData;
  stocksBySlug: Map<string, StockWithBrand>;
  /** Optional map of slug -> stats so cards show real avg rating. */
  statsBySlug?: Record<string, { avgRating: number | null }>;
}

export function ProfileView({ profile, stocksBySlug, statsBySlug = {} }: ProfileViewProps) {
  const shotStocks = profile.shotSlugs.map((s) => stocksBySlug.get(s)).filter(Boolean) as StockWithBrand[];
  const favouriteStocks = profile.favouriteSlugs.map((s) => stocksBySlug.get(s)).filter(Boolean) as StockWithBrand[];
  const ratingsList = Object.entries(profile.ratings).map(([slug, rating]) => ({ slug, rating }));
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!actionsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionsOpen]);

  const stats = [
    { label: "Films shot", value: profile.shotSlugs.length, icon: CheckCircle2 },
    { label: "Shootlist", value: profile.favouriteSlugs.length, icon: Bookmark },
    { label: "Tracked", value: profile.tracked.length, icon: ListTodo },
    { label: "Rated", value: ratingsList.length, icon: Star },
    ...(typeof profile.reviewCount === "number" && profile.reviewCount > 0
      ? [{ label: "Reviews", value: profile.reviewCount, icon: NotebookPen }]
      : []),
    ...(typeof profile.uploadCount === "number" && profile.uploadCount > 0
      ? [{ label: "Uploads", value: profile.uploadCount, icon: ImagePlus }]
      : []),
  ];

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex flex-1 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
            {profile.displayName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight font-advercase">{profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">FilmDB member</p>
          </div>
          {/* Plus icon — top right of left section — dropdown */}
          <div className="absolute right-0 top-0" ref={actionsRef}>
            <button
              type="button"
              onClick={() => setActionsOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              aria-expanded={actionsOpen}
              aria-haspopup="true"
              aria-label="Add or create"
            >
              <Plus className="h-5 w-5" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-border/50 bg-card py-1 shadow-lg">
                <Link
                  href="/films"
                  onClick={() => setActionsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                >
                  <ListTodo className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Track a roll
                </Link>
                <Link
                  href="/films"
                  onClick={() => setActionsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                >
                  <NotebookPen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Write review
                </Link>
                <Link
                  href="/films"
                  onClick={() => setActionsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/50"
                >
                  <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Post a shot
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <FilmDetailTabs
        defaultId="shot"
        tabs={[
          {
            id: "shot",
            label: "I've shot",
            content: (
              <ProfileSection
                title="Films you've shot"
                description="Stocks you've marked as shot. Your ratings and reviews are linked from here."
                emptyMessage={'You haven\'t marked any films as shot yet. Visit a film page and tap "I\'ve shot this".'}
                isEmpty={shotStocks.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {shotStocks.map((stock) => (
                    <FilmCard
                      key={stock.id}
                      stock={stock}
                      useWorkSansTitle
                      shotSlugs={profile.shotSlugs}
                      avgRating={statsBySlug[stock.slug]?.avgRating ?? null}
                    />
                  ))}
                </div>
              </ProfileSection>
            ),
          },
          {
            id: "shootlist",
            label: "Shootlist",
            content: (
              <ProfileSection
                title="Shootlist"
                description="Stocks you've added to your shootlist."
                emptyMessage="No shootlist yet. Add a film on its page with the + button to add it here."
                isEmpty={favouriteStocks.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {favouriteStocks.map((stock) => (
                    <FilmCard
                      key={stock.id}
                      stock={stock}
                      useWorkSansTitle
                      shotSlugs={profile.shotSlugs}
                      avgRating={statsBySlug[stock.slug]?.avgRating ?? null}
                    />
                  ))}
                </div>
              </ProfileSection>
            ),
          },
          {
            id: "tracked",
            label: "Tracked",
            content: (
              <ProfileSection
                title="Tracked"
                description="Film stocks you're tracking. Format, status, expiry and notes from the Track modal."
                emptyMessage="No tracked stocks yet. Open a film page and tap Track to add one."
                isEmpty={profile.tracked.length === 0}
              >
                <ul className="space-y-4">
                  {profile.tracked.map((entry) => {
                    const stock = stocksBySlug.get(entry.slug);
                    if (!stock) return null;
                    return (
                      <li key={entry.slug}>
                        <Link
                          href={`/films/${entry.slug}`}
                          className="block rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                        >
                          <div className="flex flex-wrap items-start gap-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {stock.image_url ? (
                                <Image
                                  src={stock.image_url}
                                  alt=""
                                  width={80}
                                  height={80}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Camera className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground">
                                {stock.name}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                {entry.format && <span>Format: {entry.format}</span>}
                                {entry.status && <span>Status: {entry.status}</span>}
                                {entry.expiryDate && <span>Expiry: {entry.expiryDate}</span>}
                              </div>
                              {entry.notes && (
                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </ProfileSection>
            ),
          },
          {
            id: "ratings",
            label: "My ratings",
            content: (
              <ProfileSection
                title="Your ratings"
                description="Films you've rated. Click through to edit."
                emptyMessage="You haven't rated any films yet."
                isEmpty={ratingsList.length === 0}
              >
                <ul className="space-y-3">
                  {ratingsList.map((r) => {
                    const stock = stocksBySlug.get(r.slug);
                    if (!stock) return null;
                    return (
                      <li key={r.slug}>
                        <Link
                          href={`/films/${r.slug}`}
                          className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {stock.image_url ? (
                              <Image
                                src={stock.image_url}
                                alt=""
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-foreground">
                              {stock.name}
                            </span>
                          </div>
                          <MiniStars rating={r.rating} size={18} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </ProfileSection>
            ),
          },
          ...(typeof profile.reviewCount === "number"
            ? [
                {
                  id: "reviews",
                  label: "Your reviews",
                  content: (
                    <ProfileSection
                      title="Your reviews"
                      description="Reviews you've written. Click through to the film to read or edit."
                      emptyMessage="You haven't written any reviews yet."
                      isEmpty={!profile.reviews || profile.reviews.length === 0}
                    >
                      <ul className="space-y-3">
                        {(profile.reviews ?? []).map((r) => {
                          const stock = stocksBySlug.get(r.film_stock_slug);
                          const stockName = stock?.name ?? r.film_stock_slug;
                          const dateLabel = formatReviewDate(r.created_at);
                          return (
                            <li key={r.id}>
                              <Link
                                href={`/films/${r.film_stock_slug}`}
                                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-foreground">{stockName}</span>
                                  {r.review_title && (
                                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{r.review_title}</p>
                                  )}
                                  <p className="mt-1 text-xs text-muted-foreground">{dateLabel}</p>
                                </div>
                                {r.rating != null && r.rating > 0 && (
                                  <MiniStars rating={r.rating} size={18} />
                                )}
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </ProfileSection>
                  ),
                },
              ]
            : []),
          ...(typeof profile.uploadCount === "number"
            ? [
                {
                  id: "uploads",
                  label: "Your uploads",
                  content: (
                    <ProfileSection
                      title="Your uploads"
                      description="Images you've uploaded for films. Click through to the film page."
                      emptyMessage="You haven't uploaded any images yet."
                      isEmpty={!profile.uploads || profile.uploads.length === 0}
                    >
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {(profile.uploads ?? []).map((u) => {
                          const stock = stocksBySlug.get(u.film_stock_slug);
                          const stockName = stock?.name ?? u.film_stock_slug;
                          return (
                            <Link
                              key={u.id}
                              href={`/films/${u.film_stock_slug}`}
                              className="group overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-primary/30 hover:bg-accent/30"
                            >
                              <div className="relative aspect-[4/3] bg-muted">
                                {u.image_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={u.image_url}
                                    alt={u.caption ?? ""}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <p className="text-xs font-semibold text-foreground line-clamp-1">{stockName}</p>
                                {u.caption && (
                                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{u.caption}</p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </ProfileSection>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}

function ProfileSection({
  title,
  description,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">
        {isEmpty ? (
          <p className="rounded-xl border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
