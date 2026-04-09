"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera as CameraIcon } from "lucide-react";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import { FilmStockSummaryRow } from "@/components/film-stock-list-card";
import {
  getDiscoverSearchPayload,
  type DiscoverSearchPayload,
  type SearchCamerasResult,
  type SearchShotsResult,
  type SearchStocksResult,
  type SearchUsersResult,
} from "@/app/actions/search";
import { shareRollPickerSectionLabelClassName } from "@/components/share-roll-picker-primitives";
import { FILM_TYPE_LABELS, type FilmType } from "@/lib/types";

const DEBOUNCE_MS = 220;

export interface SearchPageClientProps {
  carousels: {
    gold200: SearchShotsResult[];
    portra400: SearchShotsResult[];
  };
}

type TypingMixedRow =
  | { key: string; kind: "stock"; name: string; href: string; imageUrl: string | null; brandInitial: string; specLine: string; scanCount: number }
  | { key: string; kind: "camera"; name: string; href: string; specLine: "CAMERA"; scanCount: number }
  | { key: string; kind: "user"; name: string; href: string; initial: string; specLine: "USER" };

function toUpperTypeLabel(type?: string): string {
  if (!type) return "UNKNOWN";
  return (FILM_TYPE_LABELS[type as FilmType] ?? "Unknown").toUpperCase();
}

function stockSpecLine(stock: SearchStocksResult): string {
  return `FILM STOCK | ${toUpperTypeLabel(stock.type)}`;
}

function rowNameMatchRank(name: string, query: string): number {
  const n = name.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 3;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3;
}

function cleanCameraName(camera: SearchCamerasResult): string {
  const raw = camera.name.trim();
  const brand = camera.brandName.trim();
  if (!raw) return brand || "Camera";
  if (!brand) return raw;
  const rawLower = raw.toLowerCase();
  const brandLower = brand.toLowerCase();
  if (rawLower.startsWith(`${brandLower} `)) return raw;
  return `${brand} ${raw}`;
}

function StockSearchRow({ stock }: { stock: SearchStocksResult }) {
  return (
    <Link
      href={`/films/${stock.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={stock.name}
        imageUrl={stock.imageUrl}
        brandInitial={stock.brandName?.charAt(0)}
        specLine={stockSpecLine(stock)}
        showDivider={false}
      />
    </Link>
  );
}

function CameraSearchRow({ camera }: { camera: SearchCamerasResult }) {
  return (
    <Link
      href={`/cameras/${camera.slug}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={cleanCameraName(camera)}
        specLine="CAMERA"
        showDivider={false}
        customThumb={
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <CameraIcon className="h-5 w-5" aria-hidden />
          </div>
        }
      />
    </Link>
  );
}

function UserSearchRow({ user }: { user: SearchUsersResult }) {
  const displayName = user.display_name?.trim() || "Member";
  const initial = displayName.slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/users/${user.id}`}
      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
    >
      <FilmStockSummaryRow
        name={displayName}
        specLine="USER"
        showDivider={false}
        customThumb={
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
            {initial}
          </div>
        }
      />
    </Link>
  );
}

function DiscoverCarousel({
  title,
  shots,
}: {
  title: string;
  shots: SearchShotsResult[];
}) {
  if (shots.length === 0) return null;
  return (
    <section className="pt-4" aria-label={title}>
      <h2 className="mb-3 font-sans text-base font-semibold text-foreground">{title}</h2>
      <div className="-mx-4 overflow-hidden">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-1">
          {shots.map((shot, index) => (
            <article key={shot.id} className="w-[45%] shrink-0">
              <Link href={`/films/${shot.stockSlug}?shot=${shot.id}`} className="block overflow-hidden rounded-md border border-border/50 bg-card">
                <div className="relative h-40 w-full bg-slate-100">
                  {shot.imageUrl ? (
                    <Image
                      src={shot.imageUrl}
                      alt={shot.stockName}
                      fill
                      sizes="45vw"
                      priority={index < 4}
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </Link>
              <Link
                href={`/users/${shot.userId}`}
                className="mt-1.5 block truncate text-xs font-medium leading-tight text-foreground hover:underline"
              >
                {shot.username}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TypingSection<T>({
  title,
  items,
  render,
}: {
  title: string;
  items: T[];
  render: (item: T, idx: number) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="pt-4">
      <p className={shareRollPickerSectionLabelClassName}>{title}</p>
      <div className="mt-2 divide-y divide-border rounded-md bg-card">
        {items.map((item, idx) => render(item, idx))}
      </div>
    </section>
  );
}

export function SearchPageClient({ carousels }: SearchPageClientProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [resultsArmed, setResultsArmed] = useState(false);
  const [payloadState, setPayloadState] = useState<{ query: string; data: DiscoverSearchPayload } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) {
      return;
    }
    let cancelled = false;
    getDiscoverSearchPayload(query).then((data) => {
      if (cancelled) return;
      setPayloadState({ query, data });
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const hasQuery = debouncedQuery.length > 0;
  const activePayload = hasQuery && payloadState?.query === debouncedQuery ? payloadState.data : null;
  const showLoading = hasQuery && payloadState?.query !== debouncedQuery;
  const mode: "default" | "typing" | "results" = !hasQuery
    ? "default"
    : resultsArmed || !searchFocused
      ? "results"
      : "typing";

  const hasAnyResults = useMemo(() => {
    if (!activePayload) return false;
    return (
      activePayload.results.stocks.length > 0 ||
      activePayload.results.cameras.length > 0 ||
      activePayload.results.users.length > 0 ||
      activePayload.results.shots.length > 0
    );
  }, [activePayload]);

  const typingRows = useMemo<TypingMixedRow[]>(() => {
    if (!activePayload || !debouncedQuery.trim()) return [];
    const rows: TypingMixedRow[] = [
      ...(activePayload.typing.stocks ?? []).map((stock) => ({
        key: `stock-${stock.slug}`,
        kind: "stock" as const,
        name: stock.name,
        href: `/films/${stock.slug}`,
        imageUrl: stock.imageUrl ?? null,
        brandInitial: stock.brandName?.charAt(0) ?? "?",
        specLine: stockSpecLine(stock),
        scanCount: stock.scanCount ?? 0,
      })),
      ...(activePayload.typing.cameras ?? []).map((camera) => ({
        key: `camera-${camera.slug}`,
        kind: "camera" as const,
        name: cleanCameraName(camera),
        href: `/cameras/${camera.slug}`,
        specLine: "CAMERA" as const,
        scanCount: camera.scanCount ?? 0,
      })),
      ...(activePayload.typing.users ?? []).map((user) => {
        const name = user.display_name?.trim() || "Member";
        return {
          key: `user-${user.id}`,
          kind: "user" as const,
          name,
          href: `/users/${user.id}`,
          initial: name.slice(0, 2).toUpperCase(),
          specLine: "USER" as const,
        };
      }),
    ];
    const query = debouncedQuery.trim();
    return rows.sort((a, b) => {
      // Intermix stocks and cameras by scan volume.
      const aScan = a.kind === "user" ? -1 : a.scanCount;
      const bScan = b.kind === "user" ? -1 : b.scanCount;
      if (bScan !== aScan) return bScan - aScan;

      const rankDiff = rowNameMatchRank(a.name, query) - rowNameMatchRank(b.name, query);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [activePayload, debouncedQuery]);

  return (
    <div
      className="mobile-safe-bottom-clear-bar mx-auto max-w-7xl bg-white px-4 pb-24 pt-4 sm:px-6 lg:px-8 md:pb-8"
      style={{ ["--mobile-bottom-clearance" as string]: "4.5rem" }}
    >
      <div className="mx-auto max-w-2xl">
        <SearchPageHeaderForm
          value={inputValue}
          onChange={(value) => {
            setInputValue(value);
            setResultsArmed(false);
          }}
          onClear={() => {
            setInputValue("");
            setResultsArmed(false);
          }}
          onFocus={() => setSearchFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setResultsArmed(true);
              setSearchFocused(false);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          placeholder="Search images, film stocks, cameras, lists, users"
          ariaLabel="Search images, film stocks, cameras, lists, users"
          showSearchIcon
        />

        {mode === "default" ? (
          <div className="pt-2">
            <DiscoverCarousel title="Shot on Kodak Gold 200" shots={carousels.gold200} />
            <DiscoverCarousel title="Shot on Portra 400" shots={carousels.portra400} />
          </div>
        ) : mode === "typing" ? (
          <div className="pt-2">
            {showLoading ? <p className="pt-4 text-sm text-muted-foreground">Searching…</p> : null}
            <div className="mt-2 divide-y divide-border rounded-md bg-card">
              {typingRows.map((row) => {
                if (row.kind === "stock") {
                  return (
                    <Link
                      key={row.key}
                      href={row.href}
                      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                    >
                      <FilmStockSummaryRow
                        name={row.name}
                        imageUrl={row.imageUrl}
                        brandInitial={row.brandInitial}
                        specLine={row.specLine}
                        showDivider={false}
                      />
                    </Link>
                  );
                }
                if (row.kind === "camera") {
                  return (
                    <Link
                      key={row.key}
                      href={row.href}
                      className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                    >
                      <FilmStockSummaryRow
                        name={row.name}
                        specLine={row.specLine}
                        showDivider={false}
                        customThumb={
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <CameraIcon className="h-5 w-5" aria-hidden />
                          </div>
                        }
                      />
                    </Link>
                  );
                }
                return (
                  <Link
                    key={row.key}
                    href={row.href}
                    className="flex flex-col bg-white transition-colors hover:bg-muted/30 active:bg-muted/50"
                  >
                    <FilmStockSummaryRow
                      name={row.name}
                      specLine={row.specLine}
                      showDivider={false}
                      customThumb={
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                          {row.initial}
                        </div>
                      }
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-4">
            {showLoading ? <p className="text-sm text-muted-foreground">Loading results…</p> : null}
            {!showLoading && activePayload?.bestResult ? (
              <section className="mb-4 rounded-xl border border-border bg-card p-3">
                <p className={shareRollPickerSectionLabelClassName}>Top Result</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {activePayload.bestResult.type === "stock"
                    ? `${activePayload.bestResult.value.brandName} ${activePayload.bestResult.value.name}`
                    : activePayload.bestResult.type === "camera"
                      ? `${activePayload.bestResult.value.brandName} ${activePayload.bestResult.value.name}`
                      : activePayload.bestResult.type === "user"
                        ? activePayload.bestResult.value.display_name ?? "Member"
                        : activePayload.bestResult.type === "shot"
                          ? activePayload.bestResult.value.stockName
                          : activePayload.bestResult.value.title}
                </p>
              </section>
            ) : null}

            {!showLoading && !hasAnyResults ? (
              <div className="rounded-md border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                No results for &ldquo;{debouncedQuery}&rdquo; yet.
              </div>
            ) : null}

            {activePayload?.results.shots.length ? (
              <section className="pt-2">
                <p className={shareRollPickerSectionLabelClassName}>Images</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {activePayload.results.shots.map((shot) => (
                    <Link key={shot.id} href={`/films/${shot.stockSlug}?shot=${shot.id}`} className="block overflow-hidden rounded-md bg-slate-100">
                      <div className="relative h-24 w-full">
                        {shot.imageUrl ? <Image src={shot.imageUrl} alt={shot.stockName} fill className="object-cover" sizes="33vw" /> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <TypingSection<SearchStocksResult>
              title="Film Stocks"
              items={activePayload?.results.stocks ?? []}
              render={(stock) => (
                <StockSearchRow key={stock.slug} stock={stock} />
              )}
            />
            <TypingSection<SearchCamerasResult>
              title="Cameras"
              items={activePayload?.results.cameras ?? []}
              render={(camera) => (
                <CameraSearchRow key={camera.slug} camera={camera} />
              )}
            />
            <TypingSection<SearchUsersResult>
              title="Users"
              items={activePayload?.results.users ?? []}
              render={(user) => (
                <UserSearchRow key={user.id} user={user} />
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
