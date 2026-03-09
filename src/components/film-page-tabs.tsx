"use client";

import { useEffect, useState, type ReactNode } from "react";

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
              className={`font-advercase relative whitespace-nowrap pb-3 pt-2 text-sm font-semibold transition-colors ${
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

export function FilmPageTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  return <FilmPageNav sections={tabs} />;
}
