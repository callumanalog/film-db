"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENT_USER_ID,
  getStoredProfile,
  toggleShot as doToggleShot,
  toggleFavourite as doToggleFavourite,
  addOrUpdateTracked as doAddOrUpdateTracked,
  setRating as doSetRating,
  type StoredUserProfile,
  type TrackedEntry,
} from "@/lib/user-store";

interface UserActionsContextValue extends StoredUserProfile {
  toggleShot: (slug: string) => { added: boolean };
  toggleFavourite: (slug: string) => { added: boolean };
  addOrUpdateTracked: (entry: TrackedEntry) => void;
  setRating: (slug: string, rating: number) => void;
  refresh: () => void;
}

const UserActionsContext = createContext<UserActionsContextValue | null>(null);

export function UserActionsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StoredUserProfile>(() =>
    getStoredProfile(CURRENT_USER_ID)
  );

  const refresh = useCallback(() => {
    setProfile(getStoredProfile(CURRENT_USER_ID));
  }, []);

  useEffect(() => {
    setProfile(getStoredProfile(CURRENT_USER_ID));
  }, []);

  const toggleShot = useCallback((slug: string) => {
    const result = doToggleShot(CURRENT_USER_ID, slug);
    setProfile(getStoredProfile(CURRENT_USER_ID));
    return result;
  }, []);

  const toggleFavourite = useCallback((slug: string) => {
    const result = doToggleFavourite(CURRENT_USER_ID, slug);
    setProfile(getStoredProfile(CURRENT_USER_ID));
    return result;
  }, []);

  const addOrUpdateTracked = useCallback((entry: TrackedEntry) => {
    doAddOrUpdateTracked(CURRENT_USER_ID, entry);
    setProfile(getStoredProfile(CURRENT_USER_ID));
  }, []);

  const setRating = useCallback((slug: string, rating: number) => {
    doSetRating(CURRENT_USER_ID, slug, rating);
    setProfile(getStoredProfile(CURRENT_USER_ID));
  }, []);

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
