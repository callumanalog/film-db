"use client";

import { useCallback, useMemo, useState } from "react";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import { ImageDestinationGrid } from "@/components/image-destination-grid";
import type { FilmUploadRow } from "@/app/actions/uploads";
import {
  collectLightboxSlidesFromFilmUploads,
  type FilmStockLightboxSummary,
  relatedFilmPageLightboxSlides,
  relatedUploadsMatchingFilmStockLightboxSlides,
} from "@/lib/lightbox-group";

type FilmMode = {
  mode: "film";
  stockName: string;
  stockSlug: string;
  stockSummary: FilmStockLightboxSummary;
};

type CameraMode = {
  mode: "camera";
  stockBySlug: Record<string, { name: string; summary: FilmStockLightboxSummary }>;
};

export type ImageDestinationScansClientProps = {
  uploads: FilmUploadRow[];
} & (FilmMode | CameraMode);

function resolveStockForUpload(
  u: FilmUploadRow,
  props: ImageDestinationScansClientProps
): { stockName: string; stockSlug: string; stockSummary: FilmStockLightboxSummary | null } {
  if (props.mode === "film") {
    return {
      stockName: props.stockName,
      stockSlug: props.stockSlug,
      stockSummary: props.stockSummary,
    };
  }
  const slug = u.film_stock_slug;
  const row = props.stockBySlug[slug];
  if (row) {
    return { stockName: row.name, stockSlug: slug, stockSummary: row.summary };
  }
  return {
    stockName: slug.replace(/-/g, " "),
    stockSlug: slug,
    stockSummary: null,
  };
}

export function ImageDestinationScansClient(props: ImageDestinationScansClientProps) {
  const { uploads } = props;
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const items = useMemo(
    () =>
      uploads
        .filter((u): u is typeof u & { image_url: string } => Boolean(u.image_url?.trim()))
        .map((u) => ({ id: u.id, imageUrl: u.image_url })),
    [uploads]
  );

  const openLightbox = useCallback(
    (uploadId: string) => {
      const clicked = uploads.find((u) => u.id === uploadId);
      if (!clicked?.image_url?.trim()) return;
      const { stockName, stockSlug, stockSummary } = resolveStockForUpload(clicked, props);
      setLightboxSession(
        collectLightboxSlidesFromFilmUploads(uploads, clicked, stockName, stockSlug, stockSummary ?? undefined)
      );
    },
    [uploads, props]
  );

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    const cur = lightboxSession.slides[0]!;
    if (props.mode === "film") {
      return relatedFilmPageLightboxSlides(cur, uploads, [], props.stockName, props.stockSlug, props.stockSummary);
    }
    return relatedUploadsMatchingFilmStockLightboxSlides(cur, uploads, props.stockBySlug);
  }, [lightboxSession, uploads, props]);

  const onPickRelatedStock = useCallback(
    (slide: ImageLightboxData) => {
      const id = slide.uploadId?.trim();
      if (!id) return;
      const clicked = uploads.find((u) => u.id === id);
      if (!clicked?.image_url?.trim()) return;
      const { stockName, stockSlug, stockSummary } = resolveStockForUpload(clicked, props);
      setLightboxSession(
        collectLightboxSlidesFromFilmUploads(uploads, clicked, stockName, stockSlug, stockSummary ?? undefined)
      );
    },
    [uploads, props]
  );

  if (items.length === 0) return null;

  return (
    <>
      <ImageDestinationGrid items={items} onItemClick={openLightbox} />
      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={relatedStockSlides.length > 0 ? onPickRelatedStock : undefined}
        />
      ) : null}
    </>
  );
}
