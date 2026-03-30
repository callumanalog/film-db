"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStocksBySlugs, getStatsForSlugs } from "@/app/actions/get-film-stocks";
import { getProfileFromSupabase } from "@/app/actions/get-profile";
import { ProfileView, type ProfileData } from "@/components/profile-view";
import { useUserActions } from "@/context/user-actions-context";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import { showToastViaEvent } from "@/components/toast";
import { getEmailRedirectOrigin, buildCallbackUrl } from "@/lib/auth-redirect";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

export function ProfilePageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { shotSlugs, favouriteSlugs, inCameraSlugs, ratings } = useUserActions();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [statsBySlug, setStatsBySlug] = useState<Record<string, { avgRating: number | null }>>({});
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(
    async (opts?: { soft?: boolean }) => {
      if (!user) return;
      if (!opts?.soft) setProfileLoading(true);
      try {
        const p = await getProfileFromSupabase();
        if (p) {
          setProfile({
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
          });
        } else {
          setProfile({
            displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Member",
            fullName: null,
            bio: null,
            avatarUrl: null,
            instagramUrl: null,
            websiteUrl: null,
            followersCount: 0,
            followingCount: 0,
            shotSlugs: [],
            favouriteSlugs: [],
            inCameraEntries: [],
            ratings: {},
            likedReviews: [],
            savedUploads: [],
            likedUploads: [],
            boards: [],
            createdStockLists: [],
            savedStockLists: [],
          });
        }
      } finally {
        if (!opts?.soft) setProfileLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/sign-in?next=/profile");
      return;
    }
    loadProfile();
  }, [authLoading, user, router, loadProfile]);

  const allSlugs = profile
    ? [
        ...profile.shotSlugs,
        ...profile.favouriteSlugs,
        ...(profile.inCameraEntries?.map((e) => e.film_stock_slug) ?? []),
        ...Object.keys(profile.ratings),
        ...(profile.reviews?.map((r) => r.film_stock_slug) ?? []),
        ...(profile.uploads?.map((u) => u.film_stock_slug) ?? []),
        ...(profile.likedReviews?.map((r) => r.film_stock_slug) ?? []),
        ...(profile.savedUploads?.map((u) => u.film_stock_slug) ?? []),
        ...(profile.likedUploads?.map((u) => u.film_stock_slug) ?? []),
      ]
    : [...shotSlugs, ...favouriteSlugs, ...inCameraSlugs, ...Object.keys(ratings)];
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

  const isUnverified = user && !(user as { email_confirmed_at?: string }).email_confirmed_at;
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const handleResendVerification = async () => {
    if (!user?.email || resendStatus === "loading") return;
    setResendStatus("loading");
    const supabase = createClient();
    const origin = getEmailRedirectOrigin() || (typeof window !== "undefined" ? window.location.origin : "");
    const callbackUrl = buildCallbackUrl("/profile", origin);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: callbackUrl },
    });
    if (error) {
      const isRateLimit = /rate limit|too many requests/i.test(error.message);
      setResendStatus("error");
      showToastViaEvent(isRateLimit ? "Too many emails sent. Please try again in a few minutes." : error.message);
      return;
    }
    setResendStatus("sent");
    showToastViaEvent("Verification email sent. Check your inbox.");
  };

  if (authLoading || !user || profileLoading || !profile) {
    return (
      <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col px-0 pt-0 pb-8 sm:px-6 lg:px-8 md:flex-none">
        <div className="animate-pulse space-y-6 px-4 sm:px-0">
          <div className="h-16 w-64 rounded-card bg-muted" />
          <div className="h-32 rounded-card bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden overflow-y-visible px-0 pt-0 pb-8 sm:px-6 lg:px-8 md:flex-none md:overflow-visible md:pb-8">
      {isUnverified && (
        <div className="mx-4 mb-6 shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 sm:mx-0 dark:border-amber-800 dark:bg-amber-950/40">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Verify your email to unlock all account features
          </p>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendStatus === "loading"}
            className="shrink-0 text-sm font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 dark:text-amber-300 dark:hover:text-amber-100"
          >
            {resendStatus === "loading" ? "Sending…" : resendStatus === "sent" ? "Email sent" : "Resend email"}
          </button>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col md:block md:flex-none">
        <ProfileView
          profile={profile}
          stocksBySlug={stocksBySlug}
          statsBySlug={statsBySlug}
          userId={user.id}
          onProfileUpdated={async () => {
            await loadProfile({ soft: true });
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
