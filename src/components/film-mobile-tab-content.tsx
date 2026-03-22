"use client";

import type { ReactNode } from "react";
import { useFilmMobileTab } from "@/context/film-mobile-tab-context";

interface FilmMobileTabContentProps {
  overview: ReactNode;
  scans: ReactNode;
  reviews: ReactNode;
  lists: ReactNode;
}

export function FilmMobileTabContent({
  overview,
  scans,
  reviews,
  lists,
}: FilmMobileTabContentProps) {
  const ctx = useFilmMobileTab();
  const activeTab = ctx?.activeTab ?? "overview";

  return (
    <>
      {/* Mobile: show only the active tab */}
      <div className="md:hidden">
        {activeTab === "overview" && overview}
        {activeTab === "scans" && scans}
        {activeTab === "reviews" && reviews}
        {activeTab === "lists" && lists}
      </div>
      {/* Desktop: show everything (overview handles its own layout) */}
      <div className="hidden md:block">
        {overview}
      </div>
    </>
  );
}
