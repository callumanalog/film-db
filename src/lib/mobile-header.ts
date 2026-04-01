import type { CSSProperties } from "react";

export const mobileHeaderShellClassName = "shrink-0 bg-white dark:bg-background";

export const mobileHeaderSafeAreaStyle: CSSProperties = {
  paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
};

export const mobileHeaderRowClassName = "flex h-11 items-center justify-between px-4 sm:px-6";

export const mobileHeaderLeadingRowClassName = "flex h-11 items-center px-4 sm:px-6";

export const mobileHeaderTitleBlockClassName = "px-4 pb-4 pt-0 sm:px-6";

export const mobileHeaderTitleClassName =
  "font-sans text-2xl font-bold leading-tight tracking-tight text-foreground md:text-[1.75rem]";

export const mobileHeaderSubtitleClassName =
  "mt-1 block font-sans text-[10px] font-medium uppercase leading-tight tracking-wider text-muted-foreground";
