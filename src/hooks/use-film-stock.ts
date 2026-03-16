"use client";

import useSWR from "swr";
import type { FilmStockWithRelations } from "@/lib/types";
import type { FilmStockStats } from "@/lib/supabase/stats";

interface FilmStockApiResponse {
  stock: FilmStockWithRelations;
  stats: FilmStockStats;
}

const FETCHER = async (url: string): Promise<FilmStockApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(res.status === 404 ? "Not found" : "Failed to load film stock");
    throw err;
  }
  return res.json();
};

const STALE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches film stock + stats with SWR. Use fallbackData from server render for instant first paint;
 * subsequent navigations to the same slug get cached data and revalidate in background.
 */
export function useFilmStock(
  slug: string | null,
  fallbackData?: FilmStockApiResponse
) {
  const { data, error, isLoading, mutate } = useSWR<FilmStockApiResponse>(
    slug ? `/api/films/${slug}` : null,
    FETCHER,
    {
      fallbackData,
      dedupingInterval: STALE_MS,
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  );

  return {
    stock: data?.stock ?? null,
    stats: data?.stats ?? null,
    error,
    isLoading: slug != null && !data && !error,
    mutate,
  };
}
