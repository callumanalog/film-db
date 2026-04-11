"use client";

import type { BestFor, FilmType, ShootingNote } from "@/lib/types";
import Image from "next/image";
import { Star } from "lucide-react";
import { CarouselViewAllHeader } from "@/components/carousel-view-all-header";
import { GalleryPreview } from "@/components/gallery-preview";
import type { FlickrPhoto } from "@/lib/flickr";
import { CommunityGallery, CommunityReviews, type ReviewFlowFilmStock } from "@/components/community-section";
import {
  FilmSpecsTabContent,
  FilmCharacteristicsTabContent,
  FilmPerformanceTabContent,
  buildBestForPillTags,
} from "@/components/film-technical-tabs";
import { BestForSection } from "@/components/best-for-section";
import type { FilmStockLightboxSummary } from "@/lib/lightbox-group";
import type { FilmReviewRow } from "@/app/actions/reviews";
import type { StockListFilmRow } from "@/app/actions/stock-lists";

function authorInitials(primary: string): string {
  const t = primary.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return t.slice(0, 2).toUpperCase();
}

/** Matches `AvgRatingStar` in `hero-mockups` (film detail header). */
function ReviewPreviewRatingStars({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.floor(rating)));
  const empty = 5 - filled;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${rating.toFixed(1)} out of 5`}
      >
        {Array.from({ length: filled }).map((_, i) => (
          <Star key={`f-${i}`} className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`e-${i}`}
            className="h-4 w-4 shrink-0 fill-none text-border/50"
            strokeWidth={1.5}
            aria-hidden
          />
        ))}
      </div>
      <span className="font-sans text-[13px] font-medium leading-relaxed tabular-nums text-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export interface OverviewTabContentProps {
  description: string | null;
  /** Film slug for gallery/reviews and upload links. */
  filmSlug?: string;
  shootingNotes?: ShootingNote[];
  stockName?: string;
  bestFor?: BestFor[];
  useCaseSpec?: { label: string; value: string };
  specs?: { label: string; value: string }[];
  characterScales?: {
    grain?: number | null;
    contrast?: number | null;
    saturation?: number | null;
    latitude?: number | null;
  };
  filmType?: FilmType | null;
  flickrImages?: FlickrPhoto[];
  avgRating?: number | null;
  reviewFilmStock?: ReviewFlowFilmStock | null;
  lightboxStockSummary?: FilmStockLightboxSummary | null;
  reviewPreviewRows?: FilmReviewRow[];
  listPreviewRows?: readonly StockListFilmRow[];
  listHasMore?: boolean;
}

export function OverviewTabContent({
  description,
  filmSlug,
  shootingNotes = [],
  stockName,
  bestFor = [],
  useCaseSpec,
  specs = [],
  characterScales,
  filmType,
  flickrImages = [],
  reviewFilmStock = null,
  lightboxStockSummary = null,
  reviewPreviewRows = [],
  listPreviewRows = [],
  listHasMore = false,
}: OverviewTabContentProps) {
  const gallerySlug = filmSlug ?? "";
  const galleryName = stockName ?? "This stock";
  const bestForPillTags = buildBestForPillTags(bestFor, useCaseSpec);
  const reviewsPreview = reviewPreviewRows.slice(0, 2);
  const listCountDisplay = listHasMore ? `${listPreviewRows.length}+` : `${listPreviewRows.length}`;
  const listExamples = listPreviewRows
    .slice(0, 2)
    .map((row) => row.title)
    .join(", ");
  const listsSummary =
    listPreviewRows.length > 0
      ? `Appears in ${listCountDisplay} list${listPreviewRows.length === 1 && !listHasMore ? "" : "s"}${listExamples ? ` including ${listExamples}.` : "."}`
      : "Not in any public lists yet.";
  const scansHref = filmSlug ? `/images/film/${filmSlug}` : undefined;
  const reviewsHref = filmSlug ? `/films/${filmSlug}/reviews` : undefined;
  const listsHref = filmSlug ? `/films/${filmSlug}/lists` : undefined;

  return (
    <div className="space-y-6">
      <div className="min-w-0 space-y-6 md:hidden">
        {description ? (
          <section>
            <p className="text-sm leading-relaxed text-foreground">{description}</p>
          </section>
        ) : null}

        {bestFor.length > 0 || bestForPillTags.length > 0 ? (
          <section>
            <BestForSection items={bestFor} />
          </section>
        ) : null}

        {filmSlug && scansHref ? (
          <section aria-labelledby="film-scans-heading-mobile">
            <CarouselViewAllHeader href={scansHref} title="Scans" titleId="film-scans-heading-mobile" />
            <GalleryPreview
              slug={gallerySlug}
              stockName={galleryName}
              flickrImages={flickrImages}
              lightboxStockSummary={lightboxStockSummary}
            />
          </section>
        ) : null}

        <FilmSpecsTabContent specs={specs} hideCoreSpecRows />
        <FilmCharacteristicsTabContent characterScales={characterScales} filmType={filmType} />
        <FilmPerformanceTabContent shootingNotes={shootingNotes} />

        {filmSlug && reviewsHref ? (
          <section aria-labelledby="film-reviews-heading-mobile">
            <CarouselViewAllHeader href={reviewsHref} title="Reviews" titleId="film-reviews-heading-mobile" />
            {reviewsPreview.length > 0 ? (
              <div className="space-y-3">
                {reviewsPreview.map((review) => {
                  const name = review.display_name?.trim() || "Member";
                  const previewText = (review.review_text ?? "").replace(/<[^>]*>/g, "").trim();
                  return (
                    <article key={review.id} className="rounded-[7px] border border-border/50 bg-card px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative size-6 shrink-0 overflow-hidden rounded-full bg-muted">
                          {review.avatar_url ? (
                            <Image
                              src={review.avatar_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center font-sans text-[10px] font-semibold text-muted-foreground">
                              {authorInitials(name)}
                            </span>
                          )}
                        </div>
                        <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">{name}</p>
                      </div>
                      {review.rating != null && review.rating > 0 ? (
                        <div className="mt-1">
                          <ReviewPreviewRatingStars rating={Number(review.rating)} />
                        </div>
                      ) : null}
                      {previewText ? (
                        <p className="mt-1 text-sm leading-relaxed text-foreground/80 line-clamp-3">{previewText}</p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">No review text.</p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </section>
        ) : null}

        {filmSlug && listsHref ? (
          <section aria-labelledby="film-lists-heading-mobile" className="space-y-2">
            <CarouselViewAllHeader href={listsHref} title="Lists" titleId="film-lists-heading-mobile" />
            <p className="text-sm leading-relaxed text-muted-foreground">{listsSummary}</p>
          </section>
        ) : null}
      </div>

      <div className="hidden min-w-0 space-y-6 md:block">
        {(description || bestFor.length > 0) && (
          <section>
            {description ? <p className="text-sm leading-relaxed text-foreground">{description}</p> : null}
            {bestFor.length > 0 ? (
              <div className={description ? "mt-4" : ""}>
                <BestForSection items={bestFor} />
              </div>
            ) : null}
          </section>
        )}

        <FilmSpecsTabContent specs={specs} />
        <FilmCharacteristicsTabContent characterScales={characterScales} filmType={filmType} />
        <FilmPerformanceTabContent shootingNotes={shootingNotes} />

        {filmSlug && scansHref ? (
          <section aria-labelledby="film-scans-heading">
            <CarouselViewAllHeader
              href={scansHref}
              title={stockName ? `Shot on ${stockName}` : "Scans"}
              titleId="film-scans-heading"
            />
            <CommunityGallery
              stockName={galleryName}
              slug={gallerySlug}
              flickrImages={flickrImages}
              variant="tab"
              lightboxStockSummary={lightboxStockSummary}
            />
          </section>
        ) : null}

        {filmSlug ? (
          <section aria-labelledby="film-reviews-heading" className="space-y-6">
            <div className="mb-3">
              <h3 id="film-reviews-heading" className="text-base font-semibold tracking-tight text-foreground">
                Reviews
              </h3>
            </div>
            <CommunityReviews slug={gallerySlug} showViewFilter={false} filmStock={reviewFilmStock} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
