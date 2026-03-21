"use client";

import { useState } from "react";
import type { BestFor, FilmType, ShootingNote } from "@/lib/types";
import { ExternalLink, ChevronRight } from "lucide-react";
import type { FlickrPhoto } from "@/lib/flickr";
import { CommunityGallery, CommunityReviews } from "@/components/community-section";
import {
  FilmSpecsTabContent,
  FilmCharacteristicsTabContent,
  FilmPerformanceTabContent,
  FilmBestForPills,
  buildBestForPillTags,
} from "@/components/film-technical-tabs";
import { BestForSection } from "@/components/best-for-section";
import { GalleryPreview } from "@/components/gallery-preview";
import { cn } from "@/lib/utils";

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
}: OverviewTabContentProps) {
  const [expanded, setExpanded] = useState(false);
  const gallerySlug = filmSlug ?? "";
  const galleryName = stockName ?? "This stock";
  const bestForPillTags = buildBestForPillTags(bestFor, useCaseSpec);

  return (
    <div className="space-y-14">
      <div className="min-w-0 space-y-10">
        {(description || bestFor.length > 0) && (
          <section>
            {description && (
              <p className="hyphens-auto text-sm leading-relaxed text-foreground text-justify md:text-left md:hyphens-none">
                {description}
              </p>
            )}
            {bestFor.length > 0 && (
              <div className={description ? "mt-4" : ""}>
                {/* Mobile: clip to one row with gradient when collapsed */}
                <div className={cn("relative md:max-h-none md:overflow-visible", !expanded && "max-h-[36px] overflow-hidden")}>
                  <BestForSection items={bestFor} />
                  {!expanded && (
                    <div className="absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-background to-transparent md:hidden" />
                  )}
                </div>
                {/* See more / Show less toggle — mobile only */}
                <div className="mt-2 flex justify-center md:hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="rounded-full border border-border/60 bg-background px-5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary/40"
                  >
                    {expanded ? "Show less" : "See more"}
                  </button>
                </div>
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
        <div className={cn("contents md:contents", !expanded && "hidden md:contents")}>
          <FilmCharacteristicsTabContent characterScales={characterScales} filmType={filmType} />
          <FilmPerformanceTabContent shootingNotes={shootingNotes} />
        </div>

        {filmSlug ? (
          <section aria-labelledby="film-scans-heading">
            <div className="-mx-6 -mt-2 mb-5 border-t border-border/40 px-6 pt-8 lg:-mx-8 lg:px-8">
              <div className="flex items-center justify-between">
                <h3 id="film-scans-heading" className="text-xl font-bold tracking-tight text-foreground">
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
            <div className="-mx-6 -mt-2 mb-5 border-t border-border/40 px-6 pt-8 lg:-mx-8 lg:px-8">
              <h3 id="film-reviews-heading" className="text-xl font-bold tracking-tight text-foreground">
                Reviews
              </h3>
            </div>
            <CommunityReviews slug={gallerySlug} />
          </section>
        ) : null}
      </div>

      {purchaseLinks.length > 0 && (
        <section aria-labelledby="overview-buy-heading">
          <h3 id="overview-buy-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">
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
