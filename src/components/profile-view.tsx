"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Share, Menu, Instagram, MoreVertical, Flag, ChevronLeft } from "lucide-react";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import { toggleFollowUser } from "@/app/actions/user-follows";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilmCard } from "@/components/film-card";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import { ProfileEditSheet } from "@/components/profile-edit-sheet";
import { showToastViaEvent } from "@/components/toast";

/** Match film mobile integrated header row height (`header.tsx` COLLAPSED_NAV_HEIGHT). */
const MEMBER_PROFILE_STICKY_ROW_MIN_H = 52;
import { BoardFormSheet } from "@/components/board-form-sheet";
import { FilmNativeMasonryGrid } from "@/components/film-native-grid";
import { ImageLightbox, type ImageLightboxData } from "@/components/image-lightbox";
import type { FilmStock, FilmBrand } from "@/lib/types";
import type { InCameraEntry } from "@/app/actions/user-actions";
import type { FilmUploadRow } from "@/app/actions/uploads";
import {
  collectLightboxSlidesFromFilmUploads,
  filmStockToLightboxSummary,
  relatedFilmPageLightboxSlides,
} from "@/lib/lightbox-group";
type StockWithBrand = FilmStock & { brand: FilmBrand };

export interface ProfileData {
  /** Unique handle (profiles.display_name). */
  displayName: string;
  /** Optional friendly name (profiles.full_name). */
  fullName: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  followersCount: number;
  followingCount: number;
  shotSlugs: string[];
  favouriteSlugs: string[];
  inCameraEntries?: InCameraEntry[];
  ratings: Record<string, number>;
  reviewCount?: number;
  uploadCount?: number;
  reviews?: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads?: {
    id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    created_at: string;
    upload_batch_id?: string | null;
  }[];
  likedReviews?: {
    review_id: string;
    film_stock_slug: string;
    review_title: string | null;
    rating: number | null;
    review_created_at: string;
    liked_at: string;
  }[];
  savedUploads?: {
    savedUploadId: string;
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    saved_at: string;
    /** Photographer; for navigating to their profile from saved scans. */
    uploaderUserId?: string;
    uploaderDisplayName?: string | null;
  }[];
  boards?: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
    itemCount: number;
    coverUrl: string | null;
    coverUrl2: string | null;
    coverUrl3: string | null;
  }[];
  createdStockLists?: {
    id: string;
    title: string;
    updatedAt: string;
    itemCount: number;
    previewUrls: (string | null)[];
  }[];
  savedStockLists?: {
    listId: string;
    title: string;
    updatedAt: string;
    savedAt: string;
    ownerUserId: string;
    ownerDisplayName: string;
    ownerAvatarUrl: string | null;
    itemCount: number;
    previewUrls: (string | null)[];
  }[];
  likedUploads?: {
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    liked_at: string;
  }[];
}

function profileInitials(primary: string): string {
  const t = primary.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return t.slice(0, 2).toUpperCase();
}

async function shareProfileUrl(userId: string): Promise<void> {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/users/${userId}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Profile", url });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToastViaEvent("Profile link copied.");
  } catch {
    showToastViaEvent("Could not copy link.");
  }
}

export type ProfileViewMode = "self" | "member";

export interface ProfileMemberActions {
  viewerIsAuthenticated: boolean;
  initialFollowing: boolean;
  /** Path after sign-in, e.g. `/users/{uuid}` */
  signInNextPath: string;
}

interface ProfileViewProps {
  profile: ProfileData;
  stocksBySlug: Map<string, StockWithBrand>;
  statsBySlug?: Record<string, { avgRating: number | null }>;
  userId: string;
  onProfileUpdated?: () => void | Promise<void>;
  /** `member` = viewing someone else’s profile (follow + report; no account sheet). */
  mode?: ProfileViewMode;
  memberActions?: ProfileMemberActions;
}

function StockGrid({ slugs, stocksBySlug }: { slugs: string[]; stocksBySlug: Map<string, StockWithBrand> }) {
  if (slugs.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {slugs.map((slug) => {
        const stock = stocksBySlug.get(slug);
        if (!stock) return null;
        return <FilmCard key={slug} stock={stock} />;
      })}
    </div>
  );
}

type CreatedListRow = NonNullable<ProfileData["createdStockLists"]>[number];
type SavedListRow = NonNullable<ProfileData["savedStockLists"]>[number];

const LIST_PREVIEW_SLOT_COUNT = 5;

/** One preview cell per stock in the list (max 5); missing URLs render as placeholders. */
function listPreviewSlots(urls: (string | null | undefined)[], itemCount: number): (string | null)[] {
  const n = Math.min(Math.max(itemCount, 0), LIST_PREVIEW_SLOT_COUNT);
  const out: (string | null)[] = [];
  for (let i = 0; i < n; i++) {
    const u = urls[i]?.trim();
    out.push(u ? u : null);
  }
  return out;
}

/** Overlap as % of preview row width; frame widths derived so the stack spans full width. */
const LIST_PREVIEW_OVERLAP_PCT = 22;

function listPreviewStackMetrics(numCards: number): { widthPct: number; overlapPct: number } | null {
  if (numCards <= 1) return null;
  const overlapPct = LIST_PREVIEW_OVERLAP_PCT;
  const widthPct = (100 + (numCards - 1) * overlapPct) / numCards;
  return { widthPct, overlapPct };
}

function ListPreviewStack({
  slots,
  itemCount,
}: {
  slots: (string | null | undefined)[];
  itemCount: number;
}) {
  const cells = listPreviewSlots(slots, itemCount);
  const n = cells.length;
  const metrics = listPreviewStackMetrics(n);

  return (
    <div
      className="flex h-full w-full items-center justify-start overflow-hidden py-2 sm:py-3"
      aria-hidden
    >
      <div
        className={cn(
          "flex min-h-[100px] w-full min-w-0 items-center sm:min-h-[120px]",
          n === 1 && "justify-center px-2 sm:px-3"
        )}
      >
        {cells.map((url, i) => (
          <div
            key={i}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-md bg-muted/40",
              n === 1
                ? "aspect-[2/3] h-full max-h-[min(100%,220px)] w-auto max-w-[min(100%,280px)]"
                : "aspect-[2/3]"
            )}
            style={
              n > 1 && metrics
                ? {
                    width: `${metrics.widthPct}%`,
                    marginLeft: i === 0 ? 0 : `-${metrics.overlapPct}%`,
                    zIndex: n - i,
                  }
                : undefined
            }
          >
            {url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted/60 dark:bg-muted/30" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileListTile({
  href,
  title,
  itemCount,
  previewUrls,
  avatarUrl,
  authorLabel,
}: {
  href: string;
  title: string;
  itemCount: number;
  previewUrls: (string | null)[];
  avatarUrl: string | null;
  authorLabel: string;
}) {
  const authorInitials = profileInitials(authorLabel);
  return (
    <Link
      href={href}
      className={cn(
        "block w-full min-w-0 overflow-hidden text-left",
        "rounded-lg py-2 ring-offset-background",
        "transition-opacity hover:opacity-[0.92] active:opacity-[0.88]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      aria-label={`${title}, ${itemCount} ${itemCount === 1 ? "stock" : "stocks"}`}
    >
      <div className="aspect-[3/2] w-full overflow-hidden">
        <ListPreviewStack slots={previewUrls} itemCount={itemCount} />
      </div>
      <div className="mt-3 flex items-start gap-3 sm:mt-3.5">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted sm:size-10">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-sans text-xs font-semibold text-muted-foreground">
              {authorInitials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="m-0 font-sans text-base font-bold leading-snug tracking-tight text-foreground [overflow-wrap:anywhere]">
            {title}
          </h4>
          <p className="mt-0.5 font-sans text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {authorLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ProfileListsContent({
  created,
  saved,
  viewerHeadline,
  viewerAvatarUrl,
  listsVariant = "self",
}: {
  created: CreatedListRow[];
  saved: SavedListRow[];
  viewerHeadline: string;
  viewerAvatarUrl: string | null | undefined;
  listsVariant?: "self" | "member";
}) {
  const [listsSubTab, setListsSubTab] = useState<"created" | "saved">("created");

  const createdTiles = created.map((l) => (
    <ProfileListTile
      key={l.id}
      href={`/lists/${l.id}`}
      title={l.title}
      itemCount={l.itemCount}
      previewUrls={l.previewUrls}
      avatarUrl={viewerAvatarUrl ?? null}
      authorLabel={viewerHeadline}
    />
  ));

  const savedTiles = saved.map((l) => (
    <ProfileListTile
      key={l.listId}
      href={`/lists/${l.listId}`}
      title={l.title}
      itemCount={l.itemCount}
      previewUrls={l.previewUrls}
      avatarUrl={l.ownerAvatarUrl}
      authorLabel={l.ownerDisplayName}
    />
  ));

  const showSavedSubTab = listsVariant === "self";

  return (
    <div className="min-w-0 w-full px-4 sm:px-0">
      {showSavedSubTab ? (
        <nav
          className="mb-4 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain pt-2 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Lists view"
        >
          {(
            [
              { id: "created" as const, label: "Created" },
              { id: "saved" as const, label: "Saved" },
            ] as const
          ).map((t) => {
            const active = listsSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setListsSubTab(t.id)}
                className={cn(
                  "flex h-9 shrink-0 items-center rounded-[14px] border px-2.5 py-0.5 font-sans !text-[12px] !leading-[14px] font-medium transition-colors whitespace-nowrap",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent/50"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      ) : null}

      {listsSubTab === "created" || !showSavedSubTab ? (
        <div>
          {created.length === 0 ? (
            <p className="mb-4 rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              {listsVariant === "member"
                ? "No public lists yet."
                : "You haven&apos;t created any lists yet. Lists help you group stocks — like &quot;Best winter stocks&quot;."}
            </p>
          ) : null}
          <div className="min-w-0 w-full max-w-full sm:-mx-6 sm:w-[calc(100%+3rem)] sm:max-w-none">
            <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3 md:gap-4">
              {createdTiles}
              {listsVariant === "self" ? (
                <div className="px-4 sm:px-6">
                  <Link
                    href="/lists/new"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-3 text-sm font-medium text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-muted/50 hover:text-primary dark:border-border dark:shadow-none"
                  >
                    Create a list
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : saved.length === 0 ? (
        <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No saved lists yet. Open someone else&apos;s list and tap the bookmark to save it here.
        </p>
      ) : (
        <div className="min-w-0 w-full max-w-full sm:-mx-6 sm:w-[calc(100%+3rem)] sm:max-w-none">
          <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3 md:gap-4">{savedTiles}</div>
        </div>
      )}
    </div>
  );
}

function ProfileFilmSubTabs({
  favouriteSlugs,
  shotSlugs,
  stocksBySlug,
  filmVariant = "self",
}: {
  favouriteSlugs: string[];
  shotSlugs: string[];
  stocksBySlug: Map<string, StockWithBrand>;
  filmVariant?: "self" | "member";
}) {
  const [filmSubTab, setFilmSubTab] = useState<"shootlist" | "shot">("shootlist");

  return (
    <div className="min-w-0 w-full px-4 sm:px-0">
      <nav
        className="mb-4 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain pt-2 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Film view"
      >
        {(
          [
            { id: "shootlist" as const, label: "Shootlist" },
            { id: "shot" as const, label: "Shot" },
          ] as const
        ).map((t) => {
          const active = filmSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilmSubTab(t.id)}
              className={cn(
                "flex h-9 shrink-0 items-center rounded-[14px] border px-2.5 py-0.5 font-sans !text-[12px] !leading-[14px] font-medium transition-colors whitespace-nowrap",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent/50"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
      {filmSubTab === "shootlist" ? (
        <ProfileSection
          emptyMessage={
            filmVariant === "member"
              ? "Shootlist isn’t visible on other profiles."
              : "Nothing on your Shootlist yet. Tap the bookmark on any film page."
          }
          isEmpty={favouriteSlugs.length === 0}
        >
          <StockGrid slugs={favouriteSlugs} stocksBySlug={stocksBySlug} />
        </ProfileSection>
      ) : (
        <ProfileSection
          emptyMessage={
            filmVariant === "member"
              ? "Shot list isn’t visible on other profiles."
              : "No stocks marked as shot yet."
          }
          isEmpty={shotSlugs.length === 0}
        >
          <StockGrid slugs={shotSlugs} stocksBySlug={stocksBySlug} />
        </ProfileSection>
      )}
    </div>
  );
}

type SavedUploadRow = NonNullable<ProfileData["savedUploads"]>[number];

type BoardSummary = NonNullable<ProfileData["boards"]>[number];

/** Profile board tile: ~2/3 + ~1/3×2 collage when ≥3 items (white gutters like masonry). */
function BoardPreviewCollage({
  itemCount,
  coverUrl,
  coverUrl2,
  coverUrl3,
}: {
  itemCount: number;
  coverUrl: string | null;
  coverUrl2: string | null;
  coverUrl3: string | null;
}) {
  if (!coverUrl) {
    return <div className="absolute inset-0 bg-muted" aria-hidden />;
  }

  if (itemCount < 3) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt=""
        className="absolute inset-0 m-auto h-full w-full max-h-full max-w-full object-contain"
      />
    );
  }

  const left = coverUrl;
  const topRight = coverUrl2 ?? coverUrl;
  const bottomRight = coverUrl3 ?? coverUrl2 ?? coverUrl;

  return (
    <div className="absolute inset-0 flex gap-px bg-white" aria-hidden>
      <div className="relative min-h-0 min-w-0 flex-[2] overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={left} alt="" className="h-full w-full object-cover" sizes="66vw" />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-px bg-white">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={topRight} alt="" className="h-full w-full object-cover" sizes="33vw" />
        </div>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bottomRight} alt="" className="h-full w-full object-cover" sizes="33vw" />
        </div>
      </div>
    </div>
  );
}

function ProfileBoardsContent({
  savedUploads,
  boards,
  onBoardsChanged,
  boardsVariant = "self",
}: {
  savedUploads: SavedUploadRow[];
  boards: BoardSummary[];
  onBoardsChanged?: () => void | Promise<void>;
  boardsVariant?: "self" | "member";
}) {
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  if (boardsVariant === "member") {
    return (
      <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Boards are private to each member.
      </p>
    );
  }

  const count = savedUploads.length;
  const coverUrl = savedUploads.find((u) => u.image_url)?.image_url ?? null;

  const overlayCopy = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-8">
      <div className="flex min-w-0 items-end justify-between gap-3">
        <h4 className="m-0 min-w-0 font-sans text-sm font-semibold tracking-tight text-white [overflow-wrap:anywhere]">
          All saved scans
        </h4>
        <span className="inline-flex h-7 shrink-0 items-center justify-center rounded-full bg-black/50 px-2 text-xs font-semibold tabular-nums text-white backdrop-blur-[2px]">
          {count}
        </span>
      </div>
    </div>
  );

  const allSavedTile =
    count > 0 ? (
      <Link
        href="/profile/boards/all"
        className={cn(
          "relative block aspect-[3/2] min-h-0 min-w-0 w-full overflow-hidden rounded-none bg-muted text-left",
          "ring-offset-background transition-opacity hover:opacity-[0.98] active:opacity-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label={`All saved scans, ${count} ${count === 1 ? "item" : "items"}`}
      >
        {coverUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 m-auto h-full w-full max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" aria-hidden />
        )}
        {overlayCopy}
      </Link>
    ) : (
      <div
        className="relative aspect-[3/2] min-h-0 min-w-0 w-full overflow-hidden rounded-none bg-muted"
        aria-label="All saved scans, empty"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-8">
          <div className="flex min-w-0 items-end justify-between gap-3">
            <h4 className="m-0 min-w-0 font-sans text-sm font-semibold tracking-tight text-white/90 [overflow-wrap:anywhere]">
              All saved scans
            </h4>
            <span className="inline-flex h-7 shrink-0 items-center justify-center rounded-full bg-black/40 px-2 text-xs font-semibold tabular-nums text-white">
              0
            </span>
          </div>
        </div>
      </div>
    );

  const boardTiles = boards.map((b) => {
    const overlay = (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-8">
        <div className="flex min-w-0 items-end justify-between gap-3">
          <h4 className="m-0 min-w-0 font-sans text-sm font-semibold tracking-tight text-white [overflow-wrap:anywhere]">
            {b.name}
          </h4>
          <span className="inline-flex h-7 shrink-0 items-center justify-center rounded-full bg-black/50 px-2 text-xs font-semibold tabular-nums text-white backdrop-blur-[2px]">
            {b.itemCount}
          </span>
        </div>
      </div>
    );
    return (
      <Link
        key={b.id}
        href={`/profile/boards/${b.id}`}
        className={cn(
          "relative block aspect-[3/2] min-h-0 min-w-0 w-full overflow-hidden rounded-none bg-muted text-left",
          "ring-offset-background transition-opacity hover:opacity-[0.98] active:opacity-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label={`${b.name}, ${b.itemCount} ${b.itemCount === 1 ? "scan" : "scans"}`}
      >
        <BoardPreviewCollage
          itemCount={b.itemCount}
          coverUrl={b.coverUrl}
          coverUrl2={b.coverUrl2 ?? null}
          coverUrl3={b.coverUrl3 ?? null}
        />
        {overlay}
      </Link>
    );
  });

  return (
    <div>
      <BoardFormSheet
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        mode="create"
        onSuccess={() => void onBoardsChanged?.()}
      />
      {/* Same full-bleed pattern as ProfileScansMasonry / Discover masonry (no mobile negative margins — avoids overflow-x clip). */}
      <div className="min-w-0 w-full max-w-full sm:-mx-6 sm:w-[calc(100%+3rem)] sm:max-w-none">
        <div className="flex w-full min-w-0 flex-col gap-2 sm:gap-3 md:gap-4">
          <div className="min-h-0 min-w-0 w-full">{allSavedTile}</div>
          {boardTiles}
          <div className="px-4 sm:px-6">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-3 text-sm font-medium text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-muted/50 hover:text-primary dark:border-border dark:shadow-none"
              onClick={() => setCreateBoardOpen(true)}
            >
              Create board
            </button>
          </div>
        </div>
      </div>

      {count === 0 ? (
        <p className="mt-6 px-4 text-center text-sm text-muted-foreground sm:px-0">
          You haven&apos;t saved any community images to your boards yet. Open Discover or Community, open an image,
          and tap Save.
        </p>
      ) : null}
    </div>
  );
}

type ProfileUpload = NonNullable<ProfileData["uploads"]>[number];

function profileUploadToFilmRow(u: ProfileUpload, displayName: string, profileUserId: string): FilmUploadRow {
  return {
    id: u.id,
    user_id: profileUserId,
    film_stock_slug: u.film_stock_slug,
    image_url: u.image_url,
    caption: u.caption,
    created_at: u.created_at,
    display_name: displayName,
    upload_batch_id: u.upload_batch_id ?? null,
  };
}

function ProfileScansMasonry({
  uploads,
  displayName,
  profileUserId,
  stocksBySlug,
  scansAriaLabel = "Your scans",
}: {
  uploads: NonNullable<ProfileData["uploads"]>;
  displayName: string;
  /** Profile owner; used for lightbox → profile links. */
  profileUserId: string;
  stocksBySlug: Map<string, StockWithBrand>;
  scansAriaLabel?: string;
}) {
  const [lightboxSession, setLightboxSession] = useState<{
    slides: ImageLightboxData[];
    initialIndex: number;
  } | null>(null);

  const filmRows = useMemo(
    () =>
      uploads.filter((u) => u.image_url).map((u) => profileUploadToFilmRow(u, displayName, profileUserId)),
    [uploads, displayName, profileUserId]
  );

  const masonryItems = useMemo(
    () =>
      uploads
        .filter((u) => u.image_url)
        .map((u) => ({
          id: u.id,
          imageUrl: u.image_url,
          overlayLabel: "",
          href: `/films/${u.film_stock_slug}`,
          showOverlay: false as const,
          onActivate: () => {
            const row = profileUploadToFilmRow(u, displayName, profileUserId);
            const stock = stocksBySlug.get(u.film_stock_slug);
            const stockName = stock?.name ?? u.film_stock_slug;
            const summary = stock ? filmStockToLightboxSummary(stock) : null;
            setLightboxSession(
              collectLightboxSlidesFromFilmUploads(
                filmRows,
                row,
                stockName,
                u.film_stock_slug,
                summary
              )
            );
          },
        })),
    [uploads, displayName, profileUserId, stocksBySlug, filmRows]
  );

  const relatedStockSlides = useMemo(() => {
    if (!lightboxSession || lightboxSession.slides.length !== 1) return [];
    const current = lightboxSession.slides[0];
    const href = current.context?.href;
    if (!href?.startsWith("/films/")) return [];
    const slug = href.slice("/films/".length).split(/[/?#]/)[0];
    if (!slug) return [];
    const stock = stocksBySlug.get(slug);
    const stockName = stock?.name ?? slug;
    const summary = stock ? filmStockToLightboxSummary(stock) : null;
    const sameStockRows = filmRows.filter((r) => r.film_stock_slug === slug);
    return relatedFilmPageLightboxSlides(current, sameStockRows, [], stockName, slug, summary);
  }, [lightboxSession, filmRows, stocksBySlug]);

  return (
    <>
      <div className="min-w-0 w-full max-w-full sm:-mx-6 sm:w-[calc(100%+3rem)] sm:max-w-none">
        <FilmNativeMasonryGrid items={masonryItems} ariaLabel={scansAriaLabel} />
      </div>
      {lightboxSession ? (
        <ImageLightbox
          slides={lightboxSession.slides}
          initialIndex={lightboxSession.initialIndex}
          onClose={() => setLightboxSession(null)}
          relatedStockSlides={relatedStockSlides}
          onPickRelatedStock={(slide) => {
            const id = slide.uploadId?.trim();
            const u = id ? uploads.find((x) => x.id === id) : undefined;
            if (!u?.image_url) return;
            const row = profileUploadToFilmRow(u, displayName, profileUserId);
            const stock = stocksBySlug.get(u.film_stock_slug);
            const stockName = stock?.name ?? u.film_stock_slug;
            const summary = stock ? filmStockToLightboxSummary(stock) : null;
            setLightboxSession(
              collectLightboxSlidesFromFilmUploads(
                filmRows,
                row,
                stockName,
                u.film_stock_slug,
                summary
              )
            );
          }}
        />
      ) : null}
    </>
  );
}

function MemberProfileOverflowMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <div className="relative shrink-0" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Profile actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <MoreVertical className="h-6 w-6" strokeWidth={2} />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[11rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
            >
              <Flag className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Report profile
            </button>
          </div>
        ) : null}
      </div>
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Report profile</SheetTitle>
            <SheetDescription>
              Thanks for helping keep the community safe. In-app reporting is not fully wired yet; use the contact path
              in our Terms if you need to reach us about abuse.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link
              href="/terms"
              className="flex h-11 w-full items-center justify-center rounded-full border border-border/70 bg-background text-sm font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-muted/50 dark:border-border dark:shadow-none"
            >
              View Terms
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Compact secondary follow control for member profile sticky header (next to overflow menu). */
function ProfileMemberFollowCompact({
  profileUserId,
  memberActions,
  onFollowersDelta,
}: {
  profileUserId: string;
  memberActions: ProfileMemberActions;
  onFollowersDelta: (delta: number) => void;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(memberActions.initialFollowing);
  const [pending, setPending] = useState(false);

  const signInHref = `/auth/sign-in?next=${encodeURIComponent(memberActions.signInNextPath)}`;

  const compactSecondaryClass =
    "inline-flex h-8 min-w-[4.5rem] shrink-0 items-center justify-center rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50 dark:border-input sm:h-9 sm:text-sm";

  if (!memberActions.viewerIsAuthenticated) {
    return (
      <Link href={signInHref} className={compactSecondaryClass}>
        Follow
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        void (async () => {
          setPending(true);
          const res = await toggleFollowUser(profileUserId);
          setPending(false);
          if (!res.ok) {
            if (res.error === "sign_in_required") router.push(signInHref);
            else showToastViaEvent("Could not update follow. Try again.");
            return;
          }
          setFollowing(res.following);
          onFollowersDelta(res.following ? 1 : -1);
        })();
      }}
      className={cn(
        compactSecondaryClass,
        following && "border-border/80 bg-muted/30 hover:bg-muted/50 dark:bg-muted/20"
      )}
    >
      {pending ? "…" : following ? "Following" : "Follow"}
    </button>
  );
}

export function ProfileView({
  profile,
  stocksBySlug,
  userId,
  onProfileUpdated,
  mode = "self",
  memberActions,
}: ProfileViewProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [followerDelta, setFollowerDelta] = useState(0);
  const handleLabel = profile.displayName;
  const hasFriendlyName = Boolean(profile.fullName?.trim());
  const headline = hasFriendlyName ? profile.fullName!.trim() : profile.displayName;
  const isMember = mode === "member";
  const followersDisplayed = isMember ? profile.followersCount + followerDelta : profile.followersCount;
  const scansDisplayed = profile.uploadCount ?? profile.uploads?.length ?? 0;

  const memberHeadlineRef = useRef<HTMLHeadingElement>(null);
  const [memberTitleScrolledPast, setMemberTitleScrolledPast] = useState(false);

  useEffect(() => {
    if (!isMember) {
      setMemberTitleScrolledPast(false);
      return;
    }
    const el = memberHeadlineRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMemberTitleScrolledPast(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMember, headline]);

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col gap-6 bg-white dark:bg-background md:min-h-0 md:flex-none md:gap-8",
        /* `overflow-x-hidden` on an ancestor (e.g. `main`) breaks `position: sticky`; member chrome uses `fixed` instead. */
        !isMember && "overflow-x-hidden overflow-y-visible md:overflow-visible"
      )}
    >
      {isMember ? (
        <>
          {/* Fixed: mobile `main` uses overflow-x-hidden, which prevents sticky from sticking to the viewport. */}
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-30 w-full bg-white/90 backdrop-blur-md dark:bg-background/90",
              memberTitleScrolledPast && "border-b border-border/50"
            )}
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <div
                className="relative flex w-full min-w-0 max-w-full items-center justify-between gap-2 py-0"
                style={{ minHeight: MEMBER_PROFILE_STICKY_ROW_MIN_H }}
              >
                <div className="relative z-10 flex min-w-0 flex-1 items-center gap-1 pr-2">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className={cn("shrink-0", topLeftNavIconButtonClassName)}
                    aria-label="Go back"
                  >
                    <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
                  </button>
                  {memberTitleScrolledPast ? (
                    <span
                      className="min-w-0 flex-1 truncate text-left font-sans text-base font-semibold tracking-tight text-foreground transition-opacity duration-200"
                      title={headline.length > 32 ? headline : undefined}
                    >
                      {headline}
                    </span>
                  ) : null}
                </div>
                <div className="relative z-10 flex shrink-0 items-center gap-1">
                  {memberActions ? (
                    <ProfileMemberFollowCompact
                      profileUserId={userId}
                      memberActions={memberActions}
                      onFollowersDelta={(d) => setFollowerDelta((x) => x + d)}
                    />
                  ) : null}
                  <MemberProfileOverflowMenu />
                </div>
              </div>
            </div>
          </div>
          <div
            className="shrink-0"
            style={{
              height: `calc(${MEMBER_PROFILE_STICKY_ROW_MIN_H}px + env(safe-area-inset-top, 0px))`,
            }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="sticky top-0 z-30 w-full min-w-0 bg-white/90 backdrop-blur-md dark:bg-background/90"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto flex min-h-0 min-w-0 max-w-full items-center justify-between gap-2 px-4 py-0 sm:px-0">
            <button
              type="button"
              onClick={() => shareProfileUrl(userId)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Share profile"
            >
              <Share className="h-6 w-6" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Account menu"
            >
              <Menu className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 px-4 sm:px-0">
        <div className="flex items-start gap-4">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={60}
              height={60}
              className="size-[60px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary"
              aria-hidden
            >
              {profileInitials(headline)}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              ref={memberHeadlineRef}
              className="font-sans text-xl font-bold leading-tight tracking-tight text-foreground"
            >
              {headline}
            </h2>
            {hasFriendlyName ? (
              <p className="mt-0 text-sm font-medium leading-tight text-muted-foreground">{handleLabel}</p>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">{scansDisplayed}</span>{" "}
          {scansDisplayed === 1 ? "scan" : "scans"}
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{followersDisplayed}</span> followers
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{profile.followingCount}</span> following
        </p>
        {profile.bio?.trim() ? (
          <p className="max-w-prose text-sm leading-relaxed text-foreground">{profile.bio.trim()}</p>
        ) : null}
        {(profile.instagramUrl || profile.websiteUrl) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {profile.instagramUrl ? (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                <Instagram className="h-4 w-4 shrink-0" aria-hidden />
                Instagram
              </a>
            ) : null}
            {profile.websiteUrl ? (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Website
              </a>
            ) : null}
          </div>
        )}
      </div>

      {!isMember ? (
        <ProfileEditSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          handle={handleLabel}
          fullName={profile.fullName ?? ""}
          bio={profile.bio ?? ""}
          avatarUrl={profile.avatarUrl ?? null}
          instagramUrl={profile.instagramUrl ?? null}
          websiteUrl={profile.websiteUrl ?? null}
          onSaved={() => void onProfileUpdated?.()}
        />
      ) : null}

      {/* Tabs */}
      <FilmDetailTabs
        defaultId="scans"
        fullWidthTabBar
        pinTabPanelOnMobile
        pinTabBarClassName="px-4 sm:px-0"
        tabs={[
          {
            id: "scans",
            label: "Scans",
            content: (
              <ProfileSection
                className="px-0"
                emptyMessage={
                  isMember ? "No community scans yet." : "You haven't uploaded any images yet."
                }
                isEmpty={!profile.uploads?.length || !profile.uploads.some((u) => u.image_url)}
              >
                <ProfileScansMasonry
                  uploads={profile.uploads ?? []}
                  displayName={profile.displayName}
                  profileUserId={userId}
                  stocksBySlug={stocksBySlug}
                  scansAriaLabel={isMember ? `${headline} scans` : "Your scans"}
                />
              </ProfileSection>
            ),
          },
          {
            id: "boards",
            label: "Boards",
            content: (
              <ProfileSection className="px-0" emptyMessage="" isEmpty={false}>
                <ProfileBoardsContent
                  savedUploads={profile.savedUploads ?? []}
                  boards={profile.boards ?? []}
                  onBoardsChanged={onProfileUpdated}
                  boardsVariant={isMember ? "member" : "self"}
                />
              </ProfileSection>
            ),
          },
          {
            id: "lists",
            label: "Lists",
            content: (
              <ProfileSection className="px-0" emptyMessage="" isEmpty={false}>
                <ProfileListsContent
                  created={profile.createdStockLists ?? []}
                  saved={profile.savedStockLists ?? []}
                  viewerHeadline={headline}
                  viewerAvatarUrl={profile.avatarUrl}
                  listsVariant={isMember ? "member" : "self"}
                />
              </ProfileSection>
            ),
          },
          {
            id: "film",
            label: "Film",
            content: (
              <ProfileFilmSubTabs
                favouriteSlugs={profile.favouriteSlugs}
                shotSlugs={profile.shotSlugs}
                stocksBySlug={stocksBySlug}
                filmVariant={isMember ? "member" : "self"}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function ProfileSection({
  title,
  description,
  emptyMessage,
  isEmpty,
  children,
  className,
}: {
  title?: string;
  description?: string;
  emptyMessage: string;
  isEmpty?: boolean;
  children: React.ReactNode;
  /** Horizontal inset on small screens when the page shell is full-bleed (e.g. profile). */
  className?: string;
}) {
  const showHeader = title != null && title !== "" || description != null && description !== "";
  return (
    <div className={cn("px-4 sm:px-0", className)}>
      {showHeader && (
        <>
          {title != null && title !== "" && (
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          )}
          {description != null && description !== "" && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </>
      )}
      <div className={showHeader ? "mt-6" : ""}>
        {isEmpty ? (
          <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
