"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  ChevronLeft,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { getStocksBySlugs } from "@/app/actions/get-film-stocks";
import {
  deleteStockList,
  getStockListDetailForViewer,
  saveStockListBookmark,
  unsaveStockListBookmark,
} from "@/app/actions/stock-lists";
import { createClient } from "@/lib/supabase/client";
import { FilmCard } from "@/components/film-card";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { formatStockListActivityPhrase } from "@/lib/stock-list-relative-activity";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import { cn } from "@/lib/utils";
import { useVisualViewportBox } from "@/lib/use-visual-viewport-box";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FilmStock, FilmBrand } from "@/lib/types";

type StockWithBrand = FilmStock & { brand: FilmBrand };

function profileInitials(primary: string): string {
  const t = primary.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return t.slice(0, 2).toUpperCase();
}

export function StockListDetailClient({
  listId,
  initialOwnerDisplayName,
  initialOwnerAvatarUrl,
}: {
  listId: string;
  initialOwnerDisplayName: string;
  initialOwnerAvatarUrl: string | null;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const viewportOverlay = useVisualViewportBox();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<{
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    ownerUserId: string;
  } | null>(null);
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>([]);
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [ownerName, setOwnerName] = useState(initialOwnerDisplayName);
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState<string | null>(initialOwnerAvatarUrl);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await getStockListDetailForViewer(listId);
      if (!payload.ok) {
        setList(null);
        setOrderedSlugs([]);
        return;
      }
      setList(payload.list);
      setOrderedSlugs(payload.orderedSlugs);
      const slugs = payload.orderedSlugs;
      if (slugs.length === 0) {
        setStocksBySlug(new Map());
      } else {
        const stocks = await getStocksBySlugs(slugs);
        const map = new Map<string, StockWithBrand>();
        stocks.forEach((s) => map.set(s.slug, s as StockWithBrand));
        setStocksBySlug(map);
      }

      const supabase = createClient();
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", payload.list.ownerUserId)
        .maybeSingle();
      const dn = prof?.display_name?.trim();
      if (dn) setOwnerName(dn);
      setOwnerAvatarUrl(prof?.avatar_url?.trim() || null);

      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u && payload.list.ownerUserId !== u.id) {
        const { data: row } = await supabase
          .from("saved_stock_lists")
          .select("list_id")
          .eq("user_id", u.id)
          .eq("list_id", listId)
          .maybeSingle();
        setSaved(!!row);
      } else {
        setSaved(false);
      }
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = user && list && user.id === list.ownerUserId;
  const canBookmark = user && list && user.id !== list.ownerUserId;

  const orderedStocks = useMemo(() => {
    return orderedSlugs.map((slug) => stocksBySlug.get(slug)).filter(Boolean) as StockWithBrand[];
  }, [orderedSlugs, stocksBySlug]);

  const activityLabel = useMemo(() => {
    if (!list) return "";
    return formatStockListActivityPhrase(list.createdAt, list.updatedAt);
  }, [list]);

  async function shareList() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: list?.title ?? "List", url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToastViaEvent("Link copied.");
    } catch {
      showToastViaEvent("Could not copy link.");
    }
  }

  async function toggleBookmark() {
    if (!user) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(`/lists/${listId}`)}`);
      return;
    }
    if (!canBookmark) return;
    setBookmarkBusy(true);
    try {
      if (saved) {
        const res = await unsaveStockListBookmark(listId);
        if (res.ok) {
          setSaved(false);
          showToastViaEvent("Removed from saved lists.");
        } else {
          showToastViaEvent("Could not update.");
        }
      } else {
        const res = await saveStockListBookmark(listId);
        if (res.ok) {
          setSaved(true);
          showToastViaEvent("Saved to your profile.");
        } else if (res.error === "forbidden") {
          showToastViaEvent("You can’t save your own list.");
        } else {
          showToastViaEvent("Could not save.");
        }
      }
    } finally {
      setBookmarkBusy(false);
    }
  }

  const overlayShellStyle =
    viewportOverlay != null ? { top: viewportOverlay.top, height: viewportOverlay.height } : undefined;
  const overlayPositionClass =
    viewportOverlay != null ? "fixed left-0 right-0" : "fixed inset-0";

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      const res = await deleteStockList(listId);
      if (!res.ok) {
        showToastViaEvent("Could not delete list.");
        return;
      }
      showToastViaEvent("List deleted.");
      setDeleteOpen(false);
      router.replace("/profile");
      router.refresh();
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading || !list) {
    return (
      <div
        className={cn(
          overlayPositionClass,
          "z-40 flex items-center justify-center bg-white px-4 dark:bg-background"
        )}
        style={
          overlayShellStyle
            ? { ...overlayShellStyle, paddingTop: "env(safe-area-inset-top, 0px)" }
            : { paddingTop: "env(safe-area-inset-top, 0px)" }
        }
      >
        <p className="text-sm text-muted-foreground">{loading ? "Loading…" : "List not found."}</p>
      </div>
    );
  }

  const count = orderedStocks.length;

  return (
    <div
      className={cn(overlayPositionClass, "z-40 flex min-h-0 flex-col bg-white dark:bg-background")}
      style={overlayShellStyle}
    >
      <div
        className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto overscroll-y-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <header
          className="sticky top-0 z-10 bg-white dark:bg-background"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto flex h-11 max-w-2xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/profile"
              className={topLeftNavIconButtonClassName}
              aria-label="Back"
            >
              <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
            </Link>
            <div className="flex shrink-0 items-center gap-0.5">
              {!user ? (
                <Link
                  href={`/auth/sign-in?next=${encodeURIComponent(`/lists/${listId}`)}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
                  aria-label="Sign in to save this list"
                >
                  <Bookmark className="h-5 w-5" strokeWidth={2} />
                </Link>
              ) : canBookmark ? (
                <button
                  type="button"
                  disabled={bookmarkBusy || authLoading}
                  onClick={() => void toggleBookmark()}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted/80",
                    saved ? "text-primary" : "text-foreground"
                  )}
                  aria-label={saved ? "Remove from saved lists" : "Save list"}
                >
                  <Bookmark className={cn("h-5 w-5", saved && "fill-current")} strokeWidth={2} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void shareList()}
                className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
                aria-label="Share"
              >
                <Share2 className="h-5 w-5" strokeWidth={2} />
              </button>
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-6 w-6" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="px-4 pb-[max(1.5rem,calc(4.5rem+env(safe-area-inset-bottom,0px)))] pt-2 sm:px-6 md:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Link
            href={`/users/${list.ownerUserId}`}
            className="-mx-1 mb-3 flex min-w-0 max-w-full items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`View profile: ${ownerName}`}
          >
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted sm:size-10">
              {ownerAvatarUrl ? (
                <Image src={ownerAvatarUrl} alt="" fill className="object-cover" sizes="40px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-sans text-xs font-semibold text-muted-foreground">
                  {profileInitials(ownerName)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-sans text-sm font-semibold text-foreground">{ownerName}</span>
              <span className="mt-0.5 block font-sans text-xs leading-snug text-muted-foreground">{activityLabel}</span>
            </div>
          </Link>
          <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground md:text-[1.75rem]">
            {list.title}
          </h1>
          {list.description?.trim() ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{list.description.trim()}</p>
          ) : null}
          {count === 0 ? (
            <p
              className={cn(
                "py-12 text-center text-sm text-muted-foreground",
                list.description?.trim() ? "mt-3" : "mt-2"
              )}
            >
              This list has no stocks.
            </p>
          ) : (
            <div
              className={cn(
                "grid grid-cols-3 gap-2 sm:gap-3 md:gap-4",
                list.description?.trim() ? "mt-3" : "mt-2"
              )}
            >
              {orderedStocks.map((stock) => (
                <FilmCard key={stock.slug} stock={stock} compact />
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="gap-0 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/60 px-4 pb-3 text-left">
            <SheetTitle>List options</SheetTitle>
          </SheetHeader>
          <div className="py-1">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium hover:bg-accent"
              onClick={() => {
                setMenuOpen(false);
                router.push(`/lists/${listId}/edit`);
              }}
            >
              <Pencil className="h-5 w-5 text-muted-foreground" />
              Edit list
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive hover:bg-accent"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-5 w-5" />
              Delete list
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="bottom" className="gap-0 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/60 px-4 pb-3 text-left">
            <SheetTitle>Delete list?</SheetTitle>
          </SheetHeader>
          <p className="px-4 py-3 text-sm text-muted-foreground">
            This removes “{list.title}” and cannot be undone.
          </p>
          <div className="flex flex-col gap-2 border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={deleteBusy}
              onClick={() => void handleDelete()}
            >
              {deleteBusy ? "Deleting…" : "Delete list"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
