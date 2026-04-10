"use client";

import type { ReactNode } from "react";

interface FilmMobileTabContentProps {
  overview: ReactNode;
  scans: ReactNode;
  reviews: ReactNode;
  lists: ReactNode;
}

export function FilmMobileTabContent({
  overview,
}: FilmMobileTabContentProps) {
  return (
    <>
      {/* Mobile: all sections are composed inside overview in fixed order. */}
      <div className="md:hidden">
        {overview}
      </div>
      {/* Desktop: show everything (overview handles its own layout) */}
      <div className="hidden md:block">
        {overview}
      </div>
    </>
  );
}
