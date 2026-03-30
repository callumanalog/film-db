"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Camera,
  Star,
  StarHalf,
  ChevronRight,
  Share,
  Settings,
} from "lucide-react";
import { FilmCard } from "@/components/film-card";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import { ProfileEditSheet } from "@/components/profile-edit-sheet";
import { showToastViaEvent } from "@/components/toast";
import { FilmNativeMasonryGrid } from "@/components/film-native-grid";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import type { FilmStock, FilmBrand } from "@/lib/types";
import type { InCameraEntry } from "@/app/actions/user-actions";
import type { FilmUploadRow } from "@/app/actions/uploads";
import {
  collectLightboxSlidesFromFilmUploads,
  relatedFilmPageLightboxSlides,
} from "@/lib/lightbox-group";
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
  /** Unique handle (profiles.display_name). */
  displayName: string;
  /** Optional friendly name (profiles.full_name). */
  fullName: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  shotSlugs: string[];
  favouriteSlugs: string[];
  inCameraEntries?: InCameraEntry[];
  ratings: Record<string, number>;
  reviewCount?: number;
  uploadCount?: number;
  reviews?: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads?: {
    id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    created_at: string;
    upload_batch_id?: string | null;
  }[];
  likedReviews?: {
    review_id: string;
    film_stock_slug: string;
    review_title: string | null;
    rating: number | null;
    review_created_at: string;
    liked_at: string;
  }[];
  savedUploads?: {
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    saved_at: string;
  }[];
  likedUploads?: {
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    liked_at: string;
  }[];
}

function profileInitials(primary: string): string {
  const t = primary.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return t.slice(0, 2).toUpperCase();
}

async function shareProfileUrl(userId: string): Promise<void> {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/users/${userId}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Profile", url });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToastViaEvent("Profile link copied.");
  } catch {
    showToastViaEvent("Could not copy link.");
  }
}

interface ProfileViewProps {
  profile: ProfileData;
  stocksBySlug: Map<string, StockWithBrand>;
  statsBySlug?: Record<string, { avgRating: number | null }>;
  userId: string;
  onProfileUpdated: () => void | Promise<void>;
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

type ProfileUpload = NonNullable<ProfileData["uploads"]>[number];

function profileUploadToFilmRow(u: ProfileUpload, displayName: string): FilmUploadRow {
  return {
    id: u.id,
    user_id: "",
    film_stock_slug: u.film_stock_slug,
    image_url: u.image_url,
    caption: u.caption,
    created_at: u.created_at,
    display_name: displayName,
    upload_batch_id: u.upload_batch_id ?? null,
  };
}

function ProfileScansMasonry({
  uploads,
  displayName,
  stocksBySlug,
}: {
  uploads: NonNullable<ProfileData["uploads"]>;
  displayName: string;
  stocksBySlug: Map<string, StockWithBrand>;
}) {
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const filmRows = useMemo(
    () => uploads.filter((u) => u.image_url).map((u) => profileUploadToFilmRow(u, displayName)),
    [uploads, displayName]
  );

  const masonryItems = useMemo(
    () =>
      uploads
        .filter((u) => u.image_url)
        .map((u) => ({
          id: u.id,
          imageUrl: u.image_url,
          overlayLabel: "",
          href: `/films/${u.film_stock_slug}`,
          showOverlay: false as const,
          onActivate: () => {
            const row = profileUploadToFilmRow(u, displayName);
            const stock = stocksBySlug.get(u.film_stock_slug);
            const stockName = stock?.name ?? u.film_stock_slug;
            setLightboxSession(
              collectLightboxSlidesFromFilmUploads(filmRows, row, stockName, u.film_stock_slug)
            );
          },
        })),
    [uploads, displayName, stocksBySlug, filmRows]
  );

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    const current = lightboxSession.slides[0];
    const href = current.context?.href;
    if (!href?.startsWith("/films/")) return [];
    const slug = href.slice("/films/".length).split(/[/?#]/)[0];
    if (!slug) return [];
    const stock = stocksBySlug.get(slug);
    const stockName = stock?.name ?? slug;
    const sameStockRows = filmRows.filter((r) => r.film_stock_slug === slug);
    return relatedFilmPageLightboxSlides(current, sameStockRows, [], stockName, slug);
  }, [lightboxSession, filmRows, stocksBySlug]);

  return (
    <>
      <div className="min-w-0 w-full max-w-full sm:-mx-6 sm:w-[calc(100%+3rem)] sm:max-w-none">
        <FilmNativeMasonryGrid items={masonryItems} ariaLabel="Your scans" />
      </div>
      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={(slide) => {
            const id = slide.uploadId?.trim();
            const u = id ? uploads.find((x) => x.id === id) : undefined;
            if (!u?.image_url) return;
            const row = profileUploadToFilmRow(u, displayName);
            const stock = stocksBySlug.get(u.film_stock_slug);
            const stockName = stock?.name ?? u.film_stock_slug;
            setLightboxSession(
              collectLightboxSlidesFromFilmUploads(filmRows, row, stockName, u.film_stock_slug)
            );
          }}
        />
      ) : null}
    </>
  );
}

export function ProfileView({
  profile,
  stocksBySlug,
  statsBySlug = {},
  userId,
  onProfileUpdated,
}: ProfileViewProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const handleLabel = profile.displayName;
  const hasFriendlyName = Boolean(profile.fullName?.trim());
  const headline = hasFriendlyName ? profile.fullName!.trim() : profile.displayName;

  return (
    <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col gap-6 overflow-x-hidden overflow-y-visible md:min-h-0 md:flex-none md:gap-8 md:overflow-visible">
      <div className="sticky top-0 z-30 flex min-w-0 items-center justify-between bg-background/90 px-0 pb-2.5 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => shareProfileUrl(userId)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
          aria-label="Share profile"
        >
          <Share className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
          aria-label="Profile settings"
        >
          <Settings className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="space-y-4 px-4 sm:px-0">
        <div className="flex items-start gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary"
            aria-hidden
          >
            {profileInitials(headline)}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">{headline}</h1>
            {hasFriendlyName ? (
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{handleLabel}</p>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">{profile.followersCount}</span> followers
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{profile.followingCount}</span> following
        </p>
        {profile.bio?.trim() ? (
          <p className="max-w-prose text-sm leading-relaxed text-foreground">{profile.bio.trim()}</p>
        ) : null}
      </div>

      <ProfileEditSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        handle={handleLabel}
        fullName={profile.fullName ?? ""}
        bio={profile.bio ?? ""}
        onSaved={onProfileUpdated}
      />

      {/* Tabs */}
      <FilmDetailTabs
        defaultId="scans"
        pinTabPanelOnMobile
        pinTabBarClassName="px-4 sm:px-0"
        tabs={[
          {
            id: "scans",
            label: "Scans",
            content: (
              <ProfileSection
                className="px-0"
                emptyMessage="You haven't uploaded any images yet."
                isEmpty={
                  !profile.uploads?.length || !profile.uploads.some((u) => u.image_url)
                }
              >
                <ProfileScansMasonry
                  uploads={profile.uploads ?? []}
                  displayName={profile.displayName}
                  stocksBySlug={stocksBySlug}
                />
              </ProfileSection>
            ),
          },
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
                emptyMessage="You haven't saved any community images yet. Open Discover or Community, open an image, and tap Save."
                isEmpty={!profile.savedUploads || profile.savedUploads.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {(profile.savedUploads ?? []).map((u) => {
                    const stock = stocksBySlug.get(u.film_stock_slug);
                    const stockName = stock?.name ?? u.film_stock_slug;
                    return (
                      <Link
                        key={u.upload_id}
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
            content: (() => {
              const reviewLikes = profile.likedReviews ?? [];
              const imageLikes = profile.likedUploads ?? [];
              const noLikes = reviewLikes.length === 0 && imageLikes.length === 0;
              return (
                <ProfileSection
                  emptyMessage="You haven't liked any reviews or community images yet. Open a film’s Reviews tab or like a shot in Discover."
                  isEmpty={noLikes}
                >
                  <div className="space-y-10">
                    {reviewLikes.length > 0 ? (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground">Reviews</h3>
                        <ul className="space-y-3">
                          {reviewLikes.map((r) => {
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
                      </div>
                    ) : null}
                    {imageLikes.length > 0 ? (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground">
                          Community images
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                          {imageLikes.map((u) => {
                            const stock = stocksBySlug.get(u.film_stock_slug);
                            const stockName = stock?.name ?? u.film_stock_slug;
                            return (
                              <Link
                                key={u.upload_id}
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
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Liked {formatReviewDate(u.liked_at)}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </ProfileSection>
              );
            })(),
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
  className,
}: {
  title?: string;
  description?: string;
  emptyMessage: string;
  isEmpty?: boolean;
  children: React.ReactNode;
  /** Horizontal inset on small screens when the page shell is full-bleed (e.g. profile). */
  className?: string;
}) {
  const showHeader = title != null && title !== "" || description != null && description !== "";
  return (
    <div className={cn("px-4 sm:px-0", className)}>
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
