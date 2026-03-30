"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Share2 } from "lucide-react";
import { getProfileFromSupabase } from "@/app/actions/get-profile";
import { getStocksBySlugs } from "@/app/actions/get-film-stocks";
import { FilmNativeGrid } from "@/components/film-native-grid";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import { cn } from "@/lib/utils";
import {
  collectLightboxSlidesFromGalleryImages,
  findGalleryImageForLightboxSlide,
  relatedGalleryLightboxSlidesForStock,
} from "@/lib/lightbox-group";
import type { GalleryImage } from "@/lib/sample-images";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

type SavedRow = {
  savedUploadId: string;
  upload_id: string;
  film_stock_slug: string;
  image_url: string | null;
  caption: string | null;
  saved_at: string;
  uploaderUserId: string;
  uploaderDisplayName: string | null;
};

function savedToGalleryImages(
  saved: SavedRow[],
  stocksBySlug: Map<string, StockWithBrand>
): GalleryImage[] {
  return saved
    .filter((u) => u.image_url)
    .map((u) => {
      const stock = stocksBySlug.get(u.film_stock_slug);
      const label = u.uploaderDisplayName?.trim() || "Member";
      return {
        id: u.upload_id,
        galleryId: `saved-${u.film_stock_slug}-${u.upload_id}`,
        stockSlug: u.film_stock_slug,
        stockName: stock?.name ?? u.film_stock_slug,
        brandName: stock?.brand.name ?? "",
        username: label,
        camera: "",
        settings: "",
        likes: 0,
        source: "community" as const,
        imageUrl: u.image_url!,
        caption: u.caption,
        uploadId: u.upload_id,
        userId: u.uploaderUserId,
      };
    });
}

export function AllSavedImagesPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await getProfileFromSupabase();
      const rows = p?.savedUploads ?? [];
      setSaved(rows);
      const slugs = [...new Set(rows.map((r) => r.film_stock_slug))];
      if (slugs.length === 0) {
        setStocksBySlug(new Map());
        return;
      }
      const stocks = await getStocksBySlugs(slugs);
      const map = new Map<string, StockWithBrand>();
      stocks.forEach((s) => map.set(s.slug, s as StockWithBrand));
      setStocksBySlug(map);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/sign-in?next=/profile/boards/all");
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  const galleryImages = useMemo(
    () => savedToGalleryImages(saved, stocksBySlug),
    [saved, stocksBySlug]
  );

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    return relatedGalleryLightboxSlidesForStock(lightboxSession.slides[0], galleryImages);
  }, [lightboxSession, galleryImages]);

  const count = galleryImages.length;

  async function shareSavedPage() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "All saved scans", url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToastViaEvent("Link copied.");
    } catch {
      showToastViaEvent("Could not copy link.");
    }
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-white dark:bg-background">
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-white dark:bg-background"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-2 sm:px-6">
          <Link
            href="/profile"
            className={topLeftNavIconButtonClassName}
            aria-label="Back to profile"
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => void shareSavedPage()}
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
              aria-label="More options"
              onClick={() => showToastViaEvent("More options coming soon.")}
            >
              <MoreHorizontal className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4 pt-0 sm:px-6">
          <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground md:text-[1.75rem]">
            All saved scans
          </h1>
          <span className="mt-1 block font-sans text-[10px] font-medium uppercase leading-tight tracking-wider text-muted-foreground">
            {loading ? "…" : `${count} ${count === 1 ? "scan" : "scans"}`}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-4 pb-24 pt-0 sm:px-6 md:pb-8">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : count === 0 ? (
          <p className="px-2 py-16 text-center text-sm text-muted-foreground">
            You haven&apos;t saved any scans yet. Save shots from Discover or Community to see them here.
          </p>
        ) : (
          <div
            className={cn(
              "min-w-0",
              "max-md:-mx-4 max-md:w-[calc(100%+2rem)]",
              "sm:max-md:-mx-6 sm:max-md:w-[calc(100%+3rem)]",
              "md:mx-0 md:w-full"
            )}
          >
            <FilmNativeGrid
              images={galleryImages}
              onOpenGalleryImage={(img) =>
                setLightboxSession(collectLightboxSlidesFromGalleryImages(galleryImages, img))
              }
            />
          </div>
        )}
      </div>

      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={(slide) => {
            const img = findGalleryImageForLightboxSlide(slide, galleryImages);
            if (img) {
              setLightboxSession(collectLightboxSlidesFromGalleryImages(galleryImages, img));
            }
          }}
        />
      ) : null}
    </div>
  );
}
