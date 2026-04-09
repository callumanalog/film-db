"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { isFollowingFilmStock, toggleFollowFilmStock } from "@/app/actions/film-stock-follows";
import { showToastViaEvent } from "@/components/toast";
import { cn } from "@/lib/utils";

const BTN =
  "inline-flex h-8 min-w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-black bg-black px-3 text-xs font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-50 sm:h-9 sm:text-sm";

export function FilmStockFollowHeaderButton({ filmStockSlug }: { filmStockSlug: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(pathname ?? `/films/${filmStockSlug}`)}`;

  const [following, setFollowing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user || !filmStockSlug) {
      setFollowing(false);
      setHydrated(true);
      return;
    }
    setHydrated(false);
    void isFollowingFilmStock(filmStockSlug).then((v) => {
      if (!cancelled) {
        setFollowing(v);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, filmStockSlug]);

  const onToggle = useCallback(() => {
    if (!user) {
      router.push(signInHref);
      return;
    }
    void (async () => {
      setPending(true);
      const res = await toggleFollowFilmStock(filmStockSlug);
      setPending(false);
      if (!res.ok) {
        if (res.error === "sign_in_required") router.push(signInHref);
        else showToastViaEvent("Could not update follow. Try again.");
        return;
      }
      setFollowing(res.following);
      showToastViaEvent(res.following ? "Following this stock" : "Unfollowed");
      router.refresh();
    })();
  }, [filmStockSlug, router, signInHref, user]);

  if (loading) {
    return <div className={cn(BTN, "pointer-events-none opacity-40")} aria-hidden>Follow</div>;
  }

  if (!user) {
    return (
      <Link href={signInHref} className={BTN}>
        Follow
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(BTN, following && "border-black bg-white text-black hover:bg-neutral-100")}
      disabled={pending || !hydrated}
      onClick={onToggle}
      aria-pressed={following}
      aria-label={following ? "Unfollow film stock" : "Follow film stock"}
    >
      {pending ? "…" : following ? "Following" : "Follow"}
    </button>
  );
}
