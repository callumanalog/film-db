"use client";

import type { FlickrPhoto } from "@/lib/flickr";
import type { BestFor, FilmType, ShootingNote } from "@/lib/types";
import { isBlackAndWhiteFilm } from "@/lib/types";
import { ExternalLink, Play, Aperture, Palette, Gauge, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SwitchToTabButton } from "@/components/film-page-tabs";

/** Icons for the 2x2 specs table (Format, Film Type, ISO, Development Process). */
const SPEC_ICONS: Record<string, LucideIcon> = {
  "Format": Aperture,
  "Film Type": Palette,
  "ISO": Gauge,
  "Development Process": FlaskConical,
  "Film Development Process": FlaskConical,
};

/** Slider config: key, label, and end labels. Value comes from props (1–5 scale from DB). */
const SLIDER_CONFIG: { key: "grain" | "contrast" | "saturation" | "latitude"; label: string; low: string; high: string }[] = [
  { key: "grain", label: "Grain", low: "Fine", high: "Coarse" },
  { key: "contrast", label: "Contrast", low: "Soft", high: "Punchy" },
  { key: "saturation", label: "Saturation", low: "Muted", high: "Vivid" },
  { key: "latitude", label: "Latitude", low: "Narrow", high: "Wide" },
];

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
  /** Array of { header, dek } for shooting notes. Replaces legacy shootingTips. */
  shootingNotes: ShootingNote[];
  reviewsFromWeb: { title: string; site: string; url: string }[];
  videoReviews: { title: string; channel: string; url: string; videoId?: string }[];
  purchaseLinks?: PurchaseLink[];
  stockName?: string;
  bestFor?: BestFor[];
  useCaseSpec?: { label: string; value: string };
  /** Flat list of spec { label, value } for the 2x2 table (Format, Film Type, ISO, Development Process). */
  specs?: { label: string; value: string }[];
  /** Scale 1–5 from DB; only sliders with a value are shown. For B&W, saturation is displayed as Color Sensitivity. */
  characterScales?: { grain?: number | null; contrast?: number | null; saturation?: number | null; latitude?: number | null };
  /** Film type: when bw_negative/bw_reversal, saturation slider is shown as "Color Sensitivity" (1=Ortho, 3=Pan, 5=Extended Pan). */
  filmType?: FilmType | null;
}

export function OverviewTabContent({
  description,
  flickrImages,
  shootingNotes,
  reviewsFromWeb,
  videoReviews,
  purchaseLinks = [],
  stockName,
  bestFor = [],
  useCaseSpec,
  specs = [],
  characterScales,
  filmType,
}: OverviewTabContentProps) {
  const isBw = isBlackAndWhiteFilm(filmType ?? null);
  const sliderConfig = SLIDER_CONFIG.map((c) => {
    if (c.key === "saturation" && isBw) {
      return { ...c, label: "Color Sensitivity", low: "Orthochromatic", high: "Extended Panchromatic" };
    }
    return c;
  });
  const characterSliders = sliderConfig.filter(
    (c) => characterScales?.[c.key] != null && characterScales[c.key]! >= 1 && characterScales[c.key]! <= 5
  ).map((c) => ({ ...c, value: characterScales![c.key] as number }));

  /** 2x2 table: Format | Film Type, ISO | Development Process. */
  const topSpecsRows: { label: string; value: string }[][] = [
    [
      specs.find((s) => s.label === "Format") ?? { label: "Format", value: "—" },
      specs.find((s) => s.label === "Film Type") ?? { label: "Film Type", value: "—" },
    ],
    [
      specs.find((s) => s.label === "ISO") ?? { label: "ISO", value: "—" },
      specs.find((s) => s.label === "Development Process" || s.label === "Film Development Process") ?? { label: "Development Process", value: "—" },
    ],
  ];
  return (
    <div className="space-y-14">
      {/* Description, then Gallery section, Specs, Performance */}
      <div className="min-w-0 space-y-10">
        {description && (
          <section>
            <p className="text-[15px] leading-relaxed text-black">
              {description}
            </p>
            {(bestFor.length > 0 || (useCaseSpec?.value && useCaseSpec.value !== "—")) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {bestFor.length > 0
                  ? bestFor.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded border border-[#E5E5E5] bg-transparent px-2 py-1 text-[11px] font-medium uppercase leading-tight tracking-[0.05em] text-muted-foreground transition-colors hover:border-[#BBB] hover:text-primary"
                      >
                        {tag}
                      </span>
                    ))
                  : useCaseSpec!.value.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded border border-[#E5E5E5] bg-transparent px-2 py-1 text-[11px] font-medium uppercase leading-tight tracking-[0.05em] text-muted-foreground transition-colors hover:border-[#BBB] hover:text-primary"
                      >
                        {tag}
                      </span>
                    ))}
              </div>
            )}
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
        {specs.length > 0 && (
          <section aria-labelledby="overview-specs-heading">
            <h3 id="overview-specs-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Specs</h3>
            <div className="mb-3 overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="divide-y divide-border/50">
                {topSpecsRows.map((row, rowIndex) => (
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
              </div>
            </div>
          </section>
        )}
        {characterSliders.length > 0 && (
          <section aria-labelledby="overview-characteristics-heading">
            <h3 id="overview-characteristics-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Characteristics</h3>
            <div className="mb-3 overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {characterSliders.map((item) => {
                  const positionPercent = ((item.value - 1) / 4) * 100;
                  return (
                    <div key={item.key} className="flex min-w-0 flex-col items-center">
                      <p className="w-full text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      <div className="mt-2 w-full">
                        <div className="relative h-1 w-full">
                          {/* Inactive track (right of dot) */}
                          <div className="absolute inset-0 rounded-full bg-[#F2F2F2]" aria-hidden />
                          {/* Filled track to the left of the dot — slightly darker for progressive feel */}
                          {positionPercent > 0 && (
                            <div
                              className="absolute inset-y-0 left-0 rounded-[1px] bg-[#B8B8B8]"
                              style={{ width: `${positionPercent}%` }}
                              aria-hidden
                            />
                          )}
                          {/* 5 subtle tick marks (1–5 scale) */}
                          {[0, 25, 50, 75, 100].map((tickPercent) => (
                            <span
                              key={tickPercent}
                              className="absolute top-0 bottom-0 w-px bg-[#E5E5E5]"
                              style={{
                                left: tickPercent === 0 ? "0" : tickPercent === 100 ? "100%" : `${tickPercent}%`,
                                transform: tickPercent === 0 ? "none" : tickPercent === 100 ? "translateX(-100%)" : "translateX(-50%)",
                              }}
                              aria-hidden
                            />
                          ))}
                          {/* Dot with crisp 2px white ring */}
                          <span
                            className="absolute top-1/2 z-[1] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_2px_white]"
                            style={{ left: `${positionPercent}%` }}
                            aria-hidden
                          />
                        </div>
                        <div className="mt-1 flex w-full justify-between">
                          <span className="text-[9px] font-normal tracking-normal text-[#BBBBBB] text-left">
                            {item.low}
                          </span>
                          <span className="text-[9px] font-normal tracking-normal text-[#BBBBBB] text-right">
                            {item.high}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
        {shootingNotes.length > 0 && (
          <section aria-labelledby="performance-heading">
            <h3 id="performance-heading" className="mb-4 text-xl font-bold tracking-tight text-foreground">Performance</h3>
            <div className="mb-3 overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="divide-y divide-border/50">
                {shootingNotes.map((note, i) => (
                  <div key={i} className="px-4 py-3">
                    {note.header && (
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {note.header}
                      </span>
                    )}
                    <span className={`block text-[15px] leading-relaxed text-black ${note.header ? "mt-1 pl-3" : ""}`}>
                      {note.dek}
                    </span>
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
