"use client";

/**
 * User actions (shot, favourite, track, rate) are tied to the logged-in user and shown on their profile.
 *
 * When logged in:
 *   - Source of truth is Supabase (user_shot, user_favourites, user_tracked, user_ratings by user_id).
 *   - Context is hydrated from getProfileFromSupabase() on load and after each action.
 *   - Every action persists to Supabase then refetches profile and refreshes the page so stats and profile stay in sync.
 *
 * When not logged in:
 *   - No actions are saved. Tapping any action (shot, favourite, track, rate) redirects to log-in/sign-up
  *   - with ?next= current path so the user returns to the page after logging in.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { StoredUserProfile, TrackedEntry } from "@/lib/user-store";
import { useAuth } from "@/context/auth-context";
import { getProfileFromSupabase } from "@/app/actions/get-profile";
import type { ProfileFromDb } from "@/app/actions/get-profile";
import {
  toggleShotInSupabase,
  toggleFavouriteInSupabase,
  setRatingInSupabase,
  upsertTrackedInSupabase,
} from "@/app/actions/user-actions";

function toStoredProfile(p: ProfileFromDb): StoredUserProfile {
  return {
    shotSlugs: p.shotSlugs,
    favouriteSlugs: p.favouriteSlugs,
    tracked: p.tracked,
    ratings: p.ratings,
  };
}

const EMPTY_PROFILE: StoredUserProfile = {
  shotSlugs: [],
  favouriteSlugs: [],
  tracked: [],
  ratings: {},
};

interface UserActionsContextValue extends StoredUserProfile {
  toggleShot: (slug: string) => { added: boolean };
  toggleFavourite: (slug: string) => { added: boolean };
  addOrUpdateTracked: (entry: TrackedEntry) => void;
  setRating: (slug: string, rating: number) => void;
  refresh: () => void;
}

const UserActionsContext = createContext<UserActionsContextValue | null>(null);

export function UserActionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<StoredUserProfile>(EMPTY_PROFILE);

  const refetchProfile = useCallback(() => {
    getProfileFromSupabase().then((p) => {
      if (p) setProfile(toStoredProfile(p));
    });
  }, []);

  const redirectToSignIn = useCallback(() => {
    router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
  }, [router, pathname]);

  const refresh = useCallback(() => {
    if (user) refetchProfile();
    else setProfile(EMPTY_PROFILE);
  }, [user, refetchProfile]);

  useEffect(() => {
    if (!user) {
      setProfile(EMPTY_PROFILE);
      return;
    }
    getProfileFromSupabase().then((p) => {
      if (p) setProfile(toStoredProfile(p));
    });
  }, [user?.id]);

  const toggleShot = useCallback((slug: string) => {
    if (user) {
      const has = profile.shotSlugs.includes(slug);
      setProfile((prev) => {
        if (prev.shotSlugs.includes(slug))
          return { ...prev, shotSlugs: prev.shotSlugs.filter((s) => s !== slug) };
        return { ...prev, shotSlugs: [...prev.shotSlugs, slug] };
      });
      toggleShotInSupabase(slug).then((res) => {
        if (res.synced) {
          refetchProfile();
          router.refresh();
        }
      });
      return { added: !has };
    }
    redirectToSignIn();
    return { added: false };
  }, [user, profile.shotSlugs, refetchProfile, router, redirectToSignIn]);

  const toggleFavourite = useCallback((slug: string) => {
    if (user) {
      const has = profile.favouriteSlugs.includes(slug);
      setProfile((prev) => {
        if (prev.favouriteSlugs.includes(slug))
          return { ...prev, favouriteSlugs: prev.favouriteSlugs.filter((s) => s !== slug) };
        return { ...prev, favouriteSlugs: [...prev.favouriteSlugs, slug] };
      });
      toggleFavouriteInSupabase(slug).then((res) => {
        if (res.synced) {
          refetchProfile();
          router.refresh();
        }
      });
      return { added: !has };
    }
    redirectToSignIn();
    return { added: false };
  }, [user, profile.favouriteSlugs, refetchProfile, router, redirectToSignIn]);

  const addOrUpdateTracked = useCallback((entry: TrackedEntry) => {
    if (user) {
      setProfile((prev) => {
        const idx = prev.tracked.findIndex((t) => t.slug === entry.slug);
        const next = idx >= 0 ? [...prev.tracked] : [...prev.tracked, entry];
        if (idx >= 0) next[idx] = entry;
        return { ...prev, tracked: next };
      });
      upsertTrackedInSupabase(entry).then((res) => {
        if (res.synced) {
          refetchProfile();
          router.refresh();
        }
      });
      return;
    }
    redirectToSignIn();
  }, [user, refetchProfile, router, redirectToSignIn]);

  const setRating = useCallback((slug: string, rating: number) => {
    if (user) {
      setProfile((prev) => {
        if (rating <= 0) {
          const { [slug]: _, ...rest } = prev.ratings;
          return { ...prev, ratings: rest };
        }
        return { ...prev, ratings: { ...prev.ratings, [slug]: rating } };
      });
      setRatingInSupabase(slug, rating).then((res) => {
        if (res.synced) {
          refetchProfile();
          router.refresh();
        }
      });
      return;
    }
    redirectToSignIn();
  }, [user, refetchProfile, router, redirectToSignIn]);

  const value: UserActionsContextValue = {
    ...profile,
    toggleShot,
    toggleFavourite,
    addOrUpdateTracked,
    setRating,
    refresh,
  };

  return (
    <UserActionsContext.Provider value={value}>
      {children}
    </UserActionsContext.Provider>
  );
}

export function useUserActions(): UserActionsContextValue {
  const ctx = useContext(UserActionsContext);
  if (!ctx) throw new Error("useUserActions must be used within UserActionsProvider");
  return ctx;
}
