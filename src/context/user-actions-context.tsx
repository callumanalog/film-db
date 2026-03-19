"use client";

/**
 * User actions (shot, favourite, in camera, rate) are tied to the logged-in user.
 *
 * When logged in:
 *   - Source of truth is Supabase (user_shot, user_favourites, user_in_camera, user_ratings).
 *   - Context is hydrated from getProfileFromSupabase() on load and after each action.
 *
 * When not logged in:
 *   - No actions are saved. Tapping any action redirects to sign-in with ?next= current path.
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
import { useAuth } from "@/context/auth-context";
import { getProfileFromSupabase } from "@/app/actions/get-profile";
import type { ProfileFromDb } from "@/app/actions/get-profile";
import {
  toggleShotInSupabase,
  toggleFavouriteInSupabase,
  setRatingInSupabase,
  toggleInCameraInSupabase,
} from "@/app/actions/user-actions";

interface UserProfile {
  shotSlugs: string[];
  favouriteSlugs: string[];
  inCameraSlugs: string[];
  ratings: Record<string, number>;
}

function toUserProfile(p: ProfileFromDb): UserProfile {
  return {
    shotSlugs: p.shotSlugs,
    favouriteSlugs: p.favouriteSlugs,
    inCameraSlugs: p.inCameraEntries.map((e) => e.film_stock_slug),
    ratings: p.ratings,
  };
}

const EMPTY_PROFILE: UserProfile = {
  shotSlugs: [],
  favouriteSlugs: [],
  inCameraSlugs: [],
  ratings: {},
};

interface UserActionsContextValue extends UserProfile {
  toggleShot: (slug: string) => { added: boolean };
  toggleFavourite: (slug: string) => { added: boolean };
  toggleInCamera: (slug: string, metadata?: { camera?: string; format?: string }) => { added: boolean };
  setRating: (slug: string, rating: number) => void;
  refresh: () => void;
}

const UserActionsContext = createContext<UserActionsContextValue | null>(null);

export function UserActionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  const refetchProfile = useCallback(() => {
    getProfileFromSupabase().then((p) => {
      if (p) setProfile(toUserProfile(p));
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
      if (p) setProfile(toUserProfile(p));
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

  const toggleInCamera = useCallback((slug: string, metadata?: { camera?: string; format?: string }) => {
    if (user) {
      const has = profile.inCameraSlugs.includes(slug);
      setProfile((prev) => {
        if (prev.inCameraSlugs.includes(slug))
          return { ...prev, inCameraSlugs: prev.inCameraSlugs.filter((s) => s !== slug) };
        return { ...prev, inCameraSlugs: [...prev.inCameraSlugs, slug] };
      });
      toggleInCameraInSupabase(slug, metadata).then((res) => {
        if (res.synced) {
          refetchProfile();
          router.refresh();
        }
      });
      return { added: !has };
    }
    redirectToSignIn();
    return { added: false };
  }, [user, profile.inCameraSlugs, refetchProfile, router, redirectToSignIn]);

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
    toggleInCamera,
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
