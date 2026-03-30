"use client";

import { useEffect, useMemo, useState } from "react";
import { getStocksBySlugs, getStatsForSlugs } from "@/app/actions/get-film-stocks";
import { ProfileView, type ProfileData, type ProfileMemberActions } from "@/components/profile-view";
import type { ProfileFromDb } from "@/app/actions/get-profile";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

function profileFromDbToProfileData(p: ProfileFromDb): ProfileData {
  return {
    displayName: p.displayName,
    fullName: p.fullName,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    instagramUrl: p.instagramUrl,
    websiteUrl: p.websiteUrl,
    followersCount: p.followersCount,
    followingCount: p.followingCount,
    shotSlugs: p.shotSlugs,
    favouriteSlugs: p.favouriteSlugs,
    inCameraEntries: p.inCameraEntries,
    ratings: p.ratings,
    reviewCount: p.reviewCount,
    uploadCount: p.uploadCount,
    reviews: p.reviews,
    uploads: p.uploads,
    likedReviews: p.likedReviews,
    savedUploads: p.savedUploads,
    likedUploads: p.likedUploads,
    boards: p.boards ?? [],
    createdStockLists: p.createdStockLists ?? [],
    savedStockLists: p.savedStockLists ?? [],
  };
}

export function PublicMemberProfileClient({
  profileUserId,
  profileDb,
  viewerUserId,
  initialFollowing,
}: {
  profileUserId: string;
  profileDb: ProfileFromDb;
  viewerUserId: string | null;
  initialFollowing: boolean;
}) {
  const [profile] = useState<ProfileData>(() => profileFromDbToProfileData(profileDb));
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [statsBySlug, setStatsBySlug] = useState<Record<string, { avgRating: number | null }>>({});

  const memberActions: ProfileMemberActions = useMemo(
    () => ({
      viewerIsAuthenticated: Boolean(viewerUserId),
      initialFollowing,
      signInNextPath: `/users/${profileUserId}`,
    }),
    [viewerUserId, initialFollowing, profileUserId]
  );

  const allSlugs = useMemo(() => {
    const slugs = [
      ...profile.shotSlugs,
      ...profile.favouriteSlugs,
      ...(profile.inCameraEntries?.map((e) => e.film_stock_slug) ?? []),
      ...Object.keys(profile.ratings),
      ...(profile.reviews?.map((r) => r.film_stock_slug) ?? []),
      ...(profile.uploads?.map((u) => u.film_stock_slug) ?? []),
      ...(profile.likedReviews?.map((r) => r.film_stock_slug) ?? []),
      ...(profile.savedUploads?.map((u) => u.film_stock_slug) ?? []),
      ...(profile.likedUploads?.map((u) => u.film_stock_slug) ?? []),
    ];
    return [...new Set(slugs)];
  }, [profile]);

  const slugKey = allSlugs.join(",");

  useEffect(() => {
    if (allSlugs.length === 0) return;
    let cancelled = false;
    Promise.all([getStocksBySlugs(allSlugs), getStatsForSlugs(allSlugs)]).then(([stocks, stats]) => {
      if (cancelled) return;
      const map = new Map<string, StockWithBrand>();
      stocks.forEach((s) => map.set(s.slug, s));
      setStocksBySlug(map);
      const statsMap: Record<string, { avgRating: number | null }> = {};
      Object.entries(stats).forEach(([slug, s]) => {
        statsMap[slug] = { avgRating: s.avgRating };
      });
      setStatsBySlug(statsMap);
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- slugKey is allSlugs.join(","); identifies slug set for this profile
  }, [slugKey]);

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden overflow-y-visible px-0 pt-0 pb-8 sm:px-6 lg:px-8 md:flex-none md:overflow-visible md:pb-8">
      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col md:block md:flex-none">
        <ProfileView
          mode="member"
          profile={profile}
          stocksBySlug={stocksBySlug}
          statsBySlug={statsBySlug}
          userId={profileUserId}
          memberActions={memberActions}
        />
      </div>
    </div>
  );
}
