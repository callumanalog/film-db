"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  FILM_LAB_HOME_DEVELOPMENT_DISPLAY,
  FILM_LAB_HOME_DEVELOPMENT_ROW_LABEL,
  FILM_LAB_HOME_DEV_SEARCH_PREFIX,
  getFilmLabs,
  type FilmLabWithDisplay,
} from "@/lib/film-lab-queries";
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

/** Word-split filter (same pattern as `filterCamerasForPicker`). */
export function filterLabsForPicker(rows: FilmLabWithDisplay[], query: string): FilmLabWithDisplay[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  const words = normalized.split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    const searchable = `${row.displayName} ${row.name} ${row.country}`.toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}

function titleCaseLabFreeText(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (!/[a-z]/i.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function ShareRollLabPicker({
  lab,
  onLabChange,
  onPicked,
  userId,
}: {
  lab: string;
  onLabChange: (value: string) => void;
  onPicked?: () => void;
  userId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [allRows, setAllRows] = useState<FilmLabWithDisplay[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [recentList, setRecentList] = useState<string[]>([]);

  const parentRef = useRef<HTMLDivElement>(null);

  const refreshRecents = useCallback(() => {
    setRecentList(
      getRollPickerMru(userId, "lab", 3).filter(
        (name) => name !== FILM_LAB_HOME_DEVELOPMENT_DISPLAY
      )
    );
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const labs = await getFilmLabs();
        if (cancelled) return;
        setAllRows(labs);
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

  const filtered = useMemo(() => filterLabsForPicker(allRows, query), [allRows, query]);
  const customLabLabel = useMemo(() => titleCaseLabFreeText(query), [query]);

  const queryTrim = query.trim();
  const queryNorm = queryTrim.toLowerCase();
  /** Empty query, or typed chars are a prefix of "home dev" (e.g. h, ho, home, home d…). */
  const showHomeDevBlock =
    status === "ready" &&
    (queryNorm.length === 0 || FILM_LAB_HOME_DEV_SEARCH_PREFIX.startsWith(queryNorm));

  const splitLayout = queryNorm === "" && status === "ready";
  const showRecent = splitLayout && recentList.length > 0;

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SHARE_ROLL_PICKER_ROW_HEIGHT,
    overscan: 12,
  });

  const pickLab = useCallback(
    (value: string) => {
      if (value !== FILM_LAB_HOME_DEVELOPMENT_DISPLAY) {
        recordRollPickerMru(userId, "lab", value);
      }
      onLabChange(value);
      refreshRecents();
      onPicked?.();
    },
    [userId, onLabChange, onPicked, refreshRecents]
  );

  const homeSelected = lab.trim() === FILM_LAB_HOME_DEVELOPMENT_DISPLAY;

  const catalogEmptyWithSearch =
    status === "ready" && filtered.length === 0 && queryTrim.length > 0;
  const catalogEmptyNoSearch = status === "ready" && filtered.length === 0 && queryTrim.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      <SearchPageHeaderForm
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Find your film lab..."
        ariaLabel="Find your film lab"
        showSearchIcon
      />

      <div
        ref={parentRef}
        id="share-roll-lab-catalog-results"
        role="listbox"
        aria-label="Film lab matches"
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-background"
        style={{ contain: "strict" }}
      >
        {status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Loading labs…
          </div>
        ) : status === "error" ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            Could not load labs. Try again later.
          </div>
        ) : catalogEmptyNoSearch ? (
          <div className="px-4 py-16 text-center">
            <p className="font-sans text-base font-semibold text-foreground">No matching labs</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different name or country.</p>
          </div>
        ) : catalogEmptyWithSearch ? (
          <>
            {showHomeDevBlock ? (
              <div className="shrink-0 bg-background">
                <p className={cn(shareRollPickerSectionLabelClassName, "pt-1")}>Home dev</p>
                <ShareRollPickerOptionRow
                  label={FILM_LAB_HOME_DEVELOPMENT_ROW_LABEL}
                  selected={homeSelected}
                  onPick={() => pickLab(FILM_LAB_HOME_DEVELOPMENT_DISPLAY)}
                  showBottomBorder={false}
                />
              </div>
            ) : null}
            {showHomeDevBlock ? (
              <p className="px-4 pb-1 pt-2 text-center text-sm text-muted-foreground">
                No matching labs in the catalog.
              </p>
            ) : null}
            <div className="px-3 pt-2">
              <ShareRollPickerAddCustomEmptyState
                term={customLabLabel}
                entityLabel="lab"
                onPick={() => pickLab(customLabLabel)}
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
                      selected={lab.trim() === name}
                      onPick={() => pickLab(name)}
                      showBottomBorder={i < recentList.length - 1}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {showHomeDevBlock ? (
              <div className="shrink-0 bg-background">
                <p
                  className={cn(
                    shareRollPickerSectionLabelClassName,
                    showRecent ? "pt-8" : "pt-1"
                  )}
                >
                  Home dev
                </p>
                <ShareRollPickerOptionRow
                  label={FILM_LAB_HOME_DEVELOPMENT_ROW_LABEL}
                  selected={homeSelected}
                  onPick={() => pickLab(FILM_LAB_HOME_DEVELOPMENT_DISPLAY)}
                  showBottomBorder={false}
                />
              </div>
            ) : null}

            {splitLayout ? (
              <p
                className={cn(
                  shareRollPickerSectionLabelClassName,
                  showRecent || showHomeDevBlock ? "pt-8" : "pt-1"
                )}
              >
                All labs
              </p>
            ) : null}

            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = filtered[virtualRow.index];
                const selected = lab.trim() === row.displayName;
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
                      onClick={() => pickLab(row.displayName)}
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
