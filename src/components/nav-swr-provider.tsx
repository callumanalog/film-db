"use client";

import { SWRConfig } from "swr";

/**
 * SWR defaults for nav tab data so that when switching back to Search/Films
 * we show cached data instantly (no white screen or refetch flash).
 */
const navSwrOptions = {
  dedupingInterval: 5 * 60 * 1000, // 5 min
  revalidateOnFocus: false,
  keepPreviousData: true,
} as const;

export function NavSWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={navSwrOptions}>{children}</SWRConfig>;
}
