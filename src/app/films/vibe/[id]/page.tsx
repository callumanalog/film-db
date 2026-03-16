import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFilmStocks } from "@/lib/supabase/queries";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { getVibeById } from "@/lib/discovery-vibes";
import { SetVibeMobileHeader } from "@/components/set-vibe-mobile-header";
import { FilmCard } from "@/components/film-card";
import type { FilmStockStats } from "@/lib/supabase/stats";
import type { FilmBrand } from "@/lib/types";

export const dynamic = "force-dynamic";

interface VibePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VibePageProps): Promise<Metadata> {
  const { id } = await params;
  const vibe = getVibeById(id);
  if (!vibe) return { title: "Vibe Not Found" };
  return {
    title: vibe.label,
    description: `Film stocks for ${vibe.label}.`,
  };
}

export default async function VibePage({ params }: VibePageProps) {
  const { id } = await params;
  const vibe = getVibeById(id);
  if (!vibe) notFound();

  const stocksUnsorted = await getFilmStocks({
    bestFor: vibe.bestFor.length ? vibe.bestFor : undefined,
  });
  const statsBySlug: Record<string, FilmStockStats> =
    stocksUnsorted.length > 0
      ? await getFilmStockStatsForSlugs(stocksUnsorted.map((s) => s.slug))
      : {};

  const stocks = [...stocksUnsorted].sort((a, b) => {
    const ra = statsBySlug[a.slug]?.avgRating ?? null;
    const rb = statsBySlug[b.slug]?.avgRating ?? null;
    if (ra == null && rb == null) return 0;
    if (ra == null) return 1;
    if (rb == null) return -1;
    return rb - ra;
  });

  return (
    <div className="min-h-screen bg-background">
      <SetVibeMobileHeader label={vibe.label} />
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 sm:pt-6 lg:px-8">
        {stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">No film stocks match this vibe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {stocks.map((stock, index) => (
              <FilmCard key={stock.id} stock={stock} priority={index < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
