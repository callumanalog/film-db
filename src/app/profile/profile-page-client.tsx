"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStocksBySlugs, getStatsForSlugs } from "@/app/actions/get-film-stocks";
import { getProfileFromSupabase } from "@/app/actions/get-profile";
import { ProfileView, type ProfileData } from "@/components/profile-view";
import { useUserActions } from "@/context/user-actions-context";
import { useAuth } from "@/context/auth-context";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

export function ProfilePageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { shotSlugs, favouriteSlugs, tracked, ratings } = useUserActions();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [statsBySlug, setStatsBySlug] = useState<Record<string, { avgRating: number | null }>>({});
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/sign-in?next=/profile");
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    getProfileFromSupabase()
      .then((p) => {
        if (!cancelled && p) {
          setProfile({
            displayName: p.displayName,
            shotSlugs: p.shotSlugs,
            favouriteSlugs: p.favouriteSlugs,
            tracked: p.tracked,
            ratings: p.ratings,
            reviewCount: p.reviewCount,
            uploadCount: p.uploadCount,
            reviews: p.reviews,
            uploads: p.uploads,
          });
        } else if (!cancelled) {
          setProfile({
            displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Member",
            shotSlugs: [],
            favouriteSlugs: [],
            tracked: [],
            ratings: {},
          });
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  const allSlugs = profile
    ? [
        ...profile.shotSlugs,
        ...profile.favouriteSlugs,
        ...profile.tracked.map((t) => t.slug),
        ...Object.keys(profile.ratings),
        ...(profile.reviews?.map((r) => r.film_stock_slug) ?? []),
        ...(profile.uploads?.map((u) => u.film_stock_slug) ?? []),
      ]
    : [...shotSlugs, ...favouriteSlugs, ...tracked.map((t) => t.slug), ...Object.keys(ratings)];
  const uniqueSlugs = [...new Set(allSlugs)];

  useEffect(() => {
    if (uniqueSlugs.length === 0) {
      setStocksBySlug(new Map());
      setStatsBySlug({});
      return;
    }
    Promise.all([getStocksBySlugs(uniqueSlugs), getStatsForSlugs(uniqueSlugs)]).then(([stocks, stats]) => {
      const map = new Map<string, StockWithBrand>();
      stocks.forEach((s) => map.set(s.slug, s));
      setStocksBySlug(map);
      const statsMap: Record<string, { avgRating: number | null }> = {};
      Object.entries(stats).forEach(([slug, s]) => {
        statsMap[slug] = { avgRating: s.avgRating };
      });
      setStatsBySlug(statsMap);
    });
  }, [uniqueSlugs.join(",")]);

  if (authLoading || !user || profileLoading || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-16 w-64 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ProfileView profile={profile} stocksBySlug={stocksBySlug} statsBySlug={statsBySlug} />
    </div>
  );
}
