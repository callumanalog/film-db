"use client";

import { SwitchToTabButton } from "@/components/film-page-tabs";
import type { FlickrPhoto } from "@/lib/flickr";
import type { BestFor } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";
import {
  ExternalLink,
  FileText,
  Play,
  UserCircle,
  Mountain,
  Building2,
  Heart,
  Plane,
  Moon,
  LampDesk,
  Sun,
} from "lucide-react";

const BEST_FOR_ICONS: Record<BestFor, React.ElementType> = {
  portrait: UserCircle,
  landscape: Mountain,
  street: Building2,
  wedding: Heart,
  travel: Plane,
  night: Moon,
  studio: LampDesk,
  everyday: Sun,
};

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
}

export function OverviewTabContent({
  description,
  flickrImages,
  shootingTips,
  reviewsFromWeb,
  videoReviews,
  purchaseLinks = [],
  bestFor = [],
}: OverviewTabContentProps) {
  const previewImages = flickrImages.slice(0, 4);
  const tipsPreview = shootingTips
    ? shootingTips.split(/\.\s+/).filter((s) => s.trim().length > 0).slice(0, 2)
    : [];

  return (
    <div className="space-y-8">
      {/* Top row: description (left) + Ideal for card (right pane, Your rating style) */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="min-w-0 flex-1">
          {description && (
            <p className="text-[15px] leading-relaxed text-foreground/80">
              {description}
            </p>
          )}
        </div>
        {bestFor.length > 0 && (
          <div className="w-full shrink-0 sm:w-56">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-3">
              <p className="mb-3 text-center text-sm font-medium tracking-wider text-muted-foreground">Ideal for</p>
              <div className="grid grid-cols-2 gap-2">
                {bestFor.map((key) => {
                  const Icon = BEST_FOR_ICONS[key];
                  const label = BEST_FOR_LABELS[key];
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2.5 min-h-[4.5rem]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-primary">
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </span>
                      <span className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight break-words">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-width sections below */}
      <div className="border-t border-border/50 pt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Example images</h3>
            <SwitchToTabButton tabId="gallery">View all</SwitchToTabButton>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {previewImages.length > 0 ? (
              previewImages.map((img) => (
                <a
                  key={img.id}
                  href={img.flickrPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-border/50 bg-card aspect-[4/3]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.title || ""}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))
            ) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl border border-border/50 bg-card bg-muted/60" />
                ))}
              </>
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="rounded-lg border border-border/50 bg-secondary/30 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 hover:border-primary/40"
            >
              Upload your own
            </button>
          </div>
        {shootingTips && (
          <>
            <div className="mt-6 border-t border-border/50 pt-6">
              <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">Features</h3>
              <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
                {shootingTips.split(/\.\s+/).filter((s) => s.trim().length > 0).map((tip, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {tip.endsWith(".") ? tip : `${tip}.`}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Reviews from the web */}
      {reviewsFromWeb.length > 0 && (
        <div className="border-t border-border/50 pt-8">
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
        <div className="border-t border-border/50 pt-8">
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

      {/* Notes */}
      <div className="border-t border-border/50 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Notes</h3>
          <SwitchToTabButton tabId="reviews">View all</SwitchToTabButton>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          {tipsPreview.length > 0 ? (
            <ul className="space-y-2 text-sm leading-relaxed text-foreground/80">
              {tipsPreview.map((tip, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {tip.endsWith(".") ? tip : `${tip}.`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Shooting notes and community reviews.</p>
          )}
        </div>
      </div>

      {/* Buy this stock */}
      {purchaseLinks.length > 0 && (
        <div className="border-t border-border/50 pt-8">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="px-4 py-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Buy this stock</h2>
          </div>
          <div className="pb-5">
            {purchaseLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-sm leading-tight text-foreground/80 break-words">{link.retailer_name}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
