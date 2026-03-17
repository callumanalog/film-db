"use client";

import useSWR from "swr";
import type { SearchPageParams, SearchPageData } from "@/app/actions/nav-cache";
import type { FilmsPageParams, FilmsPageData } from "@/app/actions/nav-cache";
import { getSearchPageData, getFilmsPageData } from "@/app/actions/nav-cache";

/** Stable key for search page cache so returning to Search tab shows cached data. */
export function searchPageDataKey(params: SearchPageParams): string {
  const p = {
    search: params.search ?? "",
    sort: params.sort ?? "alphabetical",
    brand: params.brand ?? "",
    type: params.type ?? "",
    format: params.format ?? "",
    grain: params.grain ?? "",
    contrast: params.contrast ?? "",
    latitude: params.latitude ?? "",
    saturation: params.saturation ?? "",
    bestFor: params.bestFor ?? "",
    iso: params.iso ?? "",
  };
  return `nav-search:${JSON.stringify(p)}`;
}

/** Stable key for films page cache so returning to Home/Films tab shows cached data. */
export function filmsPageDataKey(params: FilmsPageParams): string {
  const p = {
    tab: params.tab ?? "",
    search: params.search ?? "",
    vibe: params.vibe ?? "",
    brand: params.brand ?? "",
    type: params.type ?? "",
    format: params.format ?? "",
    grain: params.grain ?? "",
    contrast: params.contrast ?? "",
    latitude: params.latitude ?? "",
    saturation: params.saturation ?? "",
    bestFor: params.bestFor ?? "",
    iso: params.iso ?? "",
    sort: params.sort ?? "",
    filters: params.filters ?? "",
  };
  return `nav-films:${JSON.stringify(p)}`;
}

/** Default SWR options for nav tabs: keep cache so back-navigation is instant. */
const NAV_SWR_OPTIONS = {
  dedupingInterval: 5 * 60 * 1000, // 5 min
  revalidateOnFocus: false,
  revalidateIfStale: true,
} as const;

export interface UseSearchPageDataOptions {
  params: SearchPageParams;
  /** Pass from server on first load for instant SSR; when navigating back, SWR cache is used. */
  fallbackData?: SearchPageData | undefined;
}

export function useSearchPageData({ params, fallbackData }: UseSearchPageDataOptions) {
  const key = searchPageDataKey(params);
  return useSWR(key, () => getSearchPageData(params), {
    ...NAV_SWR_OPTIONS,
    fallbackData,
    // Keep previous data visible while revalidating so no flash
    keepPreviousData: true,
  });
}

export interface UseFilmsPageDataOptions {
  params: FilmsPageParams;
  /** Pass from server on first load for instant SSR; when navigating back, SWR cache is used. */
  fallbackData?: FilmsPageData | undefined;
}

export function useFilmsPageData({ params, fallbackData }: UseFilmsPageDataOptions) {
  const key = filmsPageDataKey(params);
  return useSWR(key, () => getFilmsPageData(params), {
    ...NAV_SWR_OPTIONS,
    fallbackData,
    keepPreviousData: true,
  });
}

