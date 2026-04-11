"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Aperture, Camera as CameraIcon, Loader2 } from "lucide-react";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import {
  collectLightboxSlidesFromGalleryImages,
  findGalleryImageForLightboxSlide,
  relatedGalleryLightboxSlidesForStock,
} from "@/lib/lightbox-group";
import type { GalleryImage } from "@/lib/sample-images";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import { FilmStockSummaryRow } from "@/components/film-stock-list-card";
import {
  getDiscoverSearchPayload,
  type DiscoverSearchPayload,
  type SearchBrandsResult,
  type SearchCamerasResult,
  type SearchShotsResult,
  type SearchStocksResult,
  type SearchUsersResult,
} from "@/app/actions/search";
import { shareRollPickerSectionLabelClassName } from "@/components/share-roll-picker-primitives";
import { brandCatalogMatchRank, matchRank } from "@/lib/search-entity-match-rank";
import {
  DiscoverRailCarousel,
  DiscoverRailCell,
  discoverRailFrameWidth,
  useDiscoverRailHeight,
} from "@/components/discover-rail-carousel";

const DEBOUNCE_MS = 300;

export interface SearchPageClientProps {
  carousels: {
    gold200: SearchShotsResult[];
    portra400: SearchShotsResult[];
  };
}

type TypingMixedRow =
  | { key: string; kind: "stock"; name: string; href: string; imageUrl: string | null; brandInitial: string; specLine: string; scanCount: number }
  | { key: string; kind: "camera"; name: string; href: string; specLine: "CAMERA"; scanCount: number }
  | { key: string; kind: "brand"; name: string; href: string; specLine: "BRAND"; scanCount: number }
  | { key: string; kind: "user"; name: string; href: string; initial: string; specLine: "USER" };

function stockSpecLine(): string {
  return "Film stock";
}

function typingRowMatchRank(row: TypingMixedRow, query: string): number {
  if (row.kind === "brand") return brandCatalogMatchRank(row.name, query);
  return matchRank(row.name, query);
}

function cleanCameraName(camera: SearchCamerasResult): string {
  const raw = camera.name.trim();
  const brand = camera.brandName.trim();
  if (!raw) return brand || "Camera";
  if (!brand) return raw;
  const rawLower = raw.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (rawLower.startsWith(`${brandLower} `)) return raw;
  return `${brand} ${raw}`;
}

function StockSearchRow({ stock }: { stock: SearchStocksResult }) {
  return (
    <Link
      href={`/films/${stock.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={stock.name}
        imageUrl={stock.imageUrl}
        brandInitial={stock.brandName?.charAt(0)}
        specLine={stockSpecLine()}
        showDivider={false}
      />
    </Link>
  );
}

function CameraSearchRow({ camera }: { camera: SearchCamerasResult }) {
  return (
    <Link
      href={`/cameras/${camera.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={cleanCameraName(camera)}
        specLine="CAMERA"
        showDivider={false}
        customThumb={
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <CameraIcon className="h-5 w-5" aria-hidden />
          </div>
        }
      />
    </Link>
  );
}

function UserSearchRow({ user }: { user: SearchUsersResult }) {
  const displayName = user.display_name?.trim() || "Member";
  const initial = displayName.slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/users/${user.id}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={displayName}
        specLine="USER"
        showDivider={false}
        customThumb={
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
            {initial}
          </div>
        }
      />
    </Link>
  );
}

function shotToGalleryImage(shot: SearchShotsResult): GalleryImage | null {
  if (!shot.imageUrl) return null;
  const settingsParts = [
    shot.shot_date,
    shot.tags,
    shot.format,
    shot.location,
    shot.shot_iso,
    shot.lens,
    shot.lab,
    shot.push_pull,
    shot.scanner,
  ].filter(Boolean);
  return {
    id: shot.id,
    galleryId: `search-${shot.id}`,
    stockSlug: shot.stockSlug,
    stockName: shot.stockName,
    brandName: shot.brandName,
    username: shot.username,
    camera: shot.camera ?? "",
    settings: shot.settings ?? settingsParts.join(" · "),
    likes: Number(shot.likes ?? 0),
    saves: Number(shot.saves ?? 0),
    source: "community",
    imageUrl: shot.imageUrl,
    caption: shot.caption ?? null,
    shot_iso: shot.shot_iso ?? null,
    lens: shot.lens ?? null,
    lab: shot.lab ?? null,
    scanner: shot.scanner ?? null,
    push_pull: shot.push_pull ?? null,
    format: shot.format ?? null,
    shot_date: shot.shot_date ?? null,
    tags: shot.tags ?? null,
    location: shot.location ?? null,
    reviewTitle: shot.reviewTitle ?? null,
    reviewId: shot.reviewId ?? null,
    rollId: shot.rollId ?? null,
    uploadBatchId: shot.uploadBatchId ?? null,
    stockIso: shot.stockIso ?? null,
    stockType: shot.stockType,
    stockFormat: shot.stockFormat ?? [],
    stockImageUrl: shot.stockImageUrl ?? null,
    uploadId: shot.id,
    userId: shot.userId,
  };
}

function TypingSection<T>({
  title,
  items,
  render,
}: {
  title: string;
  items: T[];
  render: (item: T, idx: number) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="pt-4">
      <p className={shareRollPickerSectionLabelClassName}>{title}</p>
      <div className="mt-2 divide-y divide-border rounded-md bg-card">
        {items.map((item, idx) => render(item, idx))}
      </div>
    </section>
  );
}

export function SearchPageClient({ carousels }: SearchPageClientProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [resultsArmed, setResultsArmed] = useState(false);
  const [payloadState, setPayloadState] = useState<{ query: string; data: DiscoverSearchPayload } | null>(null);
  const [imageDimensionsById, setImageDimensionsById] = useState<Record<string, { width: number; height: number }>>({});
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
    galleryImages: GalleryImage[];
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railHeight = useDiscoverRailHeight();

  const handleShotImageLoad = (shotId: string, width: number, height: number) => {
    setImageDimensionsById((prev) => {
      const current = prev[shotId];
      if (current && current.width === width && current.height === height) return prev;
      return {
        ...prev,
        [shotId]: { width, height },
      };
    });
  };

  const openShotLightbox = (shots: SearchShotsResult[], shotId: string) => {
    const galleryImages = shots
      .map((shot) => shotToGalleryImage(shot))
      .filter((item): item is GalleryImage => item !== null);
    if (galleryImages.length === 0) return;
    const clicked = galleryImages.find((image) => image.id === shotId || image.uploadId === shotId);
    if (!clicked) return;
    const session = collectLightboxSlidesFromGalleryImages(galleryImages, clicked);
    setLightboxSession({ ...session, galleryImages });
  };

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    return relatedGalleryLightboxSlidesForStock(lightboxSession.slides[0]!, lightboxSession.galleryImages);
  }, [lightboxSession]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) {
      return;
    }
    let cancelled = false;
    getDiscoverSearchPayload(query).then((data) => {
      if (cancelled) return;
      setPayloadState({ query, data });
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const hasQuery = debouncedQuery.length > 0;
  const activePayload = hasQuery && payloadState?.query === debouncedQuery ? payloadState.data : null;
  const showLoading = hasQuery && payloadState?.query !== debouncedQuery;
  const mode: "default" | "typing" | "results" = !hasQuery
    ? "default"
    : resultsArmed || !searchFocused
      ? "results"
      : "typing";

  const hasAnyResults = useMemo(() => {
    if (!activePayload) return false;
    return (
      activePayload.results.stocks.length > 0 ||
      activePayload.results.cameras.length > 0 ||
      activePayload.results.users.length > 0 ||
      activePayload.results.shots.length > 0 ||
      activePayload.results.brands.length > 0
    );
  }, [activePayload]);

  const typingRows = useMemo<TypingMixedRow[]>(() => {
    if (!activePayload || !debouncedQuery.trim()) return [];
    const rows: TypingMixedRow[] = [
      ...(activePayload.typing.stocks ?? []).map((stock) => ({
        key: `stock-${stock.slug}`,
        kind: "stock" as const,
        name: stock.name,
        href: `/films/${stock.slug}`,
        imageUrl: stock.imageUrl ?? null,
        brandInitial: stock.brandName?.charAt(0) ?? "?",
        specLine: stockSpecLine(),
        scanCount: stock.scanCount ?? 0,
      })),
      ...(activePayload.typing.cameras ?? []).map((camera) => ({
        key: `camera-${camera.slug}`,
        kind: "camera" as const,
        name: cleanCameraName(camera),
        href: `/cameras/${camera.slug}`,
        specLine: "CAMERA" as const,
        scanCount: camera.scanCount ?? 0,
      })),
      ...(activePayload.typing.users ?? []).map((user) => {
        const name = user.display_name?.trim() || "Member";
        return {
          key: `user-${user.id}`,
          kind: "user" as const,
          name,
          href: `/users/${user.id}`,
          initial: name.slice(0, 2).toUpperCase(),
          specLine: "USER" as const,
        };
      }),
      ...(activePayload.typing.brands ?? []).map((b) => ({
        key: `${b.kind ?? "catalog"}-brand-${b.slug}`,
        kind: "brand" as const,
        name: b.name,
        href:
          b.kind === "cameras_only"
            ? `/cameras?brand=${encodeURIComponent(b.slug)}`
            : `/brands/${b.slug}`,
        specLine: "BRAND" as const,
        scanCount: b.scanCount ?? 0,
      })),
    ];
    const query = debouncedQuery.trim();
    return rows.sort((a, b) => {
      const rankDiff = typingRowMatchRank(a, query) - typingRowMatchRank(b, query);
      if (rankDiff !== 0) return rankDiff;

      const aScan = a.kind === "user" ? -1 : a.scanCount;
      const bScan = b.kind === "user" ? -1 : b.scanCount;
      if (bScan !== aScan) return bScan - aScan;

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [activePayload, debouncedQuery]);

  return (
    <div
      className="mobile-safe-bottom-clear-bar mx-auto max-w-7xl bg-white px-4 pb-24 pt-4 sm:px-6 lg:px-8 md:pb-8"
      style={{ ["--mobile-bottom-clearance" as string]: "4.5rem" }}
    >
      <div className="mx-auto max-w-2xl">
        <SearchPageHeaderForm
          value={inputValue}
          onChange={(value) => {
            setInputValue(value);
            setResultsArmed(false);
          }}
          onClear={() => {
            setInputValue("");
            setResultsArmed(false);
          }}
          onFocus={() => setSearchFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setResultsArmed(true);
              setSearchFocused(false);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          placeholder="Search images, film stocks, cameras, lists, users"
          ariaLabel="Search images, film stocks, cameras, lists, users"
          showSearchIcon
        />

        {mode === "default" ? (
          <div className="pt-2">
            <DiscoverRailCarousel
              title="Shot on Kodak Gold 200"
              headerHref="/images/film/kodak-gold-200"
              headerTitleId="discover-rail-kodak-gold-200-heading"
              items={carousels.gold200.map((s) => ({
                id: s.id,
                imageUrl: s.imageUrl,
                imageAlt: s.stockName,
                username: s.username,
                userId: s.userId,
              }))}
              imageDimensionsById={imageDimensionsById}
              onImageLoad={handleShotImageLoad}
              onOpenItem={(id) => openShotLightbox(carousels.gold200, id)}
            />
            <DiscoverRailCarousel
              title="Shot on Portra 400"
              headerHref="/images/film/kodak-portra-400"
              headerTitleId="discover-rail-kodak-portra-400-heading"
              items={carousels.portra400.map((s) => ({
                id: s.id,
                imageUrl: s.imageUrl,
                imageAlt: s.stockName,
                username: s.username,
                userId: s.userId,
              }))}
              imageDimensionsById={imageDimensionsById}
              onImageLoad={handleShotImageLoad}
              onOpenItem={(id) => openShotLightbox(carousels.portra400, id)}
            />
          </div>
        ) : mode === "typing" ? (
          <div className="pt-2">
            {showLoading ? (
              <div className="flex min-h-[55vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : (
              <div className="mt-2 divide-y divide-border rounded-md bg-card">
                {typingRows.map((row) => {
                  if (row.kind === "stock") {
                    return (
                      <Link
                        key={row.key}
                        href={row.href}
                        className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                      >
                        <FilmStockSummaryRow
                          name={row.name}
                          imageUrl={row.imageUrl}
                          brandInitial={row.brandInitial}
                          specLine={row.specLine}
                          showDivider={false}
                        />
                      </Link>
                    );
                  }
                  if (row.kind === "camera") {
                    return (
                      <Link
                        key={row.key}
                        href={row.href}
                        className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                      >
                        <FilmStockSummaryRow
                          name={row.name}
                          specLine={row.specLine}
                          showDivider={false}
                          customThumb={
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <CameraIcon className="h-5 w-5" aria-hidden />
                            </div>
                          }
                        />
                      </Link>
                    );
                  }
                  if (row.kind === "brand") {
                    return (
                      <Link
                        key={row.key}
                        href={row.href}
                        className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                      >
                        <FilmStockSummaryRow
                          name={row.name}
                          specLine={row.specLine}
                          showDivider={false}
                          customThumb={
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Aperture className="h-5 w-5" aria-hidden />
                            </div>
                          }
                        />
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={row.key}
                      href={row.href}
                      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                    >
                      <FilmStockSummaryRow
                        name={row.name}
                        specLine={row.specLine}
                        showDivider={false}
                        customThumb={
                          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                            {row.initial}
                          </div>
                        }
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="pt-4">
            {showLoading ? <p className="text-sm text-muted-foreground">Loading results…</p> : null}
            {!showLoading && activePayload?.bestResult ? (
              <section className="mb-4 rounded-xl border border-border bg-card p-3">
                <p className={shareRollPickerSectionLabelClassName}>Top Result</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {activePayload.bestResult.type === "stock"
                    ? `${activePayload.bestResult.value.brandName} ${activePayload.bestResult.value.name}`
                    : activePayload.bestResult.type === "camera"
                      ? `${activePayload.bestResult.value.brandName} ${activePayload.bestResult.value.name}`
                      : activePayload.bestResult.type === "user"
                        ? activePayload.bestResult.value.display_name ?? "Member"
                        : activePayload.bestResult.type === "shot"
                          ? activePayload.bestResult.value.stockName
                          : activePayload.bestResult.type === "brand"
                            ? activePayload.bestResult.value.name
                            : activePayload.bestResult.value.title}
                </p>
              </section>
            ) : null}

            {!showLoading && !hasAnyResults ? (
              <div className="rounded-md border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                No results for &ldquo;{debouncedQuery}&rdquo; yet.
              </div>
            ) : null}

            {activePayload?.results.shots.length ? (
              <section className="pt-2">
                <p className={shareRollPickerSectionLabelClassName}>Images</p>
                <div className="-mx-4 mt-2 overflow-hidden">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-1">
                    {activePayload.results.shots.map((shot) => (
                      <div key={shot.id} className="shrink-0">
                        <DiscoverRailCell
                          item={{
                            id: shot.id,
                            imageUrl: shot.imageUrl,
                            imageAlt: shot.stockName,
                          }}
                          frameHeight={railHeight}
                          frameWidth={discoverRailFrameWidth(imageDimensionsById[shot.id], railHeight)}
                          onImageLoad={handleShotImageLoad}
                          onOpen={() => openShotLightbox(activePayload.results.shots, shot.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <TypingSection<SearchStocksResult>
              title="Film Stocks"
              items={activePayload?.results.stocks ?? []}
              render={(stock) => (
                <StockSearchRow key={stock.slug} stock={stock} />
              )}
            />
            <TypingSection<SearchCamerasResult>
              title="Cameras"
              items={activePayload?.results.cameras ?? []}
              render={(camera) => (
                <CameraSearchRow key={camera.slug} camera={camera} />
              )}
            />
            <TypingSection<SearchBrandsResult>
              title="Brands"
              items={activePayload?.results.brands ?? []}
              render={(b) => (
                <Link
                  key={`${b.kind ?? "catalog"}-${b.slug}`}
                  href={
                    b.kind === "cameras_only"
                      ? `/cameras?brand=${encodeURIComponent(b.slug)}`
                      : `/brands/${b.slug}`
                  }
                  className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                >
                  <FilmStockSummaryRow
                    name={b.name}
                    specLine="BRAND"
                    showDivider={false}
                    customThumb={
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Aperture className="h-5 w-5" aria-hidden />
                      </div>
                    }
                  />
                </Link>
              )}
            />
            <TypingSection<SearchUsersResult>
              title="Users"
              items={activePayload?.results.users ?? []}
              render={(user) => (
                <UserSearchRow key={user.id} user={user} />
              )}
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
            if (!lightboxSession) return;
            const image = findGalleryImageForLightboxSlide(slide, lightboxSession.galleryImages);
            if (!image) return;
            const session = collectLightboxSlidesFromGalleryImages(lightboxSession.galleryImages, image);
            setLightboxSession({ ...session, galleryImages: lightboxSession.galleryImages });
          }}
        />
      ) : null}
    </div>
  );
}
