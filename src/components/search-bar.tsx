"use client";

import { Search } from "lucide-react";
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

  const sizeClasses =
    size === "lg"
      ? "h-14 text-base pl-12 pr-5"
      : "h-10 text-sm pl-10 pr-4";

  const iconClasses =
    size === "lg"
      ? "left-4 h-5 w-5"
      : "left-3 h-4 w-4";

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${iconClasses}`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-border/60 bg-secondary/50 font-medium text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 ${sizeClasses}`}
        />
      </div>
    </form>
  );
}
