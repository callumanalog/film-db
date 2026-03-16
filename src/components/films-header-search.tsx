"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useFilmsSearch } from "@/context/films-search-context";

const DEBOUNCE_MS = 300;

export function FilmsHeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filmsSearch = useFilmsSearch();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  const applySearchUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set("search", q.trim());
      else params.delete("search");
      const query = params.toString();
      router.push(query ? `/films?${query}` : "/films");
    },
    [searchParams, router]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!trimmed) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const current = searchParams.get("search") ?? "";
      if (current === trimmed) return;
      applySearchUrl(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, searchParams, applySearchUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inputRef.current?.blur();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const q = value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("search", q);
    else params.delete("search");
    const query = params.toString();
    router.push(query ? `/films?${query}` : "/films");
  };

  const handleClear = () => {
    setValue("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    const query = params.toString();
    router.push(query ? `/films?${query}` : "/films");
  };

  const handleFocus = () => filmsSearch?.setIsSearchFocused(true);
  const handleBlur = () => filmsSearch?.setIsSearchFocused(false);

  const showClear = value.trim() !== "";

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex h-12 w-full min-w-0 items-center gap-2 rounded-card border border-slate-200 bg-white pl-4 pr-2"
    >
      <span className="flex shrink-0 items-center justify-center" aria-hidden>
        <Search className="h-4 w-4 text-muted-foreground" />
      </span>
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search film stocks..."
        className="min-w-0 flex-1 border-0 bg-transparent py-0 text-base font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="flex shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
