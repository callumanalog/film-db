"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Section {
  id: string;
  label: string;
  content: ReactNode;
}

interface FilmPageNavProps {
  sections: Section[];
}

export function FilmPageNav({ sections }: FilmPageNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <div>
      <nav className="sticky top-16 z-10 -mx-1 mb-8 bg-background/95 px-1 backdrop-blur-sm">
        <div className="flex gap-6 border-b border-border/50">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`relative whitespace-nowrap pb-3 pt-2 text-sm font-semibold transition-colors ${
                s.id === activeId
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
              {s.id === activeId && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {sections.map((s) => (
        <div key={s.id} id={s.id}>
          {s.content}
        </div>
      ))}
    </div>
  );
}

/** State-based tabs: click to switch, only one panel visible. */
const FilmDetailTabsContext = createContext<{ activeId: string; setActiveId: (id: string) => void } | null>(null);

export function useFilmDetailTabs() {
  const ctx = useContext(FilmDetailTabsContext);
  return ctx;
}

/** Button/link that switches to another tab. Use inside Overview (or any tab) to link to References or Notes. */
export function SwitchToTabButton({ tabId, children, className }: { tabId: string; children: ReactNode; className?: string }) {
  const ctx = useFilmDetailTabs();
  if (!ctx) return null;
  return (
    <button
      type="button"
      onClick={() => ctx.setActiveId(tabId)}
      className={className ?? "text-sm font-medium text-primary hover:underline"}
    >
      {children}
    </button>
  );
}

export function FilmDetailTabs({
  tabs,
  defaultId,
  rightPane,
  rightPaneOnlyForTabId,
  fullWidthTabBar = false,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  defaultId?: string;
  rightPane?: ReactNode;
  /** When set, right pane is only shown when this tab is active (e.g. "overview"). */
  rightPaneOnlyForTabId?: string;
  fullWidthTabBar?: boolean;
}) {
  const [activeId, setActiveId] = useState(defaultId ?? tabs[0]?.id ?? "");

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const showRightPane = rightPane && (rightPaneOnlyForTabId == null || activeId === rightPaneOnlyForTabId);

  const tabNav = (
    <nav className={fullWidthTabBar ? "w-fit" : "border-b border-border/50"}>
      <div className="flex gap-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={`relative pb-3 pt-1 text-sm font-semibold transition-colors ${
              t.id === activeId
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.id === activeId && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );

  return (
    <FilmDetailTabsContext.Provider value={{ activeId, setActiveId }}>
      {/* Gap between title/stats and tab bar */}
      <div className="mt-4">
        {fullWidthTabBar ? (
          <div className="w-full border-b border-border/50">
            <div className="flex max-w-sm justify-center mx-auto md:max-w-none md:mx-0 md:justify-start">
              {tabNav}
              <div className="min-w-0 flex-1 md:block hidden" aria-hidden />
            </div>
          </div>
        ) : (
          tabNav
        )}
        <div className={`pt-6 ${showRightPane ? "flex gap-8" : ""}`}>
          <div className={showRightPane ? "min-w-0 flex-1" : ""}>
            {activeTab?.content}
          </div>
          {showRightPane && <div className="shrink-0">{rightPane}</div>}
        </div>
      </div>
    </FilmDetailTabsContext.Provider>
  );
}

export function FilmPageTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  return <FilmPageNav sections={tabs} />;
}
