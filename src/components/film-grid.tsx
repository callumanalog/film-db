import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

interface FilmGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  emptyMessage?: string;
  /** Slugs of films the user has shot — show tick at bottom-left on matching cards. */
  shotSlugs?: string[];
  /** Optional map of slug -> avgRating so cards show real community rating. */
  statsBySlug?: Record<string, { avgRating: number | null }>;
  /** When true (filter pane open), use 3 columns per row. */
  filterPaneOpen?: boolean;
}

export function FilmGrid({
  stocks,
  emptyMessage = "No film stocks found matching your filters.",
  shotSlugs,
  statsBySlug,
  filterPaneOpen = false,
}: FilmGridProps) {
  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={
        filterPaneOpen
          ? "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6"
          : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5"
      }
    >
      {stocks.map((stock, index) => (
        <FilmCard key={stock.id} stock={stock} shotSlugs={shotSlugs} priority={index < 6} />
      ))}
    </div>
  );
}
