"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Camera,
  Star,
  StarHalf,
  ChevronRight,
} from "lucide-react";
import { FilmCard } from "@/components/film-card";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import type { FilmStock, FilmBrand } from "@/lib/types";
import type { TrackedEntry } from "@/lib/user-store";
import type { LoggedRollEntry } from "@/app/actions/user-actions";
import { LoggedRollMenu } from "@/components/logged-roll-menu";

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
  loggedRolls?: LoggedRollEntry[];
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

const ROLLS_STATUS_OPTIONS: { value: "all" | "in_fridge" | "in_camera" | "awaiting_dev" | "at_lab"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_fridge", label: "In Fridge" },
  { value: "in_camera", label: "In Camera" },
  { value: "awaiting_dev", label: "Processing" },
  { value: "at_lab", label: "Scanned" },
];

export function ProfileView({ profile, stocksBySlug, statsBySlug = {} }: ProfileViewProps) {
  const loggedRolls = profile.loggedRolls ?? [];
  const [rollsStatusFilter, setRollsStatusFilter] = useState<"all" | "in_fridge" | "in_camera" | "awaiting_dev" | "at_lab">("all");
  const filteredRolls =
    rollsStatusFilter === "all"
      ? loggedRolls
      : loggedRolls.filter((e) => e.status === rollsStatusFilter);

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
          {profile.displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight font-advercase">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">FilmDB member</p>
        </div>
      </div>

      {/* Tabs */}
      <FilmDetailTabs
        defaultId="rolls"
        tabs={[
          {
            id: "rolls",
            label: "Rolls",
            content: (
              <ProfileSection
                emptyMessage="No rolls yet. Open a film page and tap Log a roll to add one."
                isEmpty={loggedRolls.length === 0}
              >
                {loggedRolls.length > 0 && (
                  <>
                    <div className="mb-4 flex w-full overflow-hidden rounded-[7px] border border-slate-200 bg-background p-0.5">
                      {ROLLS_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRollsStatusFilter(opt.value)}
                          className={cn(
                            "flex-1 px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                            rollsStatusFilter === opt.value
                              ? "rounded-md bg-white text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {filteredRolls.length > 0 ? (
                      <ul className="space-y-4">
                        {filteredRolls.map((entry) => {
                          const stock = stocksBySlug.get(entry.film_stock_slug);
                          if (!stock) return null;
                          return (
                            <li key={entry.id}>
                              <div className="flex items-start gap-2 rounded-[7px] border border-border/50 bg-white p-4 transition-colors hover:border-primary/30 hover:bg-white">
                                <Link
                                  href={`/films/${entry.film_stock_slug}?tab=rolls`}
                                  className="min-w-0 flex-1"
                                >
                                  <div className="flex flex-wrap items-start gap-4">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-card bg-white">
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
                                        {entry.expiry_date && <span>Expiry: {entry.expiry_date}</span>}
                                        {entry.quantity > 1 && <span>Qty: {entry.quantity}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                                <LoggedRollMenu rollId={entry.id} filmSlug={entry.film_stock_slug} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                        No rolls in this status.
                      </p>
                    )}
                  </>
                )}
              </ProfileSection>
            ),
          },
          ...(typeof profile.uploadCount === "number"
            ? [
                {
                  id: "shots",
                  label: "Shots",
                  content: (
                    <ProfileSection
                      title="Shots"
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
                              className="group overflow-hidden rounded-[7px] border border-border/50 bg-card transition-colors hover:border-primary/30 hover:bg-accent/30"
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
          ...(typeof profile.reviewCount === "number"
            ? [
                {
                  id: "notes",
                  label: "Notes",
                  content: (
                    <ProfileSection
                      title="Notes"
                      description="Notes you've written. Click through to the film to read or edit."
                      emptyMessage="You haven't written any notes yet."
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
                                className="flex items-center gap-4 rounded-[7px] border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
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
  title?: string;
  description?: string;
  emptyMessage: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}) {
  const showHeader = title != null && title !== "" || description != null && description !== "";
  return (
    <div>
      {showHeader && (
        <>
          {title != null && title !== "" && (
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          )}
          {description != null && description !== "" && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </>
      )}
      <div className={showHeader ? "mt-6" : ""}>
        {isEmpty ? (
          <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
