import type { Metadata } from "next";
import { getFilmStocks } from "@/lib/supabase/queries";
import { getAllCommunityUploadsForGallery } from "@/app/actions/uploads";
import { GalleryGrid, type StockOption } from "@/components/gallery-grid";
import { DiscoverMobileSection } from "@/components/discover-mobile-section";
import type { GalleryImage } from "@/lib/sample-images";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Images from the community. Browse uploads by film stock and brand.",
};

export default async function DiscoverPage() {
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const realUploads = await getAllCommunityUploadsForGallery(stocks);
  const uploadsAsGalleryImages: GalleryImage[] = realUploads
    .filter((u): u is typeof u & { imageUrl: string } => u.imageUrl != null)
    .map((u) => ({ ...u, imageUrl: u.imageUrl, uploadId: u.id }));
  const images: GalleryImage[] = uploadsAsGalleryImages;

  const brands = [...new Set(stocks.map((s) => s.brand.name))].sort();
  const stockOptions: StockOption[] = stocks.map((s) => ({
    slug: s.slug,
    name: s.name,
    brandName: s.brand.name,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-0 pb-24 sm:px-6 md:pb-8">
      <header className="mb-6 hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight font-sans">Discover</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Community uploads from across the database.
        </p>
      </header>

      {images.length === 0 ? (
        <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No uploads yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload shots from a film stock page to see them here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: feed + filters driven by header URL params + sheet */}
          <DiscoverMobileSection images={images} brands={brands} />
          {/* Desktop: filters + grid */}
          <div className="hidden md:block">
            <GalleryGrid
              images={images}
              brands={brands}
              stocks={stockOptions}
              initialSelectedStockSlugs={[]}
            />
          </div>
        </>
      )}
    </div>
  );
}
