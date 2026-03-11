import type { Metadata } from "next";
import { getFilmStocks } from "@/lib/supabase/queries";
import { getGalleryImages } from "@/lib/sample-images";
import { GalleryGrid, type StockOption } from "@/components/gallery-grid";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Browse community references by film stock and brand. Filter by brand, stock, source, and sort by newest or most liked.",
};

interface CommunityPageProps {
  searchParams: Promise<{ stock?: string | string[] }>;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const stockParam = params.stock;
  const initialStockSlugs = Array.isArray(stockParam)
    ? stockParam
    : stockParam
      ? [stockParam]
      : [];

  const stocks = await getFilmStocks();
  const images = getGalleryImages(stocks);

  const brands = [...new Set(stocks.map((s) => s.brand.name))].sort();
  const stockOptions: StockOption[] = stocks.map((s) => ({
    slug: s.slug,
    name: `${s.brand.name} ${s.name}`,
    brandName: s.brand.name,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Community</h1>
        <p className="mt-2 text-muted-foreground">
          References from the community. Filter by brand and stock to find shots from a specific film.
        </p>
      </header>

      <GalleryGrid
        images={images}
        brands={brands}
        stocks={stockOptions}
        initialSelectedStockSlugs={initialStockSlugs}
      />
    </div>
  );
}
