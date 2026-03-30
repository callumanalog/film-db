import { cn } from "@/lib/utils";

/** Chevron inside top-leading nav controls (matches list detail). */
export const topLeftNavChevronIconClassName = "size-6 shrink-0 -translate-x-px";

const topLeftNavTouchBase =
  "flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-start rounded-full pl-2.5 pr-2 text-foreground transition-colors hover:bg-muted/80";

/**
 * Icon-only back/close control in a padded row (e.g. `px-4`); negative margin aligns with list detail.
 */
export const topLeftNavIconButtonClassName = cn("-ml-3", topLeftNavTouchBase);

/**
 * Same 44px touch target without negative margin (e.g. `absolute` in a header or tight sheets).
 */
export const topLeftNavIconTouchClassName = topLeftNavTouchBase;

/**
 * Top-leading row with chevron + label (e.g. lightbox “Explore”). Same vertical metrics as icon-only control.
 */
export const topLeftNavLabeledRowClassName = cn(
  "-ml-3 flex min-h-[44px] min-w-0 shrink-0 items-center justify-start gap-0.5 rounded-full pl-2.5 pr-2 transition-colors"
);
