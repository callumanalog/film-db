"use client";

import Link from "next/link";
import type { BestFor, FilmType, ShootingNote } from "@/lib/types";
import { ExternalLink, ChevronRight, Star } from "lucide-react";
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

interface PurchaseLink {
  id: string;
  retailer_name: string;
  url: string;
}

export interface OverviewTabContentProps {
  description: string | null;
  /** Film slug for gallery/reviews and upload links. */
  filmSlug?: string;
  shootingNotes?: ShootingNote[];
  purchaseLinks?: PurchaseLink[];
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
  purchaseLinks = [],
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
  const scansHref = filmSlug ? `/films/${filmSlug}/images` : undefined;
  const reviewsHref = filmSlug ? `/films/${filmSlug}/reviews` : undefined;
  const listsHref = filmSlug ? `/films/${filmSlug}/lists` : undefined;

  return (
    <div className="space-y-14">
      <div className="min-w-0 space-y-8 md:hidden">
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
            <Link
              href={scansHref}
              className="mb-3 flex items-center justify-between rounded-[7px] py-1 transition-colors hover:text-foreground"
            >
              <h3 id="film-scans-heading-mobile" className="text-base font-semibold tracking-tight text-foreground">
                Scans
              </h3>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                View all
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
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
          <section aria-labelledby="film-reviews-heading-mobile" className="space-y-3">
            <Link
              href={reviewsHref}
              className="flex items-center justify-between rounded-[7px] py-1 transition-colors hover:text-foreground"
            >
              <h3 id="film-reviews-heading-mobile" className="text-base font-semibold tracking-tight text-foreground">
                Reviews
              </h3>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                View all
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            {reviewsPreview.length > 0 ? (
              <div className="space-y-3">
                {reviewsPreview.map((review) => {
                  const name = review.display_name?.trim() || "Member";
                  const previewText = (review.review_text ?? "").replace(/<[^>]*>/g, "").trim();
                  return (
                    <article key={review.id} className="rounded-[7px] border border-border/50 bg-card px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">{name}</p>
                      {review.rating && review.rating > 0 ? (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
                          <span>{Number(review.rating).toFixed(1)}</span>
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
            <Link
              href={listsHref}
              className="flex items-center justify-between rounded-[7px] py-1 transition-colors hover:text-foreground"
            >
              <h3 id="film-lists-heading-mobile" className="text-base font-semibold tracking-tight text-foreground">
                Lists
              </h3>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                View all
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">{listsSummary}</p>
          </section>
        ) : null}
      </div>

      <div className="hidden min-w-0 space-y-8 md:block">
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

        {filmSlug ? (
          <section aria-labelledby="film-scans-heading">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h3 id="film-scans-heading" className="text-base font-semibold tracking-tight text-foreground">
                  {stockName ? `Shot on ${stockName}` : "Scans"}
                </h3>
              </div>
            </div>
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

      {purchaseLinks.length > 0 && (
        <section aria-labelledby="overview-buy-heading">
          <h3 id="overview-buy-heading" className="mb-4 text-base font-semibold tracking-tight text-foreground">
            {stockName ? `Where to buy ${stockName}` : "Where to buy"}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {purchaseLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 rounded-[7px] border border-border/50 bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-secondary/30"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </span>
                <p className="min-w-0 truncate text-sm font-medium text-foreground/90">{link.retailer_name}</p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
