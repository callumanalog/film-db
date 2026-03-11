import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

interface FilmGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  emptyMessage?: string;
  /** Use Work Sans for card titles (e.g. on films listing page). */
  useWorkSansForTitles?: boolean;
  /** Slugs of films the user has favourited — show heart icon on matching cards. */
  favouriteSlugs?: string[];
}

export function FilmGrid({
  stocks,
  emptyMessage = "No film stocks found matching your filters.",
  useWorkSansForTitles = false,
  favouriteSlugs,
}: FilmGridProps) {
  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stocks.map((stock) => (
        <FilmCard
          key={stock.id}
          stock={stock}
          useWorkSansTitle={useWorkSansForTitles}
          favouriteSlugs={favouriteSlugs}
        />
      ))}
    </div>
  );
}
