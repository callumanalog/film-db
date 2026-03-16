"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import type { OverviewTabContentProps } from "@/components/overview-tab-content";
import type { FlickrPhoto } from "@/lib/flickr";
import type { LoggedRollEntry } from "@/app/actions/user-actions";

const LazyOverviewTab = lazy(() =>
  import("@/components/overview-tab-content").then((m) => ({ default: m.OverviewTabContent }))
);
const LazyRollsTab = lazy(() =>
  import("@/components/rolls-tab-content").then((m) => ({ default: m.RollsTabContent }))
);
const LazyShotsTab = lazy(() =>
  import("@/components/shots-tab-content").then((m) => ({ default: m.ShotsTabContent }))
);
const LazyNotesTab = lazy(() =>
  import("@/components/notes-tab-content-wrapper").then((m) => ({ default: m.NotesTabContentWrapper }))
);

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-6">
      <div className="h-6 w-1/3 rounded bg-muted" />
      <div className="h-4 w-full max-w-md rounded bg-muted" />
      <div className="h-4 w-full max-w-sm rounded bg-muted" />
    </div>
  );
}

export interface FilmDetailTabsLazyProps {
  defaultId: string;
  overviewProps: OverviewTabContentProps;
  rollsProps: { loggedRolls: LoggedRollEntry[]; slug: string };
  shotsProps: { stockName: string; slug: string; flickrImages: FlickrPhoto[] };
  notesProps: { slug: string };
  rightPane?: ReactNode;
  rightPaneOnlyForTabId?: string;
}

export function FilmDetailTabsLazy({
  defaultId,
  overviewProps,
  rollsProps,
  shotsProps,
  notesProps,
  rightPane,
  rightPaneOnlyForTabId,
}: FilmDetailTabsLazyProps) {
  const [activeId, setActiveId] = useState(defaultId);

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content:
        activeId === "overview" ? (
          <Suspense fallback={<TabSkeleton />}>
            <LazyOverviewTab {...overviewProps} />
          </Suspense>
        ) : null,
    },
    {
      id: "rolls",
      label: "Rolls",
      content:
        activeId === "rolls" ? (
          <Suspense fallback={<TabSkeleton />}>
            <LazyRollsTab {...rollsProps} />
          </Suspense>
        ) : null,
    },
    {
      id: "shots",
      label: "Shots",
      content:
        activeId === "shots" ? (
          <Suspense fallback={<TabSkeleton />}>
            <LazyShotsTab {...shotsProps} />
          </Suspense>
        ) : null,
    },
    {
      id: "notes",
      label: "Notes",
      content:
        activeId === "notes" ? (
          <Suspense fallback={<TabSkeleton />}>
            <LazyNotesTab {...notesProps} />
          </Suspense>
        ) : null,
    },
  ];

  return (
    <FilmDetailTabs
      tabs={tabs}
      defaultId={defaultId}
      activeId={activeId}
      onTabChange={setActiveId}
      rightPane={rightPane}
      rightPaneOnlyForTabId={rightPaneOnlyForTabId}
      fullWidthTabBar
    />
  );
}
