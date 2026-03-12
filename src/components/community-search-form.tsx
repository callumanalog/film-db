"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface CommunitySearchFormProps {
  defaultValue?: string;
  className?: string;
}

export function CommunitySearchForm({ defaultValue = "", className = "" }: CommunitySearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement | null)?.value?.trim();
    const stock = searchParams.get("stock");
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (stock) params.set("stock", stock);
    router.push(`/community${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search caption, camera, lens, lab..."
          className="w-full rounded-lg border border-border/60 bg-secondary/50 py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Search community uploads"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90"
        >
          Search
        </button>
      </div>
    </form>
  );
}
