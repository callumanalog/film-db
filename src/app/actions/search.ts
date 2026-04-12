"use server";

import { getFilmStocks, getBrands, getFeaturedFilmStocks, getFeaturedBrands } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { getAllCommunityUploadsForGallery } from "@/app/actions/uploads";
import { createClient } from "@/lib/supabase/server";
import { getCameras, getCameraBrands } from "@/lib/camera-queries";
import type { CameraBrand, FilmBrand, FilmStock } from "@/lib/types";
import { buildCameraSlugToFilmSlugMap, resolveRelatedCameraBrandSlugs } from "@/lib/film-brand-camera-brand-slugs";
import { brandCatalogMatchRank, matchRank } from "@/lib/search-entity-match-rank";

export type SearchTab = "stocks" | "shots" | "notes" | "brands" | "users";

function stockToSearchResult(s: { slug: string; name: string; iso?: number | null; type?: string; format?: string[] | null; brand?: { name: string } | null; image_url?: string | null }): SearchStocksResult {
  return {
    slug: s.slug,
    name: s.name,
    iso: s.iso ?? null,
    type: s.type ?? undefined,
    format: s.format ?? undefined,
    brandName: s.brand?.name ?? "",
    imageUrl: s.image_url ?? null,
  };
}

export interface SearchStocksResult {
  slug: string;
  name: string;
  iso?: number | null;
  type?: string;
  format?: string[];
  brandName: string;
  imageUrl?: string | null;
  scanCount?: number;
}

export interface SearchBrandsResult {
  slug: string;
  name: string;
  subMeta: string;
  /**
   * `catalog` = unified hub at `/brands/{slug}` (film + linked cameras).
   * `cameras_only` = camera maker with no linked film row → `/cameras?brand={slug}`.
   */
  kind?: "catalog" | "cameras_only";
  /** Discover search: film stocks in catalog for this brand (catalog rows only). */
  filmStockCount?: number;
  /** Discover search: camera models linked to this brand slug in the camera catalog. */
  cameraCatalogCount?: number;
}

export interface SearchShotsResult {
  id: string;
  stockSlug: string;
  stockName: string;
  brandName: string;
  imageUrl: string | null;
  username: string;
  userId: string;
  camera?: string;
  settings?: string;
  likes?: number;
  saves?: number;
  caption?: string | null;
  shot_iso?: string | null;
  lens?: string | null;
  lab?: string | null;
  scanner?: string | null;
  push_pull?: string | null;
  format?: string | null;
  shot_date?: string | null;
  tags?: string | null;
  location?: string | null;
  reviewTitle?: string | null;
  reviewId?: string | null;
  rollId?: string | null;
  uploadBatchId?: string | null;
  stockIso?: number | null;
  stockType?: string;
  stockFormat?: string[];
  stockImageUrl?: string | null;
}

export interface SearchNotesResult {
  id: string;
  film_stock_slug: string;
  review_title: string | null;
  rating: number | null;
  stockName?: string;
}

export interface SearchUsersResult {
  id: string;
  display_name: string | null;
  handle?: string | null;
}

export interface SearchCamerasResult {
  slug: string;
  name: string;
  brandName: string;
  format: string;
  scanCount?: number;
}

export interface SearchListsResult {
  id: string;
  title: string;
  ownerDisplayName: string;
}

export interface SearchResult {
  stocks?: SearchStocksResult[];
  brands?: SearchBrandsResult[];
  shots?: SearchShotsResult[];
  notes?: SearchNotesResult[];
  users?: SearchUsersResult[];
  cameras?: SearchCamerasResult[];
  lists?: SearchListsResult[];
}

export type DiscoverTypingBrand = SearchBrandsResult & { scanCount: number };

export interface DiscoverSearchPayload {
  typing: {
    stocks: SearchStocksResult[];
    cameras: SearchCamerasResult[];
    users: SearchUsersResult[];
    brands: DiscoverTypingBrand[];
  };
  results: {
    stocks: SearchStocksResult[];
    cameras: SearchCamerasResult[];
    users: SearchUsersResult[];
    shots: SearchShotsResult[];
    lists: SearchListsResult[];
    brands: SearchBrandsResult[];
  };
  bestResult:
    | { type: "stock"; value: SearchStocksResult }
    | { type: "camera"; value: SearchCamerasResult }
    | { type: "user"; value: SearchUsersResult }
    | { type: "list"; value: SearchListsResult }
    | { type: "brand"; value: SearchBrandsResult }
    | null;
  /** True when more than `results.shots.length` uploads matched (pagination can extend later). */
  shotsHasMore: boolean;
  /** Total matches per category (before list truncation for display). */
  resultCounts: {
    stocks: number;
    cameras: number;
    shots: number;
    brands: number;
    lists: number;
    users: number;
  };
}

const DISCOVER_SHOTS_PAGE_SIZE = 48;

type DiscoverBestResult = DiscoverSearchPayload["bestResult"];

interface DiscoverMatchScore {
  tier: number;
  scans: number;
  label: string;
}

function compareDiscoverMatchScore(a: DiscoverMatchScore, b: DiscoverMatchScore): number {
  if (a.tier !== b.tier) return a.tier - b.tier;
  if (b.scans !== a.scans) return b.scans - a.scans;
  return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
}

function scoreStockForDiscoverBest(s: SearchStocksResult & { scanCount?: number }, q: string): DiscoverMatchScore {
  const label = `${s.brandName} ${s.name}`.trim();
  return { tier: matchRank(label, q), scans: s.scanCount ?? 0, label };
}

function scoreBrandForDiscoverBest(b: DiscoverTypingBrand, q: string): DiscoverMatchScore {
  return { tier: brandCatalogMatchRank(b.name, q), scans: b.scanCount, label: b.name };
}

function scoreCameraForDiscoverBest(c: SearchCamerasResult & { scanCount?: number }, q: string): DiscoverMatchScore {
  const label = `${c.brandName} ${c.name}`.trim();
  return { tier: matchRank(label, q), scans: c.scanCount ?? 0, label };
}

function scoreUserForDiscoverBest(u: SearchUsersResult, q: string): DiscoverMatchScore {
  const label = u.display_name?.trim() || "Member";
  return { tier: matchRank(label, q), scans: 0, label };
}

function scoreListForDiscoverBest(l: SearchListsResult, q: string): DiscoverMatchScore {
  return { tier: matchRank(l.title, q), scans: 0, label: l.title };
}

function pickDiscoverBestResult(params: {
  q: string;
  stocksByScans: (SearchStocksResult & { scanCount?: number })[];
  mergedBrandRows: DiscoverTypingBrand[];
  camerasByScans: (SearchCamerasResult & { scanCount?: number })[];
  users: SearchUsersResult[];
  listRows: SearchListsResult[];
  toBrandResult: (e: DiscoverTypingBrand) => SearchBrandsResult;
}): DiscoverBestResult {
  const { q, stocksByScans, mergedBrandRows, camerasByScans, users, listRows, toBrandResult } = params;

  type Entry = { score: DiscoverMatchScore; result: NonNullable<DiscoverBestResult> };
  const entries: Entry[] = [];

  if (stocksByScans[0]) {
    const v = stocksByScans[0];
    entries.push({ score: scoreStockForDiscoverBest(v, q), result: { type: "stock", value: v } });
  }
  if (mergedBrandRows[0]) {
    const b = mergedBrandRows[0];
    entries.push({ score: scoreBrandForDiscoverBest(b, q), result: { type: "brand", value: toBrandResult(b) } });
  }
  if (camerasByScans[0]) {
    const c = camerasByScans[0];
    entries.push({ score: scoreCameraForDiscoverBest(c, q), result: { type: "camera", value: c } });
  }

  const usersSorted = [...users].sort((a, b) => {
    const d = scoreUserForDiscoverBest(a, q).tier - scoreUserForDiscoverBest(b, q).tier;
    if (d !== 0) return d;
    return (a.display_name ?? "").localeCompare(b.display_name ?? "", undefined, { sensitivity: "base" });
  });
  if (usersSorted[0]) {
    entries.push({
      score: scoreUserForDiscoverBest(usersSorted[0]!, q),
      result: { type: "user", value: usersSorted[0]! },
    });
  }

  const listsSorted = [...listRows].sort((a, b) => {
    const d = scoreListForDiscoverBest(a, q).tier - scoreListForDiscoverBest(b, q).tier;
    if (d !== 0) return d;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
  if (listsSorted[0]) {
    entries.push({
      score: scoreListForDiscoverBest(listsSorted[0]!, q),
      result: { type: "list", value: listsSorted[0]! },
    });
  }

  if (entries.length === 0) return null;
  return entries.reduce((best, cur) =>
    compareDiscoverMatchScore(cur.score, best.score) < 0 ? cur : best
  ).result;
}

function filmBrandsMatchingQuery(
  q: string,
  brands: FilmBrand[],
  allStocks: (FilmStock & { brand: FilmBrand })[]
): FilmBrand[] {
  const lower = q.toLowerCase();
  const brandSlugsWithMatchingStock = new Set(
    allStocks.filter((s) => s.name.toLowerCase().includes(lower)).map((s) => s.brand.slug)
  );
  const brandSlugsWithMatchingLinkedCameraSlug = new Set<string>();
  for (const b of brands) {
    for (const cam of resolveRelatedCameraBrandSlugs(b)) {
      if (cam.toLowerCase().includes(lower)) {
        brandSlugsWithMatchingLinkedCameraSlug.add(b.slug);
      }
    }
  }
  return brands.filter(
    (b) =>
      b.name.toLowerCase().includes(lower) ||
      (b.slug && b.slug.toLowerCase().includes(lower)) ||
      brandSlugsWithMatchingStock.has(b.slug) ||
      brandSlugsWithMatchingLinkedCameraSlug.has(b.slug)
  );
}

function mergeUnifiedBrandDiscoverRows(params: {
  q: string;
  filmBrandsList: FilmBrand[];
  matchedFilmBrands: FilmBrand[];
  matchedCameraBrands: CameraBrand[];
  filmScanBySlug: Map<string, number>;
  cameraCountBySlug: Map<string, number>;
}): DiscoverTypingBrand[] {
  const { q, filmBrandsList, matchedFilmBrands, matchedCameraBrands, filmScanBySlug, cameraCountBySlug } = params;
  const camToFilm = buildCameraSlugToFilmSlugMap(filmBrandsList);
  const mergedCatalog = new Map<string, DiscoverTypingBrand>();
  const standalone: DiscoverTypingBrand[] = [];

  for (const b of matchedFilmBrands) {
    const scan = filmScanBySlug.get(b.slug) ?? 0;
    mergedCatalog.set(b.slug, {
      slug: b.slug,
      name: b.name,
      subMeta: "Brand",
      kind: "catalog",
      scanCount: scan,
    });
  }

  for (const cb of matchedCameraBrands) {
    const filmSlug = camToFilm.get(cb.slug);
    const camN = cameraCountBySlug.get(cb.slug) ?? 0;
    if (filmSlug) {
      const fb = filmBrandsList.find((x) => x.slug === filmSlug);
      if (!fb) continue;
      const cur = mergedCatalog.get(filmSlug);
      if (cur) {
        mergedCatalog.set(filmSlug, {
          ...cur,
          scanCount: cur.scanCount + camN,
        });
      } else {
        mergedCatalog.set(filmSlug, {
          slug: filmSlug,
          name: fb.name,
          subMeta: "Brand",
          kind: "catalog",
          scanCount: camN,
        });
      }
    } else {
      standalone.push({
        slug: cb.slug,
        name: cb.name,
        subMeta: "Brand",
        kind: "cameras_only",
        scanCount: camN,
      });
    }
  }

  const sortDiscoverBrandEntries = (a: DiscoverTypingBrand, b: DiscoverTypingBrand) => {
    const tierDiff = brandCatalogMatchRank(a.name, q) - brandCatalogMatchRank(b.name, q);
    if (tierDiff !== 0) return tierDiff;
    if (b.scanCount !== a.scanCount) return b.scanCount - a.scanCount;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  };

  return [...mergedCatalog.values(), ...standalone].sort(sortDiscoverBrandEntries);
}

function augmentDiscoverBrandCatalogCounts(
  rows: DiscoverTypingBrand[],
  allStocksAlbum: (FilmStock & { brand: FilmBrand })[],
  allCamerasCatalog: Awaited<ReturnType<typeof getCameras>>,
  filmBrandsList: FilmBrand[]
): DiscoverTypingBrand[] {
  const camToFilm = buildCameraSlugToFilmSlugMap(filmBrandsList);
  const camerasPerCameraBrandSlug = new Map<string, number>();
  for (const c of allCamerasCatalog) {
    const slug = c.brand.slug;
    camerasPerCameraBrandSlug.set(slug, (camerasPerCameraBrandSlug.get(slug) ?? 0) + 1);
  }

  return rows.map((row) => {
    if (row.kind === "cameras_only") {
      return {
        ...row,
        filmStockCount: 0,
        cameraCatalogCount: camerasPerCameraBrandSlug.get(row.slug) ?? 0,
      };
    }
    const filmSlug = row.slug;
    const filmStockCount = allStocksAlbum.filter((s) => s.brand.slug === filmSlug).length;
    let cameraCatalogCount = 0;
    for (const c of allCamerasCatalog) {
      if (camToFilm.get(c.brand.slug) === filmSlug) cameraCatalogCount += 1;
    }
    return { ...row, filmStockCount, cameraCatalogCount };
  });
}

/** Tab-aware search: returns only the active tab's results. */
export async function searchFilmsByTab(
  query: string,
  tab: SearchTab
): Promise<SearchResult> {
  const q = query?.trim() ?? "";
  if (!q) return { [tab]: [] };

  switch (tab) {
    case "stocks": {
      const stocks = await getFilmStocks({ search: q, sort: "alphabetical" });
      return { stocks: stocks.map(stockToSearchResult) };
    }
    case "brands": {
      const [brands, allStocks, cameraBrandsList, allCameras] = await Promise.all([
        getBrands(),
        getFilmStocks({ sort: "alphabetical" }),
        getCameraBrands(),
        getCameras(),
      ]);
      const lower = q.toLowerCase();
      const matchedFilm = filmBrandsMatchingQuery(q, brands, allStocks);
      const matchedCamera = cameraBrandsList.filter(
        (b) => b.name.toLowerCase().includes(lower) || b.slug.toLowerCase().includes(lower)
      );
      const cameraCountBySlug = new Map<string, number>();
      for (const c of allCameras) {
        cameraCountBySlug.set(c.brand.slug, (cameraCountBySlug.get(c.brand.slug) ?? 0) + 1);
      }
      const filmScanBySlug = new Map<string, number>();
      for (const b of matchedFilm) {
        const slugs = allStocks
          .filter((s) => s.brand.slug === b.slug)
          .map((s) => s.slug)
          .slice(0, 120);
        const stats = slugs.length > 0 ? await getFilmStockStatsForSlugs(slugs) : {};
        filmScanBySlug.set(
          b.slug,
          Object.values(stats).reduce((sum, row) => sum + (row.shotsCount ?? 0), 0)
        );
      }
      const merged = mergeUnifiedBrandDiscoverRows({
        q,
        filmBrandsList: brands,
        matchedFilmBrands: matchedFilm,
        matchedCameraBrands: matchedCamera,
        filmScanBySlug,
        cameraCountBySlug,
      });
      return {
        brands: merged.map((e) => ({
          slug: e.slug,
          name: e.name,
          subMeta: e.subMeta,
          kind: e.kind,
        })),
      };
    }
    case "shots": {
      const stocks = await getFilmStocks({ sort: "alphabetical" });
      const matchingStockSlugs = new Set(
        stocks.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).map((s) => s.slug)
      );
      const uploadsByText = await getAllCommunityUploadsForGallery(stocks, q);
      const uploadsByStockName =
        matchingStockSlugs.size > 0
          ? await getAllCommunityUploadsForGallery(stocks, undefined, [...matchingStockSlugs])
          : [];
      const seenIds = new Set(uploadsByText.map((u) => u.id));
      const merged = [...uploadsByText];
      for (const u of uploadsByStockName) {
        if (!seenIds.has(u.id)) {
          seenIds.add(u.id);
          merged.push(u);
        }
      }
      return {
        shots: merged.map((u) => ({
          id: u.id,
          stockSlug: u.stockSlug,
          stockName: u.stockName,
          brandName: u.brandName,
          imageUrl: u.imageUrl,
          username: u.username,
          userId: u.userId,
          camera: u.camera,
          settings: u.settings,
          likes: u.likes,
          saves: u.saves,
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
        })),
      };
    }
    case "notes": {
      const supabase = await createClient();
      const pattern = `%${q}%`;
      const { data: rows, error } = await supabase
        .from("reviews")
        .select("id, film_stock_slug, review_title, rating")
        .or(`review_title.ilike.${pattern},review_text.ilike.${pattern},film_stock_slug.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error || !rows?.length) return { notes: [] };
      const stocks = await getFilmStocks({ sort: "alphabetical" });
      const nameBySlug = new Map(stocks.map((s) => [s.slug, s.name]));
      return {
        notes: (rows as { id: string; film_stock_slug: string; review_title: string | null; rating: number | null }[]).map((r) => ({
          id: r.id,
          film_stock_slug: r.film_stock_slug,
          review_title: r.review_title,
          rating: r.rating,
          stockName: nameBySlug.get(r.film_stock_slug),
        })),
      };
    }
    case "users": {
      const supabase = await createClient();
      const pattern = `%${q}%`;
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", pattern)
        .limit(500);
      if (error || !profiles?.length) return { users: [] };
      return {
        users: (profiles as { id: string; display_name: string | null }[]).map((p) => ({
          id: p.id,
          display_name: p.display_name ?? null,
          handle: p.display_name ? `@${p.display_name.replace(/\s+/g, "_").toLowerCase()}` : null,
        })),
      };
    }
    default:
      return {};
  }
}

const LATEST_SHOTS_LIMIT = 10;
const LATEST_NOTES_LIMIT = 10;
const LATEST_USERS_LIMIT = 10;

/** Trending stocks for mobile search empty state (Stocks tab). */
export async function getTrendingStocks(): Promise<SearchStocksResult[]> {
  const stocks = await getFeaturedFilmStocks();
  return stocks.map(stockToSearchResult);
}

/** Trending brands for mobile search empty state (Brands tab). */
export async function getTrendingBrands(): Promise<SearchBrandsResult[]> {
  const brands = await getFeaturedBrands();
  return brands.map((b) => ({
    slug: b.slug,
    name: b.name,
    subMeta: "Brand",
    kind: "catalog" as const,
  }));
}

/** Latest shots for mobile search empty state (Shots tab). Limit 10. */
export async function getLatestShots(): Promise<SearchShotsResult[]> {
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const uploads = await getAllCommunityUploadsForGallery(stocks);
  return uploads.slice(0, LATEST_SHOTS_LIMIT).map((u) => ({
    id: u.id,
    stockSlug: u.stockSlug,
    stockName: u.stockName,
    brandName: u.brandName,
    imageUrl: u.imageUrl,
    username: u.username,
    userId: u.userId,
    camera: u.camera,
    settings: u.settings,
    likes: u.likes,
    saves: u.saves,
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
  }));
}

/** Latest notes (reviews) for mobile search empty state (Notes tab). Limit 10. */
export async function getLatestNotes(): Promise<SearchNotesResult[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, film_stock_slug, review_title, rating")
    .order("created_at", { ascending: false })
    .limit(LATEST_NOTES_LIMIT);
  if (error || !rows?.length) return [];
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const nameBySlug = new Map(stocks.map((s) => [s.slug, s.name]));
  return (rows as { id: string; film_stock_slug: string; review_title: string | null; rating: number | null }[]).map(
    (r) => ({
      id: r.id,
      film_stock_slug: r.film_stock_slug,
      review_title: r.review_title,
      rating: r.rating,
      stockName: nameBySlug.get(r.film_stock_slug),
    })
  );
}

/** Latest users (profiles) for mobile search empty state (Users tab). Limit 10. Order by created_at desc. */
export async function getLatestUsers(): Promise<SearchUsersResult[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("created_at", { ascending: false })
    .limit(LATEST_USERS_LIMIT);
  if (error || !profiles?.length) return [];
  return (profiles as { id: string; display_name: string | null }[]).map((p) => ({
    id: p.id,
    display_name: p.display_name ?? null,
    handle: p.display_name ? `@${p.display_name.replace(/\s+/g, "_").toLowerCase()}` : null,
  }));
}

export interface SuggestedStocksResult {
  stocks: SearchStocksResult[];
  /** Full stock catalog in popularity order for instant client-side filtering. */
  allStocks: SearchStocksResult[];
}

/**
 * Returns 8 suggested film stocks for the action sheet search empty state,
 * plus the complete stock list for instant client-side filtering.
 * Empty state suggestions are the highest-rated stocks by average user rating.
 */
export async function getSuggestedStocks(): Promise<SuggestedStocksResult> {
  const popularityOrderedStocks = await getFilmStocks({ sort: "popular" });
  const allMapped: SearchStocksResult[] = popularityOrderedStocks.map(stockToSearchResult);

  return {
    stocks: allMapped.slice(0, 8),
    allStocks: allMapped,
  };
}

interface DiscoverCarouselPayload {
  gold200: SearchShotsResult[];
  portra400: SearchShotsResult[];
}

function mapUploadsToShotResults(
  uploads: Awaited<ReturnType<typeof getAllCommunityUploadsForGallery>>
): SearchShotsResult[] {
  return uploads.map((u) => ({
    id: u.id,
    stockSlug: u.stockSlug,
    stockName: u.stockName,
    brandName: u.brandName,
    imageUrl: u.imageUrl,
    username: u.username,
    userId: u.userId,
    camera: u.camera,
    settings: u.settings,
    likes: u.likes,
    saves: u.saves,
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
  }));
}

export async function getDiscoverCarouselPayload(): Promise<DiscoverCarouselPayload> {
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const [goldUploads, portraUploads] = await Promise.all([
    getAllCommunityUploadsForGallery(stocks, undefined, ["kodak-gold-200"]),
    getAllCommunityUploadsForGallery(stocks, undefined, ["kodak-portra-400"]),
  ]);
  return {
    gold200: mapUploadsToShotResults(goldUploads),
    portra400: mapUploadsToShotResults(portraUploads),
  };
}

function toCameraResult(rows: Awaited<ReturnType<typeof getCameras>>): SearchCamerasResult[] {
  return rows.map((camera) => ({
    slug: camera.slug,
    name: camera.name,
    brandName: camera.brand.name,
    format: camera.format.join(", "),
  }));
}

export async function getDiscoverSearchPayload(query: string): Promise<DiscoverSearchPayload> {
  const q = query.trim();
  if (!q) {
    return {
      typing: { stocks: [], cameras: [], users: [], brands: [] },
      results: { stocks: [], cameras: [], users: [], shots: [], lists: [], brands: [] },
      bestResult: null,
      shotsHasMore: false,
      resultCounts: { stocks: 0, cameras: 0, shots: 0, brands: 0, lists: 0, users: 0 },
    };
  }

  const [stockRes, usersRes, shotsRes, cameras, listSearch, allStocksAlbum, filmBrandsList, cameraBrandsList, allCamerasCatalog] =
    await Promise.all([
    searchFilmsByTab(q, "stocks"),
    searchFilmsByTab(q, "users"),
    searchFilmsByTab(q, "shots"),
    getCameras({ search: q }),
    (async (): Promise<{ rows: SearchListsResult[]; total: number }> => {
      const supabase = await createClient();
      const titlePattern = `%${q}%`;
      const base = supabase.from("stock_lists").select("id", { count: "exact", head: true }).ilike("title", titlePattern);
      const [{ count: listCount }, { data }] = await Promise.all([
        base,
        supabase
          .from("stock_lists")
          .select("id, title, user_id")
          .ilike("title", titlePattern)
          .order("updated_at", { ascending: false })
          .limit(500),
      ]);
      const rows = (data ?? []) as { id: string; title: string; user_id: string }[];
      const total = typeof listCount === "number" ? listCount : rows.length;
      if (rows.length === 0) return { rows: [], total };
      const ownerIds = [...new Set(rows.map((r) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ownerIds);
      const ownerById = new Map(
        (profiles ?? []).map((p) => [
          (p as { id: string }).id,
          (p as { display_name: string | null }).display_name?.trim() || "Member",
        ])
      );
      return {
        rows: rows.map((r) => ({
          id: r.id,
          title: r.title,
          ownerDisplayName: ownerById.get(r.user_id) ?? "Member",
        })),
        total,
      };
    })(),
    getFilmStocks({ sort: "alphabetical" }),
    getBrands(),
    getCameraBrands(),
    getCameras(),
  ]);

  const stocks = stockRes.stocks ?? [];
  const users = usersRes.users ?? [];
  const shots = shotsRes.shots ?? [];
  const cameraResults = toCameraResult(cameras);
  const listRows = listSearch.rows;
  const listMatchTotal = listSearch.total;

  const lower = q.toLowerCase();
  const matchedFilmBrands = filmBrandsMatchingQuery(q, filmBrandsList, allStocksAlbum);
  const matchedCameraBrands = cameraBrandsList.filter(
    (b) => b.name.toLowerCase().includes(lower) || b.slug.toLowerCase().includes(lower)
  );

  const cameraCountByBrandSlug = new Map<string, number>();
  for (const c of allCamerasCatalog) {
    cameraCountByBrandSlug.set(c.brand.slug, (cameraCountByBrandSlug.get(c.brand.slug) ?? 0) + 1);
  }

  const filmScanBySlug = new Map<string, number>();
  for (const b of matchedFilmBrands) {
    const slugs = allStocksAlbum
      .filter((s) => s.brand.slug === b.slug)
      .map((s) => s.slug)
      .slice(0, 120);
    const stats = slugs.length > 0 ? await getFilmStockStatsForSlugs(slugs) : {};
    filmScanBySlug.set(
      b.slug,
      Object.values(stats).reduce((sum, row) => sum + (row.shotsCount ?? 0), 0)
    );
  }

  const mergedBrandRows = mergeUnifiedBrandDiscoverRows({
    q,
    filmBrandsList: filmBrandsList,
    matchedFilmBrands,
    matchedCameraBrands,
    filmScanBySlug,
    cameraCountBySlug: cameraCountByBrandSlug,
  });

  const mergedBrandsWithCounts = augmentDiscoverBrandCatalogCounts(
    mergedBrandRows,
    allStocksAlbum,
    allCamerasCatalog,
    filmBrandsList
  );

  const typingBrandsMerged = mergedBrandsWithCounts.slice(0, 20);

  const toBrandResult = (e: DiscoverTypingBrand): SearchBrandsResult => ({
    slug: e.slug,
    name: e.name,
    subMeta: e.subMeta,
    kind: e.kind,
    filmStockCount: e.filmStockCount,
    cameraCatalogCount: e.cameraCatalogCount,
  });

  const resultsBrands = mergedBrandsWithCounts.map(toBrandResult);

  // Typing-state ranking: prioritize entities with most attached scans.
  const supabase = await createClient();

  const stockSlugs = stocks.map((s) => s.slug);
  const stockStatsBySlug =
    stockSlugs.length > 0 ? await getFilmStockStatsForSlugs(stockSlugs) : {};
  const stockCountBySlug = new Map<string, number>(
    stockSlugs.map((slug) => [slug, stockStatsBySlug[slug]?.shotsCount ?? 0])
  );

  const cameraUploadMatchCountBySlug = new Map<string, number>();
  if (cameraResults.length > 0) {
    const { data: cameraUploads } = await supabase
      .from("user_uploads")
      .select("camera")
      .ilike("camera", `%${q}%`)
      .not("image_url", "is", null);

    const normalizedNames = cameraResults.map((c) => ({
      slug: c.slug,
      // Count scans attached by either "camera name" or "brand + camera name".
      plain: c.name.trim().toLowerCase(),
      branded: `${c.brandName.trim()} ${c.name.trim()}`.toLowerCase(),
    }));

    for (const row of (cameraUploads ?? []) as { camera: string | null }[]) {
      const val = row.camera?.trim().toLowerCase();
      if (!val) continue;
      for (const candidate of normalizedNames) {
        if (val === candidate.plain || val === candidate.branded) {
          cameraUploadMatchCountBySlug.set(
            candidate.slug,
            (cameraUploadMatchCountBySlug.get(candidate.slug) ?? 0) + 1
          );
        }
      }
    }
  }

  const stocksByScans = [...stocks]
    .map((s) => ({ ...s, scanCount: stockCountBySlug.get(s.slug) ?? 0 }))
    .sort((a, b) => {
      const labelA = `${a.brandName} ${a.name}`.trim();
      const labelB = `${b.brandName} ${b.name}`.trim();
      const tierDiff = matchRank(labelA, q) - matchRank(labelB, q);
      if (tierDiff !== 0) return tierDiff;
      if ((b.scanCount ?? 0) !== (a.scanCount ?? 0)) return (b.scanCount ?? 0) - (a.scanCount ?? 0);
      return labelA.localeCompare(labelB, undefined, { sensitivity: "base" });
    });

  const camerasByScans = [...cameraResults]
    .map((c) => ({ ...c, scanCount: cameraUploadMatchCountBySlug.get(c.slug) ?? 0 }))
    .sort((a, b) => {
      const nameA = `${a.brandName} ${a.name}`.trim();
      const nameB = `${b.brandName} ${b.name}`.trim();
      const tierDiff = matchRank(nameA, q) - matchRank(nameB, q);
      if (tierDiff !== 0) return tierDiff;
      if ((b.scanCount ?? 0) !== (a.scanCount ?? 0)) return (b.scanCount ?? 0) - (a.scanCount ?? 0);
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
  const usersByMatch = [...users].sort((a, b) => {
    const d = scoreUserForDiscoverBest(a, q).tier - scoreUserForDiscoverBest(b, q).tier;
    if (d !== 0) return d;
    return (a.display_name ?? "").localeCompare(b.display_name ?? "", undefined, { sensitivity: "base" });
  });

  const shotsHasMore = shots.length > DISCOVER_SHOTS_PAGE_SIZE;
  const shotsPage = shots.slice(0, DISCOVER_SHOTS_PAGE_SIZE);

  const bestResult = pickDiscoverBestResult({
    q,
    stocksByScans,
    mergedBrandRows: mergedBrandsWithCounts,
    camerasByScans,
    users,
    listRows,
    toBrandResult,
  });

  const { count: usersMatchTotal } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .ilike("display_name", `%${q}%`);

  return {
    typing: {
      stocks: stocksByScans.slice(0, 20),
      cameras: camerasByScans.slice(0, 20),
      users: users.slice(0, 20),
      brands: typingBrandsMerged,
    },
    results: {
      stocks: stocksByScans,
      cameras: camerasByScans,
      users: usersByMatch,
      shots: shotsPage,
      lists: listRows,
      brands: resultsBrands,
    },
    bestResult,
    shotsHasMore,
    resultCounts: {
      stocks: stocks.length,
      cameras: cameraResults.length,
      shots: shots.length,
      brands: mergedBrandsWithCounts.length,
      lists: listMatchTotal,
      users: typeof usersMatchTotal === "number" ? usersMatchTotal : users.length,
    },
  };
}
