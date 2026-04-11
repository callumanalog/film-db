"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CommunityGalleryUpload } from "@/app/actions/uploads";
import type { GalleryImage } from "@/lib/sample-images";
import { DiscoverRailCarousel } from "@/components/discover-rail-carousel";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import {
  collectLightboxSlidesFromGalleryImages,
  findGalleryImageForLightboxSlide,
  relatedGalleryLightboxSlidesForStock,
} from "@/lib/lightbox-group";

function uploadToGalleryImage(u: CommunityGalleryUpload): GalleryImage | null {
  if (!u.imageUrl) return null;
  const settingsParts = [
    u.shot_date,
    u.tags,
    u.format,
    u.location,
    u.shot_iso,
    u.lens,
    u.lab,
    u.scanner,
    u.push_pull,
  ].filter(Boolean);
  return {
    id: u.id,
    galleryId: u.galleryId,
    stockSlug: u.stockSlug,
    stockName: u.stockName,
    brandName: u.brandName,
    username: u.username,
    userId: u.userId,
    camera: u.camera ?? "",
    settings: u.settings || settingsParts.join(" · "),
    likes: Number(u.likes ?? 0),
    saves: Number(u.saves ?? 0),
    source: "community",
    imageUrl: u.imageUrl,
    caption: u.caption ?? null,
    shot_iso: u.shot_iso ?? null,
    lens: u.lens ?? null,
    lab: u.lab ?? null,
    scanner: u.scanner ?? null,
    push_pull: u.push_pull ?? null,
    format: u.format ?? null,
    shot_date: u.shot_date ?? null,
    tags: u.tags ?? null,
    location: u.location ?? null,
    reviewTitle: u.reviewTitle ?? null,
    reviewId: u.reviewId ?? null,
    rollId: u.rollId ?? null,
    uploadBatchId: u.uploadBatchId ?? null,
    stockIso: u.stockIso ?? null,
    stockType: u.stockType,
    stockFormat: u.stockFormat ?? [],
    stockImageUrl: u.stockImageUrl ?? null,
    uploadId: u.id,
  };
}

export function BrandCommunityRail({
  brandSlug,
  uploads,
}: {
  brandSlug: string;
  uploads: CommunityGalleryUpload[];
}) {
  const [imageDimensionsById, setImageDimensionsById] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
    galleryImages: GalleryImage[];
  } | null>(null);

  const galleryImages = useMemo(() => {
    return uploads.map(uploadToGalleryImage).filter((g): g is GalleryImage => g != null);
  }, [uploads]);

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    return relatedGalleryLightboxSlidesForStock(lightboxSession.slides[0]!, lightboxSession.galleryImages);
  }, [lightboxSession]);

  if (galleryImages.length === 0) return null;

  const handleShotImageLoad = (shotId: string, width: number, height: number) => {
    setImageDimensionsById((prev) => {
      const current = prev[shotId];
      if (current && current.width === width && current.height === height) return prev;
      return { ...prev, [shotId]: { width, height } };
    });
  };

  const openShotLightbox = (shotId: string) => {
    const clicked = galleryImages.find((image) => image.id === shotId || image.uploadId === shotId);
    if (!clicked) return;
    const session = collectLightboxSlidesFromGalleryImages(galleryImages, clicked);
    setLightboxSession({ ...session, galleryImages });
  };

  return (
    <>
      <DiscoverRailCarousel
        title="Community scans"
        headerHref="/community"
        headerTitleId={`brand-rail-community-${brandSlug}`}
        items={galleryImages.map((g) => ({
          id: g.id,
          imageUrl: g.imageUrl ?? null,
          imageAlt: g.stockName,
          username: g.username,
          userId: g.userId,
        }))}
        imageDimensionsById={imageDimensionsById}
        onImageLoad={handleShotImageLoad}
        onOpenItem={(id) => openShotLightbox(id)}
      />
      <p className="mt-2 text-center md:text-left">
        <Link href="/community" className="text-sm font-medium text-primary hover:underline">
          Browse community
        </Link>
      </p>
      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={(slide) => {
            if (!lightboxSession) return;
            const image = findGalleryImageForLightboxSlide(slide, lightboxSession.galleryImages);
            if (!image) return;
            const session = collectLightboxSlidesFromGalleryImages(lightboxSession.galleryImages, image);
            setLightboxSession({ ...session, galleryImages: lightboxSession.galleryImages });
          }}
        />
      ) : null}
    </>
  );
}
