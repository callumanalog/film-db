"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useFilmsSearch } from "@/context/films-search-context";

export function RecentSearches() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filmsSearch = useFilmsSearch();
  const recent = filmsSearch?.recentSearches ?? [];

  const runSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", q.trim());
    filmsSearch?.addRecentSearch(q.trim());
    router.push(`/films?${params.toString()}`);
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Recent Searches</h2>
        {recent.length > 0 && (
          <button
            type="button"
            onClick={() => filmsSearch?.clearRecentSearches()}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      {recent.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No recent searches.</p>
      ) : (
        <ul className="mt-2 space-y-0 border-b border-slate-50 [&>li]:border-b [&>li]:border-slate-50">
          {recent.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => runSearch(q)}
                className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-foreground hover:bg-slate-50/50"
              >
                <span>{q}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
