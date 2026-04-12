"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AddReviewModal } from "@/components/add-review-modal";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { useUserActions } from "@/context/user-actions-context";
import { getSuggestedStocks, type SearchStocksResult } from "@/app/actions/search";
import type { AddReviewModalPayload } from "@/components/add-review-modal";
import { FilmStockListCardButton } from "@/components/film-stock-list-card";
import { MobileStockPickerPanel } from "@/components/mobile-stock-picker-panel";
import { interpretReviewsPostResult } from "@/lib/review-submit-feedback";
import { recordRollFilmStockRecent } from "@/lib/roll-film-stock-recents";
import { postReviewModalSubmission } from "@/lib/user-reviews-client-submit";
import { cn } from "@/lib/utils";

const EVENT_OPEN = "plus-action-sheet:open";

export interface OpenPayload {
  filmSlug?: string;
}

export function openPlusActionSheet(payload?: OpenPayload) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_OPEN, { detail: payload }));
  }
}

export function PlusActionSheet() {
  const [open, setOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggested, setSuggested] = useState<{ stocks: SearchStocksResult[]; allStocks: SearchStocksResult[] } | null>(null);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SearchStocksResult | null>(null);
  const [shareRollSubmitHint, setShareRollSubmitHint] = useState<string | null>(null);
  const { user } = useAuth();
  const { setRating: persistRating } = useUserActions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenPayload | undefined>).detail;
      setSearchQuery("");

      if (detail?.filmSlug) {
        setOpen(false);
        router.push(`/films/${detail.filmSlug}?action=upload`);
        return;
      }

      if (!user) {
        router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
        return;
      }

      setOpen(true);
    };
    window.addEventListener(EVENT_OPEN, handleOpen);
    return () => window.removeEventListener(EVENT_OPEN, handleOpen);
  }, [user, router, pathname]);

  const loadSuggestedStocks = useCallback(async () => {
    if (suggested || stocksLoading) return;
    setStocksLoading(true);
    try {
      const next = await getSuggestedStocks();
      setSuggested(next);
    } finally {
      setStocksLoading(false);
    }
  }, [stocksLoading, suggested]);

  useEffect(() => {
    if (!open) return;
    void loadSuggestedStocks();
  }, [open, loadSuggestedStocks]);

  const filteredStocks = suggested?.allStocks
    ? searchQuery.trim()
      ? suggested.allStocks.filter(
          (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.brandName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : suggested.stocks
    : [];

  const openModalForStock = useCallback(
    (stock: SearchStocksResult) => {
      if (!user) {
        router.push(`/auth/sign-in?next=${encodeURIComponent(pathname ?? "/")}`);
        return;
      }
      setSelectedStock(stock);
      setOpen(false);
      setTimeout(() => {
        setReviewModalOpen(true);
      }, 200);
    },
    [user, router, pathname]
  );

  const handleSelectStock = (stock: SearchStocksResult) => {
    openModalForStock(stock);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={cn(
            "mobile-safe-bottom-content gap-0 bg-white px-0",
            "inset-0 h-[100dvh] max-h-none rounded-none border-0 pb-0 data-[side=bottom]:top-0 data-[side=bottom]:h-[100dvh] data-[side=bottom]:max-h-none data-[side=bottom]:rounded-none data-[side=bottom]:border-0 md:inset-x-0 md:bottom-0 md:top-auto md:h-[78dvh] md:max-h-[78dvh] md:rounded-t-[20px] md:border-t md:pb-8 md:data-[side=bottom]:top-auto md:data-[side=bottom]:h-[78dvh] md:data-[side=bottom]:max-h-[78dvh] md:data-[side=bottom]:rounded-t-[20px] md:data-[side=bottom]:border-t"
          )}
        >
          <SheetHeader className="hidden pb-4 md:flex">
            <SheetTitle>What did you shoot?</SheetTitle>
          </SheetHeader>
          <SheetTitle className="sr-only">Add a roll</SheetTitle>

          <MobileStockPickerPanel
            mode="upload"
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onClose={() => {
              setSearchQuery("");
              setOpen(false);
            }}
            onSelectStock={handleSelectStock}
            stocks={suggested?.allStocks ?? []}
            isLoading={stocksLoading || suggested == null}
            userId={user?.id ?? null}
          />

          <div className="hidden min-h-0 flex-1 flex-col px-4 md:flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search film stocks..."
              autoFocus
              className="w-full rounded-[7px] border border-border/50 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <ul className="no-scrollbar mt-3 h-[528px] min-h-[528px] overflow-x-hidden overflow-y-auto rounded-[7px] bg-card">
              {filteredStocks.map((stock) => (
                <li key={stock.slug}>
                  <FilmStockListCardButton stock={stock} onSelect={() => handleSelectStock(stock)} />
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      {selectedStock && (
        <AddReviewModal
          open={reviewModalOpen}
          onOpenChange={(o) => {
            setReviewModalOpen(o);
            if (!o) {
              setSelectedStock(null);
              setShareRollSubmitHint(null);
            }
          }}
          onBackToStockPicker={() => {
            setReviewModalOpen(false);
            setSelectedStock(null);
            setSearchQuery("");
            setOpen(false);
          }}
          mode="upload"
          slotsUsed={1}
          initialRating={0}
          stock={{
            slug: selectedStock.slug,
            name: selectedStock.name,
            brand: { name: selectedStock.brandName, slug: "" },
            format: selectedStock.format ?? [],
            image_url: selectedStock.imageUrl ?? null,
            iso: selectedStock.iso ?? undefined,
          }}
          shareRollSubmitHint={shareRollSubmitHint}
          onSubmit={async (payload: AddReviewModalPayload) => {
            if (!user) {
              if (payload.rating > 0) persistRating(selectedStock.slug, payload.rating);
              const hasRollPhotos = (payload.clientStoredScanImages?.length ?? 0) > 0;
              showToastViaEvent(
                hasRollPhotos ? "Log in to save your images and review." : "Log in to save your review."
              );
              return undefined;
            }
            const attemptedPhotos = payload.clientStoredScanImages?.length ?? 0;
            const outcome = await postReviewModalSubmission({
              filmStockSlug: selectedStock.slug,
              mode: "upload",
              payload,
              onProgress:
                attemptedPhotos > 0 ? (label) => setShareRollSubmitHint(label) : undefined,
            });
            if (!outcome.ok) {
              showToastViaEvent(outcome.toast);
              return { success: false };
            }
            const data = outcome.data;
            const interpreted = interpretReviewsPostResult(data, {
              mode: "upload",
              fileCount: attemptedPhotos,
              attemptedUploads: attemptedPhotos,
            });
            if (!interpreted.ok) {
              showToastViaEvent(interpreted.message);
              return { success: false };
            }
            if (attemptedPhotos > 0) {
              recordRollFilmStockRecent(user.id, selectedStock.slug);
            }
            const uploadSucceeded = interpreted.uploaded > 0;
            if (attemptedPhotos > 0 && uploadSucceeded) {
              window.dispatchEvent(
                new CustomEvent("film-upload-complete", { detail: { slug: selectedStock.slug } })
              );
            }
            if (interpreted.reviewSaved) {
              window.dispatchEvent(
                new CustomEvent("review-submitted", { detail: { slug: selectedStock.slug } })
              );
            }
            const uploadedCount = interpreted.uploaded;
            if (interpreted.uploadFailed && interpreted.uploadFailed > 0) {
              showToastViaEvent(
                `${uploadedCount} image(s) saved; ${interpreted.uploadFailed} could not be saved to your gallery. Try again from your profile if needed.`
              );
            } else {
              showToastViaEvent("Roll shared!");
            }
            if (attemptedPhotos > 0) {
              router.push("/");
              router.refresh();
            }
            return { success: true };
          }}
        />
      )}
    </>
  );
}
