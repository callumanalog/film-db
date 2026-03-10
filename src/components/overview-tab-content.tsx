"use client";

import Link from "next/link";
import { SwitchToTabButton } from "@/components/film-page-tabs";
import type { FlickrPhoto } from "@/lib/flickr";
import type { BestFor } from "@/lib/types";
import { ExternalLink, FileText, Play, Aperture, Palette, Gauge, ScanLine, Thermometer, Target, QrCode, FlaskConical, Contrast as ContrastIcon, Image } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Icons for spec labels (match hero-mockups SpecsTable). */
const SPEC_ICONS: Record<string, LucideIcon> = {
  "Use case": Image,
  "Film Format": Aperture,
  "Film Colour & Type": Palette,
  "Film Type": Palette,
  "ISO": Gauge,
  "Grain": ScanLine,
  "Contrast": ContrastIcon,
  "Colour Balance": Thermometer,
  "Color Palette": Palette,
  "Exposure Latitude": Target,
  "Latitude": Target,
  "DX Coding": QrCode,
  "Film Development Process": FlaskConical,
  "Development Process": FlaskConical,
};

/** Placeholder image paths when Flickr images are missing. */
const OVERVIEW_PLACEHOLDER_IMAGES = [
  "/placeholders/placeholder-1.png",
  "/placeholders/placeholder-2.png",
  "/placeholders/placeholder-3.png",
] as const;

/** Grid of 3 images (Flickr or placeholders) under the description — one row. */
function OverviewImageGrid({ flickrImages }: { flickrImages: FlickrPhoto[] }) {
  const images = flickrImages.slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-3">
      {OVERVIEW_PLACEHOLDER_IMAGES.map((placeholderSrc, i) => {
        const flickr = images[i];
        if (flickr) {
          return (
            <a
              key={flickr.id}
              href={flickr.flickrPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-border/50 bg-card aspect-[4/3]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flickr.imageUrl} alt={flickr.title || ""} className="h-full w-full object-cover" />
            </a>
          );
        }
        return (
          <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={placeholderSrc} alt="" className="h-full w-full object-cover" aria-hidden />
          </div>
        );
      })}
    </div>
  );
}

interface PurchaseLink {
  id: string;
  retailer_name: string;
  url: string;
}

interface OverviewTabContentProps {
  description: string | null;
  flickrImages: FlickrPhoto[];
  shootingTips: string | null;
  reviewsFromWeb: { title: string; site: string; url: string }[];
  videoReviews: { title: string; channel: string; url: string }[];
  purchaseLinks?: PurchaseLink[];
  bestFor?: BestFor[];
  specs?: { label: string; value: string }[];
}

export function OverviewTabContent({
  description,
  flickrImages,
  shootingTips,
  reviewsFromWeb,
  videoReviews,
  purchaseLinks = [],
  bestFor = [],
  specs = [],
}: OverviewTabContentProps) {
  return (
    <div className="space-y-14">
      {/* Description card, then carousel, then Specs (2 cols x 5), then Shooting notes */}
      <div className="min-w-0 space-y-10">
        {description && (
          <section>
            <p className="text-[15px] leading-relaxed text-black">
              {description}
            </p>
          </section>
        )}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-foreground">Example images</h3>
            <SwitchToTabButton tabId="gallery">View all</SwitchToTabButton>
          </div>
          <OverviewImageGrid flickrImages={flickrImages} />
        </section>
        {specs.length > 0 && (
          <section aria-labelledby="overview-specs-heading">
            <h3 id="overview-specs-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Specs</h3>
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="divide-y divide-border/50">
                {(() => {
                  const list = specs.slice(0, 10);
                  const rows: { label: string; value: string }[][] = [];
                  for (let i = 0; i < list.length; i += 2) {
                    rows.push(list.slice(i, i + 2));
                  }
                  return rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-2 divide-x divide-border/50">
                      {row.map((spec) => {
                        const Icon = SPEC_ICONS[spec.label];
                        return (
                          <div key={spec.label} className="flex items-center gap-3 px-4 py-3">
                            {Icon ? (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                                <Icon className="h-4 w-4" aria-hidden />
                              </span>
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground text-xs font-medium">
                                —
                              </span>
                            )}
                            <div className="min-w-0 flex-1 py-0.5">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{spec.label}</p>
                              {spec.label === "Use case" ? (
                                <div className="mt-0.5 flex flex-wrap gap-1.5">
                                  {spec.value.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                                    <span key={tag} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-sm leading-tight text-muted-foreground">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-0.5 text-sm leading-tight text-foreground/90">{spec.value}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </section>
        )}
        {shootingTips && (
          <section aria-labelledby="shooting-notes-heading">
            <h3 id="shooting-notes-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Shooting notes</h3>
            <ul className="space-y-2 text-[15px] leading-relaxed text-black">
              {shootingTips.split(/\.\s+/).filter((s) => s.trim().length > 0).map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {tip.endsWith(".") ? tip : `${tip}.`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Reviews from the web */}
      {reviewsFromWeb.length > 0 && (
        <div className="border-t border-border/50 pt-12">
          <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground">
            Reviews from the web
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewsFromWeb.map((review) => (
              <a
                key={review.url}
                href={review.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{review.title}</span>
                  <span className="text-sm text-muted-foreground">{review.site}</span>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Video reviews */}
      {videoReviews.length > 0 && (
        <div className="border-t border-border/50 pt-12">
          <h3 className="mb-4 text-xl font-bold tracking-tight text-foreground">
            Video reviews
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {videoReviews.map((video) => (
              <a
                key={video.url + video.title}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-card/80"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Play className="h-5 w-5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{video.title}</span>
                  <span className="text-sm text-muted-foreground">{video.channel}</span>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
