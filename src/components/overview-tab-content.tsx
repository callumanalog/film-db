"use client";

import type { BestFor, FilmType, ShootingNote } from "@/lib/types";
import { ExternalLink, ChevronRight } from "lucide-react";
import { GalleryPreview } from "@/components/gallery-preview";
import type { FlickrPhoto } from "@/lib/flickr";
import { CommunityGallery, CommunityReviews, type ReviewFlowFilmStock } from "@/components/community-section";
import {
  FilmSpecsTabContent,
  FilmCharacteristicsTabContent,
  FilmPerformanceTabContent,
  FilmBestForPills,
  buildBestForPillTags,
} from "@/components/film-technical-tabs";
import { BestForSection } from "@/components/best-for-section";

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
}: OverviewTabContentProps) {
  const gallerySlug = filmSlug ?? "";
  const galleryName = stockName ?? "This stock";
  const bestForPillTags = buildBestForPillTags(bestFor, useCaseSpec);

  return (
    <div className="space-y-14">
      <div className="min-w-0 space-y-8">
        {(description || bestFor.length > 0) && (
          <section>
            {description && (
              <p className="text-sm leading-relaxed text-foreground">
                {description}
              </p>
            )}
            {bestFor.length > 0 && (
              <div className={description ? "mt-4" : ""}>
                <BestForSection items={bestFor} />
              </div>
            )}
          </section>
        )}

        {/* Mobile: core four specs may be trimmed in hero; desktop keeps full Details block */}
        <div className="md:hidden">
          <FilmSpecsTabContent specs={specs} hideCoreSpecRows />
        </div>
        <div className="hidden md:block">
          <FilmSpecsTabContent specs={specs} />
        </div>
        <FilmCharacteristicsTabContent characterScales={characterScales} filmType={filmType} />
        <FilmPerformanceTabContent shootingNotes={shootingNotes} />

        {filmSlug ? (
          <section aria-labelledby="film-scans-heading">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h3 id="film-scans-heading" className="text-base font-semibold tracking-tight text-foreground">
                  {stockName ? `Shot on ${stockName}` : "Scans"}
                </h3>
                <ChevronRight className="h-5 w-5 text-muted-foreground md:hidden" aria-hidden />
              </div>
            </div>
            <div className="md:hidden">
              <GalleryPreview slug={gallerySlug} stockName={galleryName} flickrImages={flickrImages} />
            </div>
            <div className="hidden md:block">
              <CommunityGallery stockName={galleryName} slug={gallerySlug} flickrImages={flickrImages} variant="tab" />
            </div>
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
