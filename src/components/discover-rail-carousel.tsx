"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CarouselViewAllHeader } from "@/components/carousel-view-all-header";

export const DISCOVER_RAIL_HEIGHT_MOBILE = 180;
export const DISCOVER_RAIL_HEIGHT_TABLET = 260;
export const DISCOVER_RAIL_HEIGHT_DESKTOP = 300;
export const DISCOVER_RAIL_FALLBACK_ASPECT = 3 / 4;

export function useDiscoverRailHeight(): number {
  const [railHeight, setRailHeight] = useState<number>(DISCOVER_RAIL_HEIGHT_MOBILE);

  useEffect(() => {
    const getHeight = () => {
      if (window.innerWidth >= 1024) return DISCOVER_RAIL_HEIGHT_DESKTOP;
      if (window.innerWidth >= 640) return DISCOVER_RAIL_HEIGHT_TABLET;
      return DISCOVER_RAIL_HEIGHT_MOBILE;
    };
    const onResize = () => setRailHeight(getHeight());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return railHeight;
}

export function discoverRailFrameWidth(
  dimensions: { width: number; height: number } | undefined,
  frameHeight: number,
): number {
  if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
    return (dimensions.width / dimensions.height) * frameHeight;
  }
  return DISCOVER_RAIL_FALLBACK_ASPECT * frameHeight;
}

export type DiscoverRailCellItem = {
  id: string;
  imageUrl: string | null;
  imageAlt: string;
};

export function DiscoverRailCell({
  item,
  frameHeight,
  frameWidth,
  onImageLoad,
  onOpen,
  priority = false,
}: {
  item: DiscoverRailCellItem;
  frameHeight: number;
  frameWidth: number;
  onImageLoad: (id: string, width: number, height: number) => void;
  onOpen: () => void;
  priority?: boolean;
}) {
  if (!item.imageUrl) {
    return (
      <div
        className="block overflow-hidden bg-card"
        style={{ width: `${Math.round(frameWidth)}px`, height: `${frameHeight}px` }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block overflow-hidden bg-card"
      style={{ width: `${Math.round(frameWidth)}px`, height: `${frameHeight}px` }}
    >
      <div className="relative h-full w-full overflow-hidden bg-slate-100">
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          width={Math.max(1, Math.round(frameWidth))}
          height={Math.max(1, frameHeight)}
          sizes={`${Math.max(1, Math.round(frameWidth))}px`}
          priority={priority}
          className="h-full w-full"
          onLoad={(event) => {
            const target = event.currentTarget;
            if (target.naturalWidth > 0 && target.naturalHeight > 0) {
              onImageLoad(item.id, target.naturalWidth, target.naturalHeight);
            }
          }}
        />
      </div>
    </button>
  );
}

export type DiscoverRailCarouselItem = DiscoverRailCellItem & {
  username?: string | null;
  userId?: string | null;
};

/** Horizontal discover rail only (no section title). Used on film overview scans + search results. */
export function DiscoverRailStrip({
  items,
  imageDimensionsById,
  onImageLoad,
  onOpenItem,
  bleedX = true,
}: {
  items: DiscoverRailCarouselItem[];
  imageDimensionsById: Record<string, { width: number; height: number }>;
  onImageLoad: (id: string, width: number, height: number) => void;
  onOpenItem: (id: string) => void;
  /** When true, uses `-mx-4` + `px-4` so the rail lines up with page gutters. */
  bleedX?: boolean;
}) {
  const railHeight = useDiscoverRailHeight();
  if (items.length === 0) return null;

  const outerBleed = bleedX ? "-mx-4 overflow-hidden" : "overflow-hidden";
  const innerPad = bleedX ? "px-4 pb-1" : "pb-1";

  return (
    <div className={outerBleed}>
      <div className={`scrollbar-hide flex gap-2 overflow-x-auto ${innerPad}`}>
        {items.map((item, index) => (
          <article key={item.id} className="shrink-0">
            <DiscoverRailCell
              item={item}
              frameHeight={railHeight}
              frameWidth={discoverRailFrameWidth(imageDimensionsById[item.id], railHeight)}
              onImageLoad={onImageLoad}
              onOpen={() => onOpenItem(item.id)}
              priority={index < 4}
            />
            {item.username?.trim() ? (
              item.userId ? (
                <Link
                  href={`/users/${item.userId}`}
                  className="mt-1.5 block truncate text-xs font-medium leading-tight text-foreground hover:underline"
                >
                  {item.username}
                </Link>
              ) : (
                <p className="mt-1.5 truncate text-xs font-medium leading-tight text-foreground">{item.username}</p>
              )
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

/**
 * Horizontal “discover” rail used on the search landing page: fixed frame height,
 * width from each image’s aspect ratio, uploader line under each cell.
 */
export function DiscoverRailCarousel({
  title,
  headerHref,
  headerTitleId,
  items,
  imageDimensionsById,
  onImageLoad,
  onOpenItem,
  bleedX = true,
}: {
  title: string;
  /** When set, title row matches film overview “Scans” pattern and links here (e.g. `/images/film/{slug}`). */
  headerHref?: string;
  headerTitleId?: string;
  items: DiscoverRailCarouselItem[];
  imageDimensionsById: Record<string, { width: number; height: number }>;
  onImageLoad: (id: string, width: number, height: number) => void;
  onOpenItem: (id: string) => void;
  bleedX?: boolean;
}) {
  if (items.length === 0) return null;
  const sectionLabelledBy = headerHref && headerTitleId ? headerTitleId : undefined;
  return (
    <section
      className="pt-4"
      {...(sectionLabelledBy ? { "aria-labelledby": sectionLabelledBy } : { "aria-label": title })}
    >
      {headerHref ? (
        <CarouselViewAllHeader href={headerHref} title={title} titleId={headerTitleId} />
      ) : (
        <h2 className="font-sans text-base font-semibold text-foreground">{title}</h2>
      )}
      <DiscoverRailStrip
        items={items}
        imageDimensionsById={imageDimensionsById}
        onImageLoad={onImageLoad}
        onOpenItem={onOpenItem}
        bleedX={bleedX}
      />
    </section>
  );
}
