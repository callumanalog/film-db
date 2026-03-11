"use client";

import { useEffect, useState } from "react";
import { getStocksBySlugs } from "@/app/actions/get-film-stocks";
import { ProfileView, type ProfileData } from "@/components/profile-view";
import { useUserActions } from "@/context/user-actions-context";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

const DISPLAY_NAME = "Alex";

export function ProfilePageClient() {
  const { shotSlugs, favouriteSlugs, tracked, ratings } = useUserActions();
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());

  const allSlugs = [
    ...shotSlugs,
    ...favouriteSlugs,
    ...tracked.map((t) => t.slug),
    ...Object.keys(ratings),
  ];
  const uniqueSlugs = [...new Set(allSlugs)];

  useEffect(() => {
    if (uniqueSlugs.length === 0) {
      setStocksBySlug(new Map());
      return;
    }
    getStocksBySlugs(uniqueSlugs).then((stocks) => {
      const map = new Map<string, StockWithBrand>();
      stocks.forEach((s) => map.set(s.slug, s));
      setStocksBySlug(map);
    });
  }, [uniqueSlugs.join(",")]);

  const profile: ProfileData = {
    displayName: DISPLAY_NAME,
    shotSlugs,
    favouriteSlugs,
    tracked,
    ratings,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ProfileView profile={profile} stocksBySlug={stocksBySlug} />
    </div>
  );
}
