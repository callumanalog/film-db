"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStocksBySlugs, getStatsForSlugs } from "@/app/actions/get-film-stocks";
import {
  getProfileCriticalFromSupabase,
  getProfileDeferredFromSupabase,
  type ProfileCriticalFromDb,
} from "@/app/actions/get-profile";
import { ProfileView, type ProfileData } from "@/components/profile-view";
import { useUserActions } from "@/context/user-actions-context";
import { createClient } from "@/lib/supabase/client";
import { showToastViaEvent } from "@/components/toast";
import { getEmailRedirectOrigin, buildCallbackUrl } from "@/lib/auth-redirect";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

export function ProfilePageClient({
  initialProfile,
  userId,
  userEmail,
  isEmailVerified,
}: {
  initialProfile: ProfileCriticalFromDb;
  userId: string;
  userEmail: string | null;
  isEmailVerified: boolean;
}) {
  const router = useRouter();
  const { shotSlugs, favouriteSlugs, inCameraSlugs, ratings } = useUserActions();
  const [profile, setProfile] = useState<ProfileData>({
    ...initialProfile,
    likedReviews: [],
    savedUploads: [],
    likedUploads: [],
    boards: [],
    createdStockLists: [],
    savedStockLists: [],
  });
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [statsBySlug, setStatsBySlug] = useState<Record<string, { avgRating: number | null }>>({});
  const [activeTabId, setActiveTabId] = useState("scans");
  const [deferredLoaded, setDeferredLoaded] = useState(false);
  const [deferredLoading, setDeferredLoading] = useState(false);

  const loadProfile = useCallback(
    async (opts?: { soft?: boolean }) => {
      const p = await getProfileCriticalFromSupabase();
      if (!p) return;
      setProfile((prev) => ({
        ...prev,
        ...p,
      }));
      if (!opts?.soft) setDeferredLoaded(false);
    },
    []
  );

  useEffect(() => {
    if (deferredLoaded || deferredLoading) return;
    if (activeTabId !== "boards" && activeTabId !== "lists") return;
    let cancelled = false;
    setDeferredLoading(true);
    void getProfileDeferredFromSupabase()
      .then((deferred) => {
        if (!deferred || cancelled) return;
        setProfile((prev) => ({ ...prev, ...deferred }));
        setDeferredLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setDeferredLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTabId, deferredLoaded, deferredLoading]);

  const uniqueSlugs = useMemo(() => {
    const allSlugs = [
      ...profile.shotSlugs,
      ...profile.favouriteSlugs,
      ...(profile.inCameraEntries?.map((e) => e.film_stock_slug) ?? []),
      ...Object.keys(profile.ratings),
      ...(profile.reviews?.map((r) => r.film_stock_slug) ?? []),
      ...(profile.uploads?.map((u) => u.film_stock_slug) ?? []),
      ...(profile.likedReviews?.map((r) => r.film_stock_slug) ?? []),
      ...(profile.savedUploads?.map((u) => u.film_stock_slug) ?? []),
      ...(profile.likedUploads?.map((u) => u.film_stock_slug) ?? []),
      ...shotSlugs,
      ...favouriteSlugs,
      ...inCameraSlugs,
      ...Object.keys(ratings),
    ];
    return [...new Set(allSlugs)];
  }, [profile, shotSlugs, favouriteSlugs, inCameraSlugs, ratings]);
  const slugKey = uniqueSlugs.join(",");

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- slugKey identifies unique slug set for stock/stat hydration.
  }, [slugKey]);

  const isUnverified = !isEmailVerified;
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const handleResendVerification = async () => {
    if (!userEmail || resendStatus === "loading") return;
    setResendStatus("loading");
    const supabase = createClient();
    const origin = getEmailRedirectOrigin() || (typeof window !== "undefined" ? window.location.origin : "");
    const callbackUrl = buildCallbackUrl("/profile", origin);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: userEmail,
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
          userId={userId}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          loadingTabs={{
            boards: activeTabId === "boards" && deferredLoading,
            lists: activeTabId === "lists" && deferredLoading,
          }}
          onProfileUpdated={async () => {
            await loadProfile({ soft: true });
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
