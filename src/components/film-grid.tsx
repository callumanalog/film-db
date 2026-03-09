import type { FilmStock, FilmBrand } from "@/lib/types";
import { FilmCard } from "@/components/film-card";

interface FilmGridProps {
  stocks: (FilmStock & { brand: FilmBrand })[];
  emptyMessage?: string;
}

export function FilmGrid({
  stocks,
  emptyMessage = "No film stocks found matching your filters.",
}: FilmGridProps) {
  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
      {stocks.map((stock) => (
        <FilmCard key={stock.id} stock={stock} />
      ))}
    </div>
  );
}
