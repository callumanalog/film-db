"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  size?: "default" | "lg";
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Search film stocks...",
  className = "",
  size = "default",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/films?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/films");
    }
  }

  function handleClear() {
    setQuery("");
    router.push("/films");
  }

  const sizeClasses =
    size === "lg"
      ? "h-14 text-base pl-12 pr-10"
      : "h-10 text-sm pl-10 pr-9";

  const iconClasses =
    size === "lg"
      ? "left-4 h-5 w-5"
      : "left-3 h-4 w-4";

  const showClear = query.length > 0;

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${iconClasses}`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            if (!newValue.trim()) {
              router.push("/films");
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-border/60 bg-secondary/50 font-medium text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 ${sizeClasses}`}
        />
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
