"use client";

import type { FlickrPhoto } from "@/lib/flickr";
import type { BestFor } from "@/lib/types";
import { ExternalLink, Play, Aperture, Palette, Gauge, ScanLine, Thermometer, Target, QrCode, FlaskConical, Contrast as ContrastIcon, Image, Lightbulb, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SwitchToTabButton } from "@/components/film-page-tabs";

/** Icons for spec labels (match hero-mockups SpecsTable). */
const SPEC_ICONS: Record<string, LucideIcon> = {
  "Use case": Image,
  "Format": Aperture,
  "Release Date": Calendar,
  "Film Format": Aperture,
  "Film Colour & Type": Palette,
  "Film Type": Palette,
  "ISO": Gauge,
  "Grain": ScanLine,
  "Contrast": ContrastIcon,
  "Colour Balance": Thermometer,
  "Color Balance": Thermometer,
  "Color Palette": Palette,
  "Exposure Latitude": Target,
  "Latitude": Target,
  "DX Coding": QrCode,
  "Film Development Process": FlaskConical,
  "Development Process": FlaskConical,
};

/** Placeholder image paths and usernames for overview grid (same style as example cards, no heart/camera). */
const OVERVIEW_PLACEHOLDER_ITEMS = [
  { src: "/placeholders/placeholder-1.png", username: "nightcrawler_35mm" },
  { src: "/placeholders/placeholder-2.png", username: "analog.sara" },
  { src: "/placeholders/placeholder-3.png", username: "filmvault" },
] as const;

/** Extract YouTube video ID from watch or youtu.be URL for thumbnails. */
function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Grid of 3 images (Flickr or placeholders) — card style with username only under image, same size. */
function OverviewImageGrid({ flickrImages }: { flickrImages: FlickrPhoto[] }) {
  const images = flickrImages.slice(0, 3);

  return (
    <div className="grid grid-cols-3 gap-3">
      {OVERVIEW_PLACEHOLDER_ITEMS.map((item, i) => {
        const flickr = images[i];
        if (flickr) {
          return (
            <a
              key={flickr.id}
              href={flickr.flickrPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30"
            >
              <div className="aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flickr.imageUrl} alt={flickr.title || ""} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium">{flickr.ownerName}</p>
              </div>
            </a>
          );
        }
        return (
          <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30">
            <div className="aspect-[4/3] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt="" className="h-full w-full object-cover" aria-hidden />
            </div>
            <div className="p-3">
              <p className="text-xs font-medium">{item.username}</p>
            </div>
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
  videoReviews: { title: string; channel: string; url: string; videoId?: string }[];
  purchaseLinks?: PurchaseLink[];
  stockName?: string;
  bestFor?: BestFor[];
  specs?: { label: string; value: string }[];
  pairedSpecsRows?: { label: string; value: string }[][];
  useCaseSpec?: { label: string; value: string };
}

export function OverviewTabContent({
  description,
  flickrImages,
  shootingTips,
  reviewsFromWeb,
  videoReviews,
  purchaseLinks = [],
  stockName,
  bestFor = [],
  specs = [],
  pairedSpecsRows,
  useCaseSpec,
}: OverviewTabContentProps) {
  return (
    <div className="space-y-14">
      {/* Description, then Gallery section, Specs, Shooting notes */}
      <div className="min-w-0 space-y-10">
        {description && (
          <section>
            <p className="text-[15px] leading-relaxed text-black">
              {description}
            </p>
          </section>
        )}
        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {stockName ? `Shot on ${stockName}` : "Gallery"}
            </h3>
            <SwitchToTabButton tabId="gallery" className="text-sm font-medium text-primary hover:underline">
              View all
            </SwitchToTabButton>
          </div>
          <OverviewImageGrid flickrImages={flickrImages} />
        </section>
        {specs.length > 0 && (() => {
            const list = specs;
            const pairedCount = Math.min(10, list.length);
            const derivedPairedRows: { label: string; value: string }[][] = [];
            for (let i = 0; i < pairedCount; i += 2) {
              derivedPairedRows.push(list.slice(i, i + 2));
            }
            const derivedUseCaseSpec = list.length > 10 && list[10].label === "Use case" ? list[10] : null;
            const pairedRows = pairedSpecsRows ?? derivedPairedRows;
            const effectiveUseCaseSpec = useCaseSpec ?? derivedUseCaseSpec;

            return (
              <section aria-labelledby="overview-specs-heading">
                <h3 id="overview-specs-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Specs</h3>
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                  <div className="divide-y divide-border/50">
                    {pairedRows.map((row, rowIndex) => (
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
                                <p className="mt-0.5 text-sm leading-tight text-foreground/90">{spec.value}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {effectiveUseCaseSpec && (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                          <Image className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{effectiveUseCaseSpec.label}</p>
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            {effectiveUseCaseSpec.value && effectiveUseCaseSpec.value !== "—"
                              ? effectiveUseCaseSpec.value.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                                  <span key={tag} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-sm leading-tight text-muted-foreground">
                                    {tag}
                                  </span>
                                ))
                              : <span className="text-sm text-foreground/90">—</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })()}
        {shootingTips && (
          <section aria-labelledby="shooting-notes-heading">
            <h3 id="shooting-notes-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Shooting notes</h3>
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="divide-y divide-border/50">
                {shootingTips.split(/\.\s+/).filter((s) => s.trim().length > 0).map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                      <Lightbulb className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-black">
                      {tip.endsWith(".") ? tip : `${tip}.`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Reviews from the web — no dividing line */}
      {reviewsFromWeb.length > 0 && (
        <section aria-labelledby="reviews-from-web-heading">
          <h3 id="reviews-from-web-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">
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
                <div className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{review.title}</span>
                  <span className="text-sm text-muted-foreground">{review.site}</span>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Video reviews — no dividing line, YouTube-style cards */}
      {videoReviews.length > 0 && (
        <section aria-labelledby="video-reviews-heading">
          <h3 id="video-reviews-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">
            Video reviews
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {videoReviews.map((video) => {
              const videoId = video.videoId ?? getYouTubeVideoId(video.url);
              const thumbnailUrl = videoId
                ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                : null;
              return (
                <a
                  key={video.url + video.title}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-primary/30 hover:bg-card/80"
                >
                  <div className="relative aspect-video bg-muted">
                    {thumbnailUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110">
                            <Play className="h-7 w-7 fill-current pl-1" aria-hidden />
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Play className="h-12 w-12 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                      {video.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{video.channel}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Where to buy — 2x2 grid, no dividing line */}
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
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-secondary/30"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </span>
                <p className="min-w-0 truncate text-sm font-medium text-foreground/90">
                  {link.retailer_name}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
