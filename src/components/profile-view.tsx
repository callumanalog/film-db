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
import type { InCameraEntry } from "@/app/actions/user-actions";
import { SITE_NAME } from "@/lib/site";
import {
  plainTextFromPossibleHtml,
  sanitizeReviewLikeHtml,
} from "@/lib/sanitize-review-like-html";

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
  inCameraEntries?: InCameraEntry[];
  ratings: Record<string, number>;
  reviewCount?: number;
  uploadCount?: number;
  reviews?: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads?: { id: string; film_stock_slug: string; image_url: string | null; caption: string | null; created_at: string }[];
  likedReviews?: {
    review_id: string;
    film_stock_slug: string;
    review_title: string | null;
    rating: number | null;
    review_created_at: string;
    liked_at: string;
  }[];
}

interface ProfileViewProps {
  profile: ProfileData;
  stocksBySlug: Map<string, StockWithBrand>;
  statsBySlug?: Record<string, { avgRating: number | null }>;
}

function StockGrid({ slugs, stocksBySlug }: { slugs: string[]; stocksBySlug: Map<string, StockWithBrand> }) {
  if (slugs.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {slugs.map((slug) => {
        const stock = stocksBySlug.get(slug);
        if (!stock) return null;
        return <FilmCard key={slug} stock={stock} />;
      })}
    </div>
  );
}

export function ProfileView({ profile, stocksBySlug, statsBySlug = {} }: ProfileViewProps) {
  const inCameraEntries = profile.inCameraEntries ?? [];
  const inCameraSlugs = inCameraEntries.map((e) => e.film_stock_slug);

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
          {profile.displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight font-sans">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">{SITE_NAME} member</p>
        </div>
      </div>

      {/* Tabs */}
      <FilmDetailTabs
        defaultId="want"
        tabs={[
          {
            id: "want",
            label: "Shootlist",
            content: (
              <ProfileSection
                emptyMessage="Nothing on your Shootlist yet. Tap the bookmark on any film page."
                isEmpty={profile.favouriteSlugs.length === 0}
              >
                <StockGrid slugs={profile.favouriteSlugs} stocksBySlug={stocksBySlug} />
              </ProfileSection>
            ),
          },
          {
            id: "shot",
            label: "Shot",
            content: (
              <ProfileSection
                emptyMessage="No stocks marked as shot yet."
                isEmpty={profile.shotSlugs.length === 0}
              >
                <StockGrid slugs={profile.shotSlugs} stocksBySlug={stocksBySlug} />
              </ProfileSection>
            ),
          },
          {
            id: "in-camera",
            label: "In Camera",
            content: (
              <ProfileSection
                emptyMessage="No stocks in camera right now."
                isEmpty={inCameraSlugs.length === 0}
              >
                <ul className="space-y-3">
                  {inCameraEntries.map((entry) => {
                    const stock = stocksBySlug.get(entry.film_stock_slug);
                    if (!stock) return null;
                    return (
                      <li key={entry.film_stock_slug}>
                        <Link
                          href={`/films/${entry.film_stock_slug}`}
                          className="flex items-center gap-4 rounded-[7px] border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card bg-white">
                            {stock.image_url ? (
                              <Image src={stock.image_url} alt="" width={56} height={56} className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{stock.name}</p>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                              {entry.camera && <span>{entry.camera}</span>}
                              {entry.format && <span>{entry.format}</span>}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </ProfileSection>
            ),
          },
          {
            id: "portfolio",
            label: "Portfolio",
            content: (
              <ProfileSection
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
                              alt={plainTextFromPossibleHtml(u.caption ?? "")}
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
                            <div
                              className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground [&_a]:underline [&_blockquote]:my-0 [&_p]:m-0 [&_p]:inline"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeReviewLikeHtml(u.caption),
                              }}
                            />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ProfileSection>
            ),
          },
          {
            id: "lists",
            label: "Lists",
            content: (
              <ProfileSection
                emptyMessage="You haven't created any lists yet. Lists are coming soon!"
                isEmpty={true}
              >
                <div />
              </ProfileSection>
            ),
          },
          {
            id: "saved",
            label: "Saved",
            content: (
              <ProfileSection
                emptyMessage="You haven't saved any community images yet. This feature is coming soon!"
                isEmpty={true}
              >
                <div />
              </ProfileSection>
            ),
          },
          {
            id: "reviews",
            label: "Reviews",
            content: (
              <ProfileSection
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
          {
            id: "likes",
            label: "Likes",
            content: (
              <ProfileSection
                emptyMessage="You haven't liked any reviews yet. Open a film’s Reviews tab and tap Like on a review."
                isEmpty={!profile.likedReviews || profile.likedReviews.length === 0}
              >
                <ul className="space-y-3">
                  {(profile.likedReviews ?? []).map((r) => {
                    const stock = stocksBySlug.get(r.film_stock_slug);
                    const stockName = stock?.name ?? r.film_stock_slug;
                    const dateLabel = formatReviewDate(r.liked_at);
                    return (
                      <li key={r.review_id}>
                        <Link
                          href={`/films/${r.film_stock_slug}`}
                          className="flex items-center gap-4 rounded-[7px] border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-foreground">{stockName}</span>
                            {r.review_title && (
                              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{r.review_title}</p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">Liked {dateLabel}</p>
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
