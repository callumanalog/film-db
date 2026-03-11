"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to the top of the page when the route changes (e.g. opening a film stock page).
 * Ensures stock detail pages always open at the top instead of below breadcrumbs.
 */
export function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
