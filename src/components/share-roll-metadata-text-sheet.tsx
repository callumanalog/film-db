"use client";

import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getRollPickerMru, recordRollPickerMru, type RollPickerMruKind } from "@/lib/roll-picker-mru";
import { useKeyboardSafeViewport } from "@/lib/use-keyboard-safe-viewport";
import { SearchPageHeaderForm } from "@/components/search-page-header";
import {
  ShareRollPickerOptionRow,
  shareRollPickerSectionLabelClassName,
} from "@/components/share-roll-picker-primitives";
import { cn } from "@/lib/utils";

export type ShareRollMetadataTextSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  userId: string | null;
  title: string;
  placeholder: string;
  ariaLabel: string;
  buttonLabel: string;
  mruKind: Extract<RollPickerMruKind, "location" | "lens">;
  /** e.g. "Recent locations" — shown with uppercase styling. */
  recentSectionTitle: string;
  autoComplete?: string;
};

/**
 * Bottom sheet for free-text roll metadata (location, lens): search field, MRU picks, explicit save.
 * Lifts with `visualViewport` bottom inset above the OSK (see root viewport in `layout.tsx`).
 */
export function ShareRollMetadataTextSheet({
  open,
  onOpenChange,
  value,
  onChange,
  userId,
  title,
  placeholder,
  ariaLabel,
  buttonLabel,
  mruKind,
  recentSectionTitle,
  autoComplete = "off",
}: ShareRollMetadataTextSheetProps) {
  const ksv = useKeyboardSafeViewport(open);
  const bottomInset = ksv?.bottomInset ?? 0;
  const maxSheetHeight =
    ksv != null ? Math.max(260, ksv.visualHeight - 24) : undefined;

  const [focusReady, setFocusReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [recentList, setRecentList] = useState<string[]>([]);

  const refreshRecents = useCallback(() => {
    setRecentList(getRollPickerMru(userId, mruKind, 3));
  }, [userId, mruKind]);

  useEffect(() => {
    if (!open) {
      setFocusReady(false);
      return;
    }
    setDraft(value);
    refreshRecents();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFocusReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open, value, refreshRecents]);

  useEffect(() => {
    if (draft.trim() === "") refreshRecents();
  }, [draft, refreshRecents]);

  const canSave = draft.trim().length > 0;
  const splitLayout = draft.trim() === "";

  const applyValue = useCallback(
    (trimmed: string) => {
      recordRollPickerMru(userId, mruKind, trimmed);
      onChange(trimmed);
      refreshRecents();
      onOpenChange(false);
    },
    [userId, mruKind, onChange, onOpenChange, refreshRecents]
  );

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    applyValue(trimmed);
  }, [draft, applyValue]);

  const onSearchKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed) return;
      applyValue(trimmed);
    },
    [draft, applyValue]
  );

  return (
    <Sheet open={open} modal="trap-focus" onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="!z-[105] bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          "!z-[110] flex min-h-0 flex-col gap-0 border-0 p-0 shadow-2xl",
          "rounded-t-[20px] bg-background data-[side=bottom]:h-auto data-[side=bottom]:max-h-[50dvh]"
        )}
        style={{
          bottom: bottomInset,
          ...(maxSheetHeight != null ? { maxHeight: maxSheetHeight } : {}),
        }}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <SheetTitle className="shrink-0 px-4 pt-4 text-left font-sans text-lg font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </SheetTitle>

          <div className="shrink-0 px-4 pb-4 pt-3">
            <SearchPageHeaderForm
              value={draft}
              onChange={setDraft}
              onClear={() => setDraft("")}
              onKeyDown={onSearchKeyDown}
              autoFocus={open && focusReady}
              autoComplete={autoComplete}
              placeholder={placeholder}
              ariaLabel={ariaLabel}
            />
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-background px-4">
            {splitLayout && recentList.length > 0 ? (
              <div className="pb-2">
                <p className={cn(shareRollPickerSectionLabelClassName, "pt-1")}>{recentSectionTitle}</p>
                <div>
                  {recentList.map((r, i) => (
                    <ShareRollPickerOptionRow
                      key={r}
                      label={r}
                      selected={value.trim() === r}
                      onPick={() => applyValue(r)}
                      showBottomBorder={i < recentList.length - 1}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mobile-safe-bottom-footer shrink-0 border-t border-border/40 px-4 pt-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-40"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
