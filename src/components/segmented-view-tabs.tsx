"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** Shared shell for `SegmentedViewTabs` and `SegmentedOptionTabs`. */
export const segmentedControlShellClassName =
  "flex items-stretch overflow-hidden rounded-[7px] border border-border/70 bg-background shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:border-border dark:shadow-none";

const segmentedTabDividerClassName = "w-px shrink-0 self-stretch bg-border/80 dark:bg-border";

function segmentedTabButtonClassName(selected: boolean) {
  return cn(
    "min-w-0 flex-1 px-2 py-2.5 text-center text-sm font-medium tracking-tight transition-[color,background-color,transform,box-shadow]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98] active:transition-none",
    selected
      ? "text-primary"
      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground active:bg-muted/50"
  );
}

export type SegmentedView = "everyone" | "following" | "you";

export const SEGMENTED_VIEW_OPTIONS: { id: SegmentedView; label: string }[] = [
  { id: "everyone", label: "Everyone" },
  { id: "following", label: "Following" },
  { id: "you", label: "You" },
];

/** Horizontal segmented control for arbitrary string options (same chrome as Everyone / Following / You). */
export function SegmentedOptionTabs({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className={segmentedControlShellClassName} role="tablist" aria-label={ariaLabel}>
      {options.map((opt, index) => (
        <Fragment key={opt}>
          {index > 0 ? <div className={segmentedTabDividerClassName} aria-hidden /> : null}
          <button
            type="button"
            role="tab"
            aria-selected={value === opt}
            onClick={() => onChange(opt)}
            className={segmentedTabButtonClassName(value === opt)}
          >
            {opt}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

/** Everyone / Following / You control (reviews tab, scans tab, etc.). */
export function SegmentedViewTabs({
  value,
  onChange,
  ariaLabel,
}: {
  value: SegmentedView;
  onChange: (v: SegmentedView) => void;
  ariaLabel: string;
}) {
  return (
    <div className={segmentedControlShellClassName} role="tablist" aria-label={ariaLabel}>
      {SEGMENTED_VIEW_OPTIONS.map((opt, index) => (
        <Fragment key={opt.id}>
          {index > 0 ? <div className={segmentedTabDividerClassName} aria-hidden /> : null}
          <button
            type="button"
            role="tab"
            aria-selected={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={segmentedTabButtonClassName(value === opt.id)}
          >
            {opt.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
