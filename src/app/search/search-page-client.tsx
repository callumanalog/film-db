"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Aperture, Camera as CameraIcon, ChevronRight, List as ListIcon, Loader2 } from "lucide-react";
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
  cleanCameraName,
  cleanStockDisplayName,
  StockSearchRow,
  CameraSearchRow,
} from "@/components/search-result-rows";
import {
  getDiscoverSearchPayload,
  type DiscoverSearchPayload,
  type SearchBrandsResult,
  type SearchCamerasResult,
  type SearchListsResult,
  type SearchShotsResult,
  type SearchStocksResult,
  type SearchUsersResult,
} from "@/app/actions/search";
import { brandCatalogMatchRank, matchRank } from "@/lib/search-entity-match-rank";
import { buildFilmStockTypeSpecLine } from "@/lib/film-stock-spec-line";
import { DiscoverRailCarousel } from "@/components/discover-rail-carousel";
import { CarouselViewAllHeader } from "@/components/carousel-view-all-header";
import { FilmNativeMasonryGrid, type FilmNativeMasonryItem } from "@/components/film-native-grid";
import { cn } from "@/lib/utils";
import {
  DISCOVER_SEARCH_FAB_VISIBILITY_EVENT,
  type DiscoverSearchFabVisibilityDetail,
} from "@/lib/discover-search-fab-visibility";

const DEBOUNCE_MS = 300;
/** Max scan tiles in search “All” and “Scans” masonry previews. */
const SEARCH_SCANS_MASONRY_MAX = 10;

/** Empty discover / tab state: same typography as `FilmStockSummaryRow` title. */
function DiscoverSearchNoResultsLine({ query, className }: { query: string; className?: string }) {
  const q = query.trim();
  return (
    <p className={cn("mt-6 truncate text-left font-sans text-base font-semibold text-foreground", className)}>
      {`No results for "${q}"`}
    </p>
  );
}

const DISCOVER_TOP_RESULT_THUMB_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

const SEARCH_RESULT_TAB_IDS = ["all", "scans", "stocks", "cameras", "brands", "lists", "users"] as const;
export type SearchResultsTabId = (typeof SEARCH_RESULT_TAB_IDS)[number];

function isSearchResultsTabId(value: string | null): value is SearchResultsTabId {
  return value !== null && (SEARCH_RESULT_TAB_IDS as readonly string[]).includes(value);
}

function buildDiscoverSearchUrl(query: string, tab: SearchResultsTabId): string {
  const params = new URLSearchParams();
  params.set("q", query);
  if (tab !== "all") params.set("tab", tab);
  return `/search?${params.toString()}`;
}

export interface SearchPageClientProps {
  carousels: {
    gold200: SearchShotsResult[];
    portra400: SearchShotsResult[];
  };
}

type TypingMixedRow =
  | {
      key: string;
      kind: "stock";
      name: string;
      brandName: string;
      href: string;
      imageUrl: string | null;
      brandInitial: string;
      specLine: string;
      scanCount: number;
    }
  | { key: string; kind: "camera"; name: string; href: string; specLine: "CAMERA"; scanCount: number }
  | { key: string; kind: "brand"; name: string; href: string; specLine: string; scanCount: number }
  | { key: string; kind: "user"; name: string; href: string; initial: string; specLine: "USER" };

function brandDiscoverSubtitle(b: SearchBrandsResult): string {
  if (b.kind === "cameras_only") {
    const n = b.cameraCatalogCount ?? 0;
    return `Brand · ${n} ${n === 1 ? "camera" : "cameras"}`;
  }
  const fs = b.filmStockCount ?? 0;
  const cam = b.cameraCatalogCount ?? 0;
  return `Brand · ${fs} ${fs === 1 ? "film stock" : "film stocks"} · ${cam} ${cam === 1 ? "camera" : "cameras"}`;
}

function typingRowMatchRank(row: TypingMixedRow, query: string): number {
  if (row.kind === "brand") return brandCatalogMatchRank(row.name, query);
  if (row.kind === "stock") {
    const label = `${row.brandName} ${row.name}`.trim();
    return matchRank(label, query);
  }
  return matchRank(row.name, query);
}

function ListSearchRow({ list }: { list: SearchListsResult }) {
  return (
    <Link
      href={`/lists/${list.id}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={list.title}
        specLine={`List · ${list.ownerDisplayName}`}
        showDivider={false}
        customThumb={
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ListIcon className="h-5 w-5" aria-hidden />
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

function ResultListSection<T>({
  tabId,
  query,
  title,
  titleId,
  count,
  items,
  render,
}: {
  tabId: SearchResultsTabId;
  query: string;
  title: string;
  titleId: string;
  count: number;
  items: T[];
  render: (item: T) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <CarouselViewAllHeader
        href={buildDiscoverSearchUrl(query, tabId)}
        title={`${title} (${count})`}
        titleId={titleId}
      />
      <div className="divide-y divide-border rounded-md bg-card">{items.map((item) => render(item))}</div>
    </section>
  );
}

function formatDiscoverShotsCount(total: number, hasMore: boolean): string {
  return hasMore ? `${total}+` : String(total);
}

function discoverTopResultLabel(best: NonNullable<DiscoverSearchPayload["bestResult"]>): string {
  switch (best.type) {
    case "stock":
      return cleanStockDisplayName(best.value);
    case "camera":
      return `${best.value.brandName} ${best.value.name}`.trim();
    case "user":
      return best.value.display_name ?? "Member";
    case "brand":
      return best.value.name;
    case "list":
      return best.value.title;
  }
}

function discoverTopResultHref(best: NonNullable<DiscoverSearchPayload["bestResult"]>): string {
  switch (best.type) {
    case "stock":
      return `/films/${best.value.slug}`;
    case "camera":
      return `/cameras/${best.value.slug}`;
    case "user":
      return `/users/${best.value.id}`;
    case "brand":
      return best.value.kind === "cameras_only"
        ? `/cameras?brand=${encodeURIComponent(best.value.slug)}`
        : `/brands/${best.value.slug}`;
    case "list":
      return `/lists/${best.value.id}`;
  }
}

function discoverTopResultTitle(best: NonNullable<DiscoverSearchPayload["bestResult"]>): string {
  if (best.type === "camera") return cleanCameraName(best.value);
  return discoverTopResultLabel(best);
}

function discoverTopResultSubtitle(best: NonNullable<DiscoverSearchPayload["bestResult"]>): string | null {
  switch (best.type) {
    case "brand":
      return brandDiscoverSubtitle(best.value);
    case "stock": {
      const s = best.value;
      return buildFilmStockTypeSpecLine(s.type, s.iso, s.format);
    }
    case "camera": {
      const c = best.value as SearchCamerasResult & { scanCount?: number };
      const fmt = c.format?.trim() ? c.format.toUpperCase() : "—";
      const scans = c.scanCount ?? 0;
      const base = `${fmt}`;
      return scans > 0 ? `${base} · ${scans} ${scans === 1 ? "scan" : "scans"}` : base;
    }
    case "user": {
      const h = best.value.handle?.trim();
      return h ?? null;
    }
    case "list":
      return `List · ${best.value.ownerDisplayName}`;
  }
}

const discoverTopResultCardInteractiveClassName = cn(
  "flex w-full min-w-0 items-stretch rounded-xl border border-border bg-card p-3 text-left transition-colors",
  "hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
);

function DiscoverTopResultThumb({ best }: { best: NonNullable<DiscoverSearchPayload["bestResult"]> }) {
  const box =
    "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white";
  const thumbPx = 56;
  const title = discoverTopResultTitle(best);

  switch (best.type) {
    case "stock": {
      const s = best.value;
      if (s.imageUrl) {
        return (
          <div className={box}>
            <Image
              src={s.imageUrl}
              alt={title}
              width={thumbPx}
              height={thumbPx}
              sizes="56px"
              className="h-full w-full object-contain"
              placeholder="blur"
              blurDataURL={DISCOVER_TOP_RESULT_THUMB_BLUR}
              unoptimized={s.imageUrl.startsWith("http")}
            />
          </div>
        );
      }
      return (
        <div className={box}>
          <span className="text-xs font-medium text-muted-foreground">{s.brandName?.charAt(0) ?? "?"}</span>
        </div>
      );
    }
    case "brand":
      return (
        <div className={box}>
          <Aperture className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      );
    case "camera":
      return (
        <div className={box}>
          <CameraIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      );
    case "list":
      return (
        <div className={box}>
          <ListIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      );
    case "user": {
      const display = best.value.display_name?.trim() || "Member";
      const initial = display.slice(0, 2).toUpperCase();
      return (
        <div className={box}>
          <span className="text-xs font-medium text-muted-foreground">{initial}</span>
        </div>
      );
    }
  }
}

function DiscoverTopResultCardInner({ best }: { best: NonNullable<DiscoverSearchPayload["bestResult"]> }) {
  const subtitle = discoverTopResultSubtitle(best);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <DiscoverTopResultThumb best={best} />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate font-sans text-lg font-semibold tracking-tight text-foreground">
          {discoverTopResultTitle(best)}
        </p>
        {subtitle ? (
          <p className="truncate font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      <ChevronRight className="mt-0.5 size-5 shrink-0 self-center text-muted-foreground" strokeWidth={2.5} aria-hidden />
    </div>
  );
}

export function SearchPageClient({ carousels }: SearchPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const previousDebouncedForUrlRef = useRef<string>("");
  const lastSearchParamsStringRef = useRef<string | null>(null);

  const urlTab = useMemo<SearchResultsTabId>(() => {
    const raw = searchParams.get("tab");
    if (raw === "all") return "all";
    return isSearchResultsTabId(raw) ? raw : "all";
  }, [searchParams]);

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

  const openShotLightbox = useCallback((shots: SearchShotsResult[], shotId: string) => {
    const galleryImages = shots
      .map((shot) => shotToGalleryImage(shot))
      .filter((item): item is GalleryImage => item !== null);
    if (galleryImages.length === 0) return;
    const clicked = galleryImages.find((image) => image.id === shotId || image.uploadId === shotId);
    if (!clicked) return;
    const session = collectLightboxSlidesFromGalleryImages(galleryImages, clicked);
    setLightboxSession({ ...session, galleryImages });
  }, []);

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

  useEffect(() => {
    const str = searchParams.toString();
    if (str === lastSearchParamsStringRef.current) return;
    lastSearchParamsStringRef.current = str;
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) {
      setInputValue("");
      setDebouncedQuery("");
      setResultsArmed(false);
      return;
    }
    setInputValue(q);
    setDebouncedQuery(q);
    setResultsArmed(true);
  }, [searchParams]);

  const hasQuery = debouncedQuery.length > 0;
  const activePayload = hasQuery && payloadState?.query === debouncedQuery ? payloadState.data : null;
  const showLoading = hasQuery && payloadState?.query !== debouncedQuery;
  const mode: "default" | "typing" | "results" = !hasQuery
    ? "default"
    : resultsArmed || !searchFocused
      ? "results"
      : "typing";

  useEffect(() => {
    if (mode !== "results" || showLoading) return;
    const q = debouncedQuery.trim();
    if (!q) {
      if (searchParams.toString()) router.replace("/search", { scroll: false });
      previousDebouncedForUrlRef.current = "";
      return;
    }
    const tabRaw = searchParams.get("tab");
    const tabFromUrl: SearchResultsTabId =
      tabRaw === "all" ? "all" : isSearchResultsTabId(tabRaw) ? tabRaw : "all";
    const queryChanged =
      previousDebouncedForUrlRef.current.length > 0 && previousDebouncedForUrlRef.current !== q;
    previousDebouncedForUrlRef.current = q;
    const effectiveTab: SearchResultsTabId = queryChanged ? "all" : tabFromUrl;
    const next = buildDiscoverSearchUrl(q, effectiveTab);
    const cur = `${pathname}?${searchParams.toString()}`;
    if (next !== cur) router.replace(next, { scroll: false });
  }, [debouncedQuery, mode, pathname, router, searchParams, showLoading]);

  const hasAnyResults = useMemo(() => {
    if (!activePayload) return false;
    return (
      activePayload.results.stocks.length > 0 ||
      activePayload.results.cameras.length > 0 ||
      activePayload.results.users.length > 0 ||
      activePayload.results.shots.length > 0 ||
      activePayload.results.brands.length > 0 ||
      activePayload.results.lists.length > 0
    );
  }, [activePayload]);

  const resultCounts = activePayload?.resultCounts;

  const scansMasonryItems = useMemo((): FilmNativeMasonryItem[] => {
    if (!activePayload?.results.shots.length) return [];
    return activePayload.results.shots.slice(0, SEARCH_SCANS_MASONRY_MAX).map((shot) => ({
      id: shot.id,
      imageUrl: shot.imageUrl,
      overlayLabel: "",
      href: `/films/${shot.stockSlug}/images`,
      onActivate: () => openShotLightbox(activePayload.results.shots, shot.id),
    }));
  }, [activePayload, openShotLightbox]);

  const setResultsTab = (tab: SearchResultsTabId) => {
    const q = debouncedQuery.trim();
    if (!q) return;
    router.replace(buildDiscoverSearchUrl(q, tab), { scroll: false });
  };

  useEffect(() => {
    if (pathname !== "/search") return;
    const hidden = inputValue.trim().length > 0 || mode !== "default";
    window.dispatchEvent(
      new CustomEvent<DiscoverSearchFabVisibilityDetail>(DISCOVER_SEARCH_FAB_VISIBILITY_EVENT, {
        detail: { hidden },
      })
    );
  }, [pathname, inputValue, mode]);

  const typingRows = useMemo<TypingMixedRow[]>(() => {
    if (!activePayload || !debouncedQuery.trim()) return [];
    const rows: TypingMixedRow[] = [
      ...(activePayload.typing.stocks ?? []).map((stock) => ({
        key: `stock-${stock.slug}`,
        kind: "stock" as const,
        name: stock.name,
        brandName: stock.brandName ?? "",
        href: `/films/${stock.slug}`,
        imageUrl: stock.imageUrl ?? null,
        brandInitial: stock.brandName?.charAt(0) ?? "?",
        specLine: buildFilmStockTypeSpecLine(stock.type, stock.iso, stock.format),
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
        specLine: brandDiscoverSubtitle(b),
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
            ) : typingRows.length === 0 ? (
              <DiscoverSearchNoResultsLine query={debouncedQuery} />
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
          <div>
            {showLoading ? (
              <div className="flex min-h-[55vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : (
              <>
                {mode === "results" && hasQuery && activePayload ? (
                  <div
                    className={cn(
                      "mt-3 w-[calc(100%+2rem)] min-w-0 -mx-4 border-b border-border/50 sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]",
                      urlTab === "scans" ? "mb-0" : "mb-3"
                    )}
                  >
                    <nav className="min-w-0 w-full" aria-label="Search results by type">
                      <div className="flex min-w-0 flex-nowrap items-end gap-5 overflow-x-auto overscroll-x-contain px-4 pb-px [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
                        {(
                          [
                            { id: "all" as const, label: "All" },
                            { id: "scans" as const, label: "Scans" },
                            { id: "stocks" as const, label: "Film stocks" },
                            { id: "brands" as const, label: "Brands" },
                            { id: "cameras" as const, label: "Cameras" },
                            { id: "lists" as const, label: "Lists" },
                            { id: "users" as const, label: "Users" },
                          ] as const
                        ).map(({ id, label }) => {
                          const active = urlTab === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setResultsTab(id)}
                              className={cn(
                                "relative shrink-0 px-1.5 pb-3 pt-1 text-center text-sm font-semibold whitespace-nowrap transition-colors last:pr-4 sm:px-2.5",
                                id === "all" && "min-w-11 sm:min-w-12",
                                active
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {label}
                              {active ? (
                                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" aria-hidden />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </nav>
                  </div>
                ) : null}

                {activePayload && urlTab === "all" ? (
                  <div className="flex flex-col gap-6">
                    {activePayload.bestResult ? (
                      <Link
                        href={discoverTopResultHref(activePayload.bestResult)}
                        className={discoverTopResultCardInteractiveClassName}
                      >
                        <DiscoverTopResultCardInner best={activePayload.bestResult} />
                      </Link>
                    ) : null}

                    {!hasAnyResults ? <DiscoverSearchNoResultsLine query={debouncedQuery} /> : null}

                    {scansMasonryItems.length > 0 ? (
                      <section aria-labelledby="discover-search-scans-heading">
                        <CarouselViewAllHeader
                          href={buildDiscoverSearchUrl(debouncedQuery.trim(), "scans")}
                          title={`Scans (${formatDiscoverShotsCount(activePayload.resultCounts.shots, activePayload.shotsHasMore)})`}
                          titleId="discover-search-scans-heading"
                        />
                        <div className="-mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)]">
                          <FilmNativeMasonryGrid
                            items={scansMasonryItems}
                            preserveImageAspectRatio
                            ariaLabel={`Search scans for ${debouncedQuery.trim()}`}
                          />
                        </div>
                      </section>
                    ) : null}

                    <ResultListSection<SearchStocksResult>
                      tabId="stocks"
                      query={debouncedQuery.trim()}
                      title="Film stocks"
                      titleId="discover-search-stocks-heading"
                      count={activePayload.resultCounts.stocks}
                      items={activePayload.results.stocks.slice(0, 8)}
                      render={(stock) => <StockSearchRow key={stock.slug} stock={stock} />}
                    />
                    <ResultListSection<SearchBrandsResult>
                      tabId="brands"
                      query={debouncedQuery.trim()}
                      title="Brands"
                      titleId="discover-search-brands-heading"
                      count={activePayload.resultCounts.brands}
                      items={activePayload.results.brands}
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
                            specLine={brandDiscoverSubtitle(b)}
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
                    <ResultListSection<SearchCamerasResult>
                      tabId="cameras"
                      query={debouncedQuery.trim()}
                      title="Cameras"
                      titleId="discover-search-cameras-heading"
                      count={activePayload.resultCounts.cameras}
                      items={activePayload.results.cameras}
                      render={(camera) => <CameraSearchRow key={camera.slug} camera={camera} />}
                    />
                    <ResultListSection<SearchListsResult>
                      tabId="lists"
                      query={debouncedQuery.trim()}
                      title="Lists"
                      titleId="discover-search-lists-heading"
                      count={activePayload.resultCounts.lists}
                      items={activePayload.results.lists}
                      render={(list) => <ListSearchRow key={list.id} list={list} />}
                    />
                    <ResultListSection<SearchUsersResult>
                      tabId="users"
                      query={debouncedQuery.trim()}
                      title="Users"
                      titleId="discover-search-users-heading"
                      count={activePayload.resultCounts.users}
                      items={activePayload.results.users}
                      render={(user) => <UserSearchRow key={user.id} user={user} />}
                    />
                  </div>
                ) : activePayload && !hasAnyResults ? (
                  <DiscoverSearchNoResultsLine query={debouncedQuery} />
                ) : null}

                {activePayload && urlTab === "scans" && scansMasonryItems.length > 0 ? (
                  <div className="-mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)]">
                    <FilmNativeMasonryGrid
                      items={scansMasonryItems}
                      preserveImageAspectRatio
                      ariaLabel={`Search scans for ${debouncedQuery}`}
                    />
                  </div>
                ) : null}

                {activePayload && urlTab === "scans" && scansMasonryItems.length === 0 ? (
                  <DiscoverSearchNoResultsLine query={debouncedQuery} />
                ) : null}

                {activePayload && urlTab === "stocks" ? (
                  activePayload.results.stocks.length === 0 ? (
                    <DiscoverSearchNoResultsLine query={debouncedQuery} />
                  ) : (
                    <div className="mt-2 divide-y divide-border rounded-md bg-card">
                      {activePayload.results.stocks.map((stock) => (
                        <StockSearchRow key={stock.slug} stock={stock} />
                      ))}
                    </div>
                  )
                ) : null}

                {activePayload && urlTab === "brands" ? (
                  activePayload.results.brands.length === 0 ? (
                    <DiscoverSearchNoResultsLine query={debouncedQuery} />
                  ) : (
                  <div className="mt-2 divide-y divide-border rounded-md bg-card">
                    {activePayload.results.brands.map((b) => (
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
                      specLine={brandDiscoverSubtitle(b)}
                      showDivider={false}
                      customThumb={
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Aperture className="h-5 w-5" aria-hidden />
                        </div>
                      }
                    />
                  </Link>
                ))}
              </div>
                  )
                ) : null}

                {activePayload && urlTab === "cameras" ? (
                  activePayload.results.cameras.length === 0 ? (
                    <DiscoverSearchNoResultsLine query={debouncedQuery} />
                  ) : (
                    <div className="mt-2 divide-y divide-border rounded-md bg-card">
                      {activePayload.results.cameras.map((camera) => (
                        <CameraSearchRow key={camera.slug} camera={camera} />
                      ))}
                    </div>
                  )
                ) : null}

                {activePayload && urlTab === "lists" ? (
                  activePayload.results.lists.length === 0 ? (
                    <DiscoverSearchNoResultsLine query={debouncedQuery} />
                  ) : (
                    <div className="mt-2 divide-y divide-border rounded-md bg-card">
                      {activePayload.results.lists.map((list) => (
                        <ListSearchRow key={list.id} list={list} />
                      ))}
                    </div>
                  )
                ) : null}

                {activePayload && urlTab === "users" ? (
                  activePayload.results.users.length === 0 ? (
                    <DiscoverSearchNoResultsLine query={debouncedQuery} />
                  ) : (
                    <div className="mt-2 divide-y divide-border rounded-md bg-card">
                      {activePayload.results.users.map((user) => (
                        <UserSearchRow key={user.id} user={user} />
                      ))}
                    </div>
                  )
                ) : null}
              </>
            )}
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
