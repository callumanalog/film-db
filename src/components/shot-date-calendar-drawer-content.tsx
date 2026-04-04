"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DayPicker, UI } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(s: string): Date | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const [y, m, d] = t.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt;
}

function addMonths(d: Date, n: number): Date {
  const next = new Date(d);
  next.setMonth(next.getMonth() + n);
  return next;
}

/** First day of the given date’s month (local). */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Latest month users can navigate to (current calendar month, local). */
function maxNavigableMonthStart(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), 1);
}

const SWIPE_PX = 56;

const YEAR_GRID_START = 1920;

function yearGridEnd(): number {
  return Math.max(new Date().getFullYear(), YEAR_GRID_START);
}

export interface ShotDateCalendarDrawerContentProps {
  /** `YYYY-MM-DD` or empty */
  shotDate: string;
  onShotDateChange: (iso: string) => void;
  onRequestClose: () => void;
}

/**
 * Full-bleed react-day-picker calendar (swipe + chevrons), year grid, and a bottom Close row matching the + action sheet.
 * Parent owns the Sheet shell, z-index, and open state.
 */
export function ShotDateCalendarDrawerContent({
  shotDate,
  onShotDateChange,
  onRequestClose,
}: ShotDateCalendarDrawerContentProps) {
  const selected = parseIsoDate(shotDate);
  const [month, setMonth] = useState<Date>(() => {
    const base = selected ?? new Date();
    const cap = maxNavigableMonthStart();
    const start = startOfMonth(base);
    return start.getTime() > cap.getTime() ? cap : start;
  });
  const [slideDir, setSlideDir] = useState<0 | 1 | -1>(0);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const yearGridRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => {
    const end = yearGridEnd();
    const list: number[] = [];
    for (let y = end; y >= YEAR_GRID_START; y--) list.push(y);
    return list;
  }, [yearPickerOpen]);

  const currentCalendarYear = month.getFullYear();

  useLayoutEffect(() => {
    if (!yearPickerOpen) return;
    const id = requestAnimationFrame(() => {
      const root = yearGridRef.current;
      if (!root) return;
      const el = root.querySelector(`[data-year="${currentCalendarYear}"]`);
      el?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [yearPickerOpen, currentCalendarYear]);

  const toggleYearPicker = useCallback(() => {
    setYearPickerOpen((v) => !v);
  }, []);

  const pickYear = useCallback((y: number) => {
    setMonth((m) => {
      const cap = maxNavigableMonthStart();
      let next = new Date(y, m.getMonth(), 1);
      if (next.getTime() > cap.getTime()) next = cap;
      return next;
    });
    setYearPickerOpen(false);
    setSlideDir(0);
  }, []);

  const bumpMonth = useCallback((delta: number) => {
    let applied = false;
    setMonth((m) => {
      const next = addMonths(m, delta);
      const cap = maxNavigableMonthStart();
      const nextStart = startOfMonth(next);
      if (delta > 0 && nextStart.getTime() > cap.getTime()) return m;
      applied = true;
      return next;
    });
    if (applied) setSlideDir(delta > 0 ? 1 : -1);
    else if (delta > 0) setSlideDir(0);
  }, []);

  const handleMonthChange = useCallback((m: Date) => {
    const cap = maxNavigableMonthStart();
    const start = startOfMonth(m);
    setMonth(start.getTime() > cap.getTime() ? cap : start);
  }, []);

  const capMonth = maxNavigableMonthStart();
  const canGoForwardMonth =
    startOfMonth(month).getTime() < capMonth.getTime();

  const isFutureCalendarDay = useCallback((day: Date) => {
    const t = new Date();
    const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    return d > today;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (yearPickerOpen) return;
      if (touchStartX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(dx) < SWIPE_PX) return;
      if (dx < 0) {
        if (canGoForwardMonth) bumpMonth(1);
      } else bumpMonth(-1);
    },
    [bumpMonth, canGoForwardMonth, yearPickerOpen]
  );

  const handleSelect = useCallback(
    (d: Date | undefined) => {
      if (!d) return;
      onShotDateChange(toIsoDate(d));
      onRequestClose();
    },
    [onShotDateChange, onRequestClose]
  );

  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const hasShotDate = shotDate.trim().length > 0;

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden",
        yearPickerOpen ? "h-[min(58dvh,520px)] min-h-0" : "h-auto min-h-0"
      )}
    >
      <SheetTitle className="sr-only">Date shot</SheetTitle>

      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden px-1",
          yearPickerOpen ? "flex-1 basis-0" : "shrink-0"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={
          {
            "--rdp-accent-color": "var(--color-foreground)",
            "--rdp-accent-background-color": "color-mix(in oklab, var(--color-foreground) 14%, transparent)",
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => (yearPickerOpen ? setYearPickerOpen(false) : bumpMonth(-1))}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary active:bg-secondary/80"
            aria-label={yearPickerOpen ? "Back to calendar" : "Previous month"}
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={toggleYearPicker}
            className="min-w-0 flex-1 rounded-lg px-2 py-2 text-center transition-colors hover:bg-secondary/60 active:bg-secondary/80"
            aria-expanded={yearPickerOpen}
            aria-controls="shot-date-year-grid"
            id="shot-date-calendar-caption"
          >
            <span className="block text-sm font-semibold tabular-nums text-foreground">
              {yearPickerOpen ? "Select year" : monthLabel}
            </span>
          </button>
          <button
            type="button"
            disabled={!yearPickerOpen && !canGoForwardMonth}
            onClick={() => (yearPickerOpen ? setYearPickerOpen(false) : bumpMonth(1))}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
              !yearPickerOpen && !canGoForwardMonth
                ? "cursor-not-allowed text-muted-foreground/35"
                : "text-foreground hover:bg-secondary active:bg-secondary/80"
            )}
            aria-label={yearPickerOpen ? "Back to calendar" : "Next month"}
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <div
          className={cn(
            "flex flex-col overflow-hidden",
            yearPickerOpen ? "min-h-0 flex-1 basis-0" : "shrink-0"
          )}
        >
          <AnimatePresence initial={false} mode="wait">
            {yearPickerOpen ? (
              <motion.div
                key="year-grid"
                id="shot-date-year-grid"
                role="grid"
                aria-labelledby="shot-date-calendar-caption"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden px-1 pb-2"
              >
                <div
                  ref={yearGridRef}
                  className="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-2 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
                >
                  <div className="grid grid-cols-4 gap-2 pb-2 sm:grid-cols-5">
                    {years.map((y) => {
                      const isActive = y === currentCalendarYear;
                      return (
                        <button
                          key={y}
                          type="button"
                          data-year={y}
                          role="gridcell"
                          onClick={() => pickYear(y)}
                          className={cn(
                            "flex min-h-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors",
                            isActive
                              ? "bg-foreground text-background ring-2 ring-foreground/25 ring-offset-2 ring-offset-background"
                              : "text-foreground hover:bg-secondary/80 active:bg-secondary"
                          )}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="calendar-panel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="shrink-0 overflow-x-hidden px-1"
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`${month.getFullYear()}-${month.getMonth()}`}
                    initial={{ opacity: 0, x: slideDir === 0 ? 0 : slideDir * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDir === 0 ? 0 : -slideDir * 16 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="w-full"
                  >
                    <DayPicker
                      mode="single"
                      month={month}
                      onMonthChange={handleMonthChange}
                      selected={selected}
                      onSelect={handleSelect}
                      disabled={isFutureCalendarDay}
                      showOutsideDays
                      className="mx-auto w-full max-w-[100vw] [--rdp-day-height:2.75rem] [--rdp-day-width:2.75rem] [--rdp-day_button-height:2.625rem] [--rdp-day_button-width:2.625rem]"
                      classNames={{
                        [UI.Root]: "rdp-root w-full max-w-full border-0 bg-transparent p-0 shadow-none",
                        [UI.Months]: "w-full",
                        [UI.Month]: "w-full space-y-1",
                        [UI.MonthCaption]: "hidden",
                        [UI.Nav]: "hidden",
                        [UI.MonthGrid]: "w-full table-fixed border-collapse",
                        [UI.Weekdays]: "mb-1",
                        [UI.Weekday]:
                          "text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                        [UI.Week]: "",
                        // Selection modifiers merge onto `td` by default (rectangle). Style the inner button instead.
                        [UI.Day]:
                          "p-0 text-center [&[data-selected]_button]:!bg-black [&[data-selected]_button]:!text-white [&[data-selected]_button]:hover:!bg-black [&[data-selected]_button]:hover:!text-white [&[data-selected]_button]:focus-visible:!outline-none [&[data-selected]_button]:focus-visible:!ring-2 [&[data-selected]_button]:focus-visible:!ring-black/35 dark:[&[data-selected]_button]:!bg-white dark:[&[data-selected]_button]:!text-black dark:[&[data-selected]_button]:hover:!bg-white dark:[&[data-selected]_button]:hover:!text-black dark:[&[data-selected]_button]:focus-visible:!ring-white/40",
                        [UI.DayButton]:
                          "m-0 inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 active:bg-secondary",
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (hasShotDate) {
            onShotDateChange("");
            const t = new Date();
            const cap = maxNavigableMonthStart();
            const start = startOfMonth(t);
            setMonth(start.getTime() > cap.getTime() ? cap : start);
            setSlideDir(0);
            setYearPickerOpen(false);
            return;
          }
          onRequestClose();
        }}
        className="mobile-safe-bottom-footer w-full shrink-0 border-t border-border/40 px-4 pt-3 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {hasShotDate ? "Clear date" : "Close"}
      </button>
    </div>
  );
}
