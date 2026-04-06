"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getCameras } from "@/lib/camera-queries";
import { getRollCameraRecents, recordRollCameraRecent } from "@/lib/roll-camera-recents";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import {
  SHARE_ROLL_PICKER_ROW_HEIGHT,
  ShareRollPickerAddCustomEmptyState,
  ShareRollPickerOptionRow,
  shareRollPickerSectionLabelClassName,
} from "@/components/share-roll-picker-primitives";
import { cn } from "@/lib/utils";

/** Same word-split filter as `MobileStockPickerPanel` / `filterStocks`. */
export function filterCamerasForPicker(
  rows: { id: string; displayName: string }[],
  query: string
): { id: string; displayName: string }[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  const words = normalized.split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    const searchable = row.displayName.toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}

/** Avoid "Agfa Agfa Isolette" when the model name already includes the brand. */
export function cameraPickerDisplayName(brandName: string, modelName: string): string {
  const b = brandName.trim();
  const n = modelName.trim();
  if (!n) return b;
  const nl = n.toLowerCase();
  const bl = b.toLowerCase();
  if (nl === bl) return n;
  if (nl.startsWith(`${bl} `) || nl.startsWith(`${bl}/`)) return n;
  return `${b} ${n}`.trim();
}

export function ShareRollCameraPicker({
  camera,
  onCameraChange,
  onPicked,
  userId,
}: {
  camera: string;
  onCameraChange: (value: string) => void;
  onPicked?: () => void;
  userId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [allRows, setAllRows] = useState<{ id: string; displayName: string }[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [recentList, setRecentList] = useState<string[]>([]);

  const parentRef = useRef<HTMLDivElement>(null);

  const refreshRecents = useCallback(() => {
    setRecentList(getRollCameraRecents(userId, 3));
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cams = await getCameras();
        if (cancelled) return;
        setAllRows(
          cams.map((c) => ({
            id: c.id,
            displayName: cameraPickerDisplayName(c.brand.name, c.name),
          }))
        );
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

  const filtered = useMemo(() => filterCamerasForPicker(allRows, query), [allRows, query]);

  const splitLayout = query.trim() === "" && status === "ready";

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SHARE_ROLL_PICKER_ROW_HEIGHT,
    overscan: 12,
  });

  const pickCamera = useCallback(
    (displayName: string) => {
      recordRollCameraRecent(userId, displayName);
      onCameraChange(displayName);
      refreshRecents();
      onPicked?.();
    },
    [userId, onCameraChange, onPicked, refreshRecents]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      <SearchPageHeaderForm
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Find your film camera..."
        ariaLabel="Find your film camera"
        showSearchIcon
      />

      <div
        ref={parentRef}
        id="share-roll-camera-catalog-results"
        role="listbox"
        aria-label="Camera matches"
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-background"
        style={{ contain: "strict" }}
      >
        {status === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            Loading cameras…
          </div>
        ) : status === "error" ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            Could not load cameras. Try again later.
          </div>
        ) : filtered.length === 0 && !query.trim() ? (
          <div className="px-4 py-16 text-center">
            <p className="font-sans text-base font-semibold text-foreground">No matching cameras</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different name or brand.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 pt-2">
            <ShareRollPickerAddCustomEmptyState
              term={query.trim()}
              entityLabel="camera"
              onPick={() => pickCamera(query.trim())}
            />
          </div>
        ) : (
          <>
            {splitLayout ? (
              <div className="shrink-0 bg-background">
                {recentList.length > 0 ? (
                  <>
                    <p className={cn(shareRollPickerSectionLabelClassName, "pt-1")}>Recent cameras</p>
                    <div>
                      {recentList.map((name, i) => (
                        <ShareRollPickerOptionRow
                          key={name}
                          label={name}
                          selected={camera.trim() === name}
                          onPick={() => pickCamera(name)}
                          showBottomBorder={i < recentList.length - 1}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
                <p
                  className={cn(
                    shareRollPickerSectionLabelClassName,
                    recentList.length > 0 ? "pt-8" : "pt-1"
                  )}
                >
                  All cameras
                </p>
              </div>
            ) : null}

            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = filtered[virtualRow.index];
                const selected = camera.trim() === row.displayName;
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
                      onClick={() => pickCamera(row.displayName)}
                      className={cn(
                        "flex h-full w-full items-center px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        "hover:bg-secondary/60 active:bg-secondary dark:hover:bg-secondary/50"
                      )}
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
