"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  FILM_SCANNER_CAMERA_SCANNING_DISPLAY,
  FILM_SCANNER_CAMERA_SCANNING_ROW_LABEL,
  FILM_SCANNER_CAMERA_SEARCH_PREFIX,
  FILM_SCANNER_CAMERA_SECTION_HEADER,
  getFilmScanners,
  type FilmScannerWithDisplay,
} from "@/lib/film-scanner-queries";
import { getRollPickerMru, recordRollPickerMru } from "@/lib/roll-picker-mru";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import {
  SHARE_ROLL_PICKER_ROW_HEIGHT,
  ShareRollPickerAddCustomEmptyState,
  ShareRollPickerOptionRow,
  shareRollPickerOptionButtonClassName,
  shareRollPickerSectionLabelClassName,
} from "@/components/share-roll-picker-primitives";
import { cn } from "@/lib/utils";

export function filterScannersForPicker(rows: FilmScannerWithDisplay[], query: string): FilmScannerWithDisplay[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  const words = normalized.split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    const searchable = `${row.displayName} ${row.name}`.toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}

export function ShareRollScannerPicker({
  scanner,
  onScannerChange,
  onPicked,
  userId,
}: {
  scanner: string;
  onScannerChange: (value: string) => void;
  onPicked?: () => void;
  userId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [allRows, setAllRows] = useState<FilmScannerWithDisplay[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [recentList, setRecentList] = useState<string[]>([]);

  const parentRef = useRef<HTMLDivElement>(null);

  const refreshRecents = useCallback(() => {
    setRecentList(
      getRollPickerMru(userId, "scanner", 3).filter(
        (name) => name !== FILM_SCANNER_CAMERA_SCANNING_DISPLAY
      )
    );
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await getFilmScanners();
        if (cancelled) return;
        setAllRows(rows);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "ready") refreshRecents();
  }, [status, refreshRecents]);

  useEffect(() => {
    if (query.trim() === "") refreshRecents();
  }, [query, refreshRecents]);

  const filtered = useMemo(() => filterScannersForPicker(allRows, query), [allRows, query]);

  const queryTrim = query.trim();
  const queryNorm = queryTrim.toLowerCase();
  const showCameraScanBlock =
    status === "ready" &&
    (queryNorm.length === 0 || FILM_SCANNER_CAMERA_SEARCH_PREFIX.startsWith(queryNorm));

  const splitLayout = queryNorm === "" && status === "ready";
  const showRecent = splitLayout && recentList.length > 0;

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SHARE_ROLL_PICKER_ROW_HEIGHT,
    overscan: 12,
  });

  const pickScanner = useCallback(
    (value: string) => {
      if (value !== FILM_SCANNER_CAMERA_SCANNING_DISPLAY) {
        recordRollPickerMru(userId, "scanner", value);
      }
      onScannerChange(value);
      refreshRecents();
      onPicked?.();
    },
    [userId, onScannerChange, onPicked, refreshRecents]
  );

  const cameraScanSelected = scanner.trim() === FILM_SCANNER_CAMERA_SCANNING_DISPLAY;

  const catalogEmptyWithSearch =
    status === "ready" && filtered.length === 0 && queryTrim.length > 0;
  const catalogEmptyNoSearch = status === "ready" && filtered.length === 0 && queryTrim.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      <SearchPageHeaderForm
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Find your scanner..."
        ariaLabel="Find your scanner"
        showSearchIcon
      />

      <div
        ref={parentRef}
        id="share-roll-scanner-catalog-results"
        role="listbox"
        aria-label="Scanner matches"
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-background"
        style={{ contain: "strict" }}
      >
        {status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Loading scanners…
          </div>
        ) : status === "error" ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            Could not load scanners. Try again later.
          </div>
        ) : catalogEmptyNoSearch ? (
          <div className="px-4 py-16 text-center">
            <p className="font-sans text-base font-semibold text-foreground">No matching scanners</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different name or model.</p>
          </div>
        ) : catalogEmptyWithSearch ? (
          <>
            {showCameraScanBlock ? (
              <div className="shrink-0 bg-background">
                <p className={cn(shareRollPickerSectionLabelClassName, "pt-1")}>
                  {FILM_SCANNER_CAMERA_SECTION_HEADER}
                </p>
                <ShareRollPickerOptionRow
                  label={FILM_SCANNER_CAMERA_SCANNING_ROW_LABEL}
                  selected={cameraScanSelected}
                  onPick={() => pickScanner(FILM_SCANNER_CAMERA_SCANNING_DISPLAY)}
                  showBottomBorder={false}
                />
              </div>
            ) : null}
            {showCameraScanBlock ? (
              <p className="px-4 pb-1 pt-2 text-center text-sm text-muted-foreground">
                No matching scanners in the catalog.
              </p>
            ) : null}
            <div className="px-3 pt-2">
              <ShareRollPickerAddCustomEmptyState
                term={queryTrim}
                entityLabel="scanner"
                onPick={() => pickScanner(queryTrim)}
              />
            </div>
          </>
        ) : (
          <>
            {showRecent ? (
              <div className="shrink-0 bg-background">
                <p className={cn(shareRollPickerSectionLabelClassName, "pt-1")}>Recent</p>
                <div>
                  {recentList.map((name, i) => (
                    <ShareRollPickerOptionRow
                      key={name}
                      label={name}
                      selected={scanner.trim() === name}
                      onPick={() => pickScanner(name)}
                      showBottomBorder={i < recentList.length - 1}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {showCameraScanBlock ? (
              <div className="shrink-0 bg-background">
                <p
                  className={cn(
                    shareRollPickerSectionLabelClassName,
                    showRecent ? "pt-8" : "pt-1"
                  )}
                >
                  {FILM_SCANNER_CAMERA_SECTION_HEADER}
                </p>
                <ShareRollPickerOptionRow
                  label={FILM_SCANNER_CAMERA_SCANNING_ROW_LABEL}
                  selected={cameraScanSelected}
                  onPick={() => pickScanner(FILM_SCANNER_CAMERA_SCANNING_DISPLAY)}
                  showBottomBorder={false}
                />
              </div>
            ) : null}

            {splitLayout ? (
              <p
                className={cn(
                  shareRollPickerSectionLabelClassName,
                  showRecent || showCameraScanBlock ? "pt-8" : "pt-1"
                )}
              >
                All scanners
              </p>
            ) : null}

            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = filtered[virtualRow.index];
                const selected = scanner.trim() === row.displayName;
                return (
                  <div
                    key={row.id}
                    className="absolute left-0 top-0 w-full border-b border-border/40 dark:border-white/10"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => pickScanner(row.displayName)}
                      className={shareRollPickerOptionButtonClassName}
                    >
                      {row.displayName}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
