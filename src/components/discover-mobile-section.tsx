"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilmNativeGrid } from "@/components/film-native-grid";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import { collectLightboxSlidesFromGalleryImages } from "@/lib/lightbox-group";
import type { GalleryImage } from "@/lib/sample-images";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DiscoverMobileSectionProps {
  images: GalleryImage[];
  brands: string[];
}

function applyDiscoverFilters(
  images: GalleryImage[],
  feed: "latest" | "popular",
  brand: string
): GalleryImage[] {
  let list = brand === "all" ? images : images.filter((img) => img.brandName === brand);
  if (feed === "popular") {
    list = [...list].sort((a, b) => b.likes - a.likes);
  }
  // latest: preserve server order (newest first from getAllCommunityUploadsForGallery)
  return list;
}

export function DiscoverMobileSection({ images, brands }: DiscoverMobileSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftBrand, setDraftBrand] = useState("all");
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const feed = searchParams.get("feed") === "latest" ? "latest" : "popular";
  const brandParam = searchParams.get("brand")?.trim() || "all";
  const validBrand =
    brandParam === "all" || brands.includes(brandParam) ? brandParam : "all";

  const processedImages = useMemo(
    () => applyDiscoverFilters(images, feed, validBrand),
    [images, feed, validBrand]
  );

  useEffect(() => {
    const onOpen = () => {
      setDraftBrand(validBrand);
      setSheetOpen(true);
    };
    window.addEventListener("openDiscoverFilters", onOpen);
    return () => window.removeEventListener("openDiscoverFilters", onOpen);
  }, [validBrand]);

  const applyFilters = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (draftBrand === "all") p.delete("brand");
    else p.set("brand", draftBrand);
    const q = p.toString();
    router.replace(q ? `/?${q}` : "/", { scroll: false });
    setSheetOpen(false);
  }, [draftBrand, router, searchParams]);

  const clearFilters = useCallback(() => {
    setDraftBrand("all");
    const p = new URLSearchParams(searchParams.toString());
    p.delete("brand");
    const q = p.toString();
    router.replace(q ? `/?${q}` : "/", { scroll: false });
    setSheetOpen(false);
  }, [router, searchParams]);

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" showCloseButton className="gap-0 pb-8">
          <SheetHeader className="pb-4 text-left">
            <SheetTitle>Filter discover</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-1">
            <div>
              <label htmlFor="discover-filter-brand" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Brand
              </label>
              <select
                id="discover-filter-brand"
                value={draftBrand}
                onChange={(e) => setDraftBrand(e.target.value)}
                className="w-full rounded-card border border-border/50 bg-card px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 rounded-card border border-border/50 bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="flex-1 rounded-card bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Apply
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:hidden w-screen max-w-none relative left-1/2 -translate-x-1/2">
        {processedImages.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No images match this brand. Try another filter.
          </div>
        ) : (
          <FilmNativeGrid
            images={processedImages}
            onOpenGalleryImage={(img) =>
              setLightboxSession(collectLightboxSlidesFromGalleryImages(processedImages, img))
            }
          />
        )}
      </div>

      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
        />
      ) : null}
    </>
  );
}
