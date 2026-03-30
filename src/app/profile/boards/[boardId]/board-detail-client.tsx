"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, MoreHorizontal, Plus, Share2, Trash2 } from "lucide-react";
import {
  getBoardPagePayload,
  addUploadToBoard,
  removeSavedUploadsFromBoard,
  deleteBoard,
  type BoardPageItem,
  type BoardPageAvailableRow,
} from "@/app/actions/boards";
import { FilmNativeMasonryGrid } from "@/components/film-native-grid";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import { BoardFormSheet } from "@/components/board-form-sheet";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import { cn } from "@/lib/utils";
import {
  collectLightboxSlidesFromGalleryImages,
  findGalleryImageForLightboxSlide,
  relatedGalleryLightboxSlidesForStock,
} from "@/lib/lightbox-group";
import type { GalleryImage } from "@/lib/sample-images";
import { getStocksBySlugs } from "@/app/actions/get-film-stocks";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type StockWithBrand = FilmStock & { brand: FilmBrand };

function rowsToGallery(
  rows: { uploadId: string; filmStockSlug: string; imageUrl: string | null; caption: string | null }[],
  stocksBySlug: Map<string, StockWithBrand>,
  viewerName: string
): GalleryImage[] {
  return rows
    .filter((u) => u.imageUrl)
    .map((u) => {
      const stock = stocksBySlug.get(u.filmStockSlug);
      return {
        id: u.uploadId,
        galleryId: `board-${u.filmStockSlug}-${u.uploadId}`,
        stockSlug: u.filmStockSlug,
        stockName: stock?.name ?? u.filmStockSlug,
        brandName: stock?.brand.name ?? "",
        username: viewerName,
        camera: "",
        settings: "",
        likes: 0,
        source: "community" as const,
        imageUrl: u.imageUrl!,
        caption: u.caption,
        uploadId: u.uploadId,
      };
    });
}

export function BoardDetailClient({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [items, setItems] = useState<BoardPageItem[]>([]);
  const [availableToAdd, setAvailableToAdd] = useState<BoardPageAvailableRow[]>([]);
  const [displayName, setDisplayName] = useState("Member");
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedManage, setSelectedManage] = useState<Set<string>>(() => new Set());
  const [manageBusy, setManageBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [addingUploadId, setAddingUploadId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = await getBoardPagePayload(boardId);
      if (!payload.ok) {
        setBoard(null);
        setItems([]);
        setAvailableToAdd([]);
        return;
      }
      setBoard(payload.board);
      setItems(payload.items);
      setAvailableToAdd(payload.availableToAdd);
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Member";
      setDisplayName(typeof name === "string" ? name : "Member");
      const slugs = [
        ...new Set([
          ...payload.items.map((i) => i.filmStockSlug),
          ...payload.availableToAdd.map((a) => a.filmStockSlug),
        ]),
      ];
      if (slugs.length === 0) {
        setStocksBySlug(new Map());
      } else {
        const stocks = await getStocksBySlugs(slugs);
        const map = new Map<string, StockWithBrand>();
        stocks.forEach((s) => map.set(s.slug, s as StockWithBrand));
        setStocksBySlug(map);
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/auth/sign-in?next=/profile/boards/${boardId}`);
      return;
    }
    void load();
  }, [authLoading, user, router, boardId, load]);

  const galleryBoard = useMemo(
    () => rowsToGallery(items, stocksBySlug, displayName),
    [items, stocksBySlug, displayName]
  );
  const galleryAvailable = useMemo(
    () => rowsToGallery(availableToAdd, stocksBySlug, displayName),
    [availableToAdd, stocksBySlug, displayName]
  );

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    const slide = lightboxSession.slides[0];
    const pool = galleryBoard.some((g) => g.uploadId === slide.uploadId) ? galleryBoard : galleryAvailable;
    return relatedGalleryLightboxSlidesForStock(slide, pool);
  }, [lightboxSession, galleryBoard, galleryAvailable]);

  async function shareBoard() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: board?.name ?? "Board", url });
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

  async function handleAddScan(uploadId: string) {
    setAddingUploadId(uploadId);
    try {
      const res = await addUploadToBoard(boardId, uploadId);
      if (res.ok) {
        showToastViaEvent(`Scan added to ${res.boardName}`);
        await load();
      } else if (res.error === "duplicate") {
        showToastViaEvent("Already on this board.");
      } else {
        showToastViaEvent("Could not add scan.");
      }
    } finally {
      setAddingUploadId(null);
    }
  }

  async function handleRemoveSelected() {
    if (selectedManage.size === 0) return;
    setManageBusy(true);
    try {
      const res = await removeSavedUploadsFromBoard(boardId, [...selectedManage]);
      if (res.ok) {
        showToastViaEvent("Removed from board.");
        setManageOpen(false);
        setSelectedManage(new Set());
        await load();
      } else {
        showToastViaEvent(res.error);
      }
    } finally {
      setManageBusy(false);
    }
  }

  async function handleDeleteBoard() {
    setDeleteBusy(true);
    try {
      const res = await deleteBoard(boardId);
      if (res.ok) {
        showToastViaEvent("Board deleted.");
        setDeleteOpen(false);
        router.replace("/profile");
        router.refresh();
      } else {
        showToastViaEvent(res.error === "not_found" ? "Board not found." : res.error);
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  const boardItemsForGrid = useMemo(() => {
    return galleryBoard.map((img) => ({
      id: img.galleryId,
      imageUrl: img.imageUrl ?? null,
      overlayLabel: img.stockName,
      href: `/films/${img.stockSlug}/images`,
      onActivate: () =>
        setLightboxSession(collectLightboxSlidesFromGalleryImages(galleryBoard, img)),
    }));
  }, [galleryBoard]);

  const availableItemsForGrid = useMemo(() => {
    return availableToAdd.map((row) => {
      const uid = row.uploadId;
      const img = galleryAvailable.find((g) => g.uploadId === uid);
      if (!img) return null;
      return {
        id: img.galleryId,
        imageUrl: img.imageUrl ?? null,
        overlayLabel: img.stockName,
        href: `/films/${img.stockSlug}/images`,
        onActivate: () =>
          setLightboxSession(collectLightboxSlidesFromGalleryImages(galleryAvailable, img)),
        topRightSlot: (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-[2px] transition-colors hover:bg-black/70"
            aria-label="Add to board"
            disabled={addingUploadId !== null}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              void handleAddScan(uid);
            }}
          >
            {addingUploadId === uid ? (
              <span className="text-caption">…</span>
            ) : (
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            )}
          </button>
        ),
      };
    }).filter(Boolean) as {
      id: string;
      imageUrl: string | null;
      overlayLabel: string;
      href: string;
      onActivate: () => void;
      topRightSlot: ReactNode;
    }[];
  }, [availableToAdd, galleryAvailable, addingUploadId]);

  const uploadIdToSavedId = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of items) m.set(i.uploadId, i.savedUploadId);
    return m;
  }, [items]);

  const manageItemsForGrid = useMemo(() => {
    return galleryBoard.map((img) => {
      const upId = img.uploadId?.trim() ?? "";
      const sid = upId ? (uploadIdToSavedId.get(upId) ?? null) : null;
      const selected = sid ? selectedManage.has(sid) : false;
      return {
        id: img.galleryId,
        imageUrl: img.imageUrl ?? null,
        overlayLabel: "",
        href: "#",
        showOverlay: false,
        frameClassName: selected ? "ring-2 ring-primary ring-offset-1 ring-offset-white dark:ring-offset-background" : undefined,
        onActivate: () => {
          if (!sid) return;
          setSelectedManage((prev) => {
            const next = new Set(prev);
            if (next.has(sid)) next.delete(sid);
            else next.add(sid);
            return next;
          });
        },
        topRightSlot: selected ? (
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
          </div>
        ) : null,
      };
    });
  }, [galleryBoard, uploadIdToSavedId, selectedManage]);

  if (authLoading || !user) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!loading && !board) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-muted-foreground">Board not found.</p>
        <Link href="/profile" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Back to profile
        </Link>
      </div>
    );
  }

  const count = galleryBoard.length;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-white dark:bg-background">
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-white dark:bg-background"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-2 sm:px-6">
          <Link
            href="/profile"
            className={topLeftNavIconButtonClassName}
            aria-label="Back to profile"
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => void shareBoard()}
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
              aria-label="Board options"
              onClick={() => setMenuOpen(true)}
            >
              <MoreHorizontal className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4 pt-0 sm:px-6">
          <h1 className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground md:text-[1.75rem]">
            {board?.name ?? "…"}
          </h1>
          <span className="mt-1 block font-sans text-[10px] font-medium uppercase leading-tight tracking-wider text-muted-foreground">
            {loading ? "…" : `${count} ${count === 1 ? "scan" : "scans"}`}
          </span>
          {board?.description?.trim() ? (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{board.description.trim()}</p>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 px-4 pb-24 pt-0 sm:px-6 md:pb-8">
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {count > 0 ? (
              <div
                className={cn(
                  "min-w-0",
                  "max-md:-mx-4 max-md:w-[calc(100%+2rem)]",
                  "sm:max-md:-mx-6 sm:max-md:w-[calc(100%+3rem)]",
                  "md:mx-0 md:w-full"
                )}
              >
                <FilmNativeMasonryGrid items={boardItemsForGrid} ariaLabel="Board scans" />
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No scans on this board yet.</p>
              </div>
            )}

            {availableToAdd.length > 0 ? (
              <section className="mt-10" aria-labelledby="board-add-saved-heading">
                <h2
                  id="board-add-saved-heading"
                  className="mb-3 px-0 font-sans text-base font-semibold tracking-tight text-foreground"
                >
                  Add saved scans to board?
                </h2>
                <div
                  className={cn(
                    "min-w-0",
                    "max-md:-mx-4 max-md:w-[calc(100%+2rem)]",
                    "sm:max-md:-mx-6 sm:max-md:w-[calc(100%+3rem)]",
                    "md:mx-0 md:w-full"
                  )}
                >
                  <FilmNativeMasonryGrid items={availableItemsForGrid} ariaLabel="Saved scans to add" />
                </div>
              </section>
            ) : count === 0 ? (
              <p className="mt-6 px-2 text-center text-sm text-muted-foreground">
                Save community scans first, then add them here with the + button.
              </p>
            ) : null}
          </>
        )}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="gap-0 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/60 text-left">
            <SheetTitle>Board</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="flex min-h-[52px] w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left font-sans text-base text-foreground transition-colors hover:bg-muted/40 active:bg-muted/60"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              Edit board
            </button>
            <button
              type="button"
              className="flex min-h-[52px] w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left font-sans text-base text-foreground transition-colors hover:bg-muted/40 active:bg-muted/60"
              onClick={() => {
                setMenuOpen(false);
                setSelectedManage(new Set());
                setManageOpen(true);
              }}
            >
              Manage board
            </button>
            <button
              type="button"
              className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left font-sans text-base text-destructive transition-colors hover:bg-muted/40 active:bg-muted/60"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              Delete board
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {board ? (
        <BoardFormSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          boardId={board.id}
          initialName={board.name}
          initialDescription={board.description ?? ""}
          onSuccess={() => void load()}
        />
      ) : null}

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] gap-0 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/60 text-left">
            <SheetTitle>Manage board</SheetTitle>
          </SheetHeader>
          <p className="px-4 pt-2 text-sm text-muted-foreground">Tap scans to select, then remove them from this board.</p>
          <div className="min-h-0 flex-1 overflow-y-auto px-0 pb-2 pt-2">
            <FilmNativeMasonryGrid items={manageItemsForGrid} ariaLabel="Select scans to remove" />
          </div>
          <div className="border-t border-border/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="destructive"
              size="cta"
              className="w-full gap-2"
              disabled={selectedManage.size === 0 || manageBusy}
              onClick={() => void handleRemoveSelected()}
            >
              <Trash2 className="size-4" aria-hidden />
              {manageBusy
                ? "Removing…"
                : `Remove from board${selectedManage.size ? ` (${selectedManage.size})` : ""}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="bottom" className="gap-0 p-0" showCloseButton>
          <SheetHeader className="border-b border-border/60 text-left">
            <SheetTitle>Delete board?</SheetTitle>
          </SheetHeader>
          <p className="p-4 text-sm text-muted-foreground">
            This removes the board only. Your saved scans stay in{" "}
            <Link href="/profile/boards/all" className="font-medium text-primary underline-offset-2 hover:underline">
              All saved scans
            </Link>
            .
          </p>
          <div className="flex flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" size="cta" className="w-full" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="cta"
              className="w-full"
              disabled={deleteBusy}
              onClick={() => void handleDeleteBoard()}
            >
              {deleteBusy ? "Deleting…" : "Delete board"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={(slide) => {
            const inBoard = findGalleryImageForLightboxSlide(slide, galleryBoard);
            const inAvail = findGalleryImageForLightboxSlide(slide, galleryAvailable);
            if (inBoard) {
              setLightboxSession(collectLightboxSlidesFromGalleryImages(galleryBoard, inBoard));
            } else if (inAvail) {
              setLightboxSession(collectLightboxSlidesFromGalleryImages(galleryAvailable, inAvail));
            }
          }}
        />
      ) : null}
    </div>
  );
}
