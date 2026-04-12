import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ImageDestinationScansClient } from "@/components/image-destination-scans-client";
import { filmStockToLightboxSummary } from "@/lib/lightbox-group";
import { getFilmStockBySlug, getFilmStocks } from "@/lib/supabase/queries";
import { getUploadsForFilmStock } from "@/app/actions/uploads";
import { SetImageDestinationMobileHeader } from "@/components/set-image-destination-mobile-header";

interface FilmImageDestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: FilmImageDestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) return { title: "Images Not Found" };
  return {
    title: `${stock.name} Images`,
    description: `All uploaded images shot on ${stock.name}.`,
  };
}

export async function generateStaticParams() {
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  return stocks.map((stock) => ({ slug: stock.slug }));
}

export default async function FilmImageDestinationPage({ params }: FilmImageDestinationPageProps) {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) notFound();

  const uploads = await getUploadsForFilmStock(slug);
  const scanCount = uploads.filter((u) => !!u.image_url).length;
  const scanCountLabel = `${scanCount.toLocaleString()} SCAN${scanCount === 1 ? "" : "S"}`;
  const stockSummary = filmStockToLightboxSummary(stock);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-8">
      <SetImageDestinationMobileHeader
        title={stock.name}
        filmSlug={stock.slug}
        observeElementId="image-destination-stock-title"
      />
      <header id="image-destination-stock-header" className="rounded-md bg-card py-3">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-white">
            {stock.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stock.image_url} alt="" className="h-full w-full object-contain" width={64} height={64} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                {stock.brand?.name?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <p
                id="image-destination-stock-title"
                className="truncate font-sans text-base font-semibold text-foreground"
              >
                {stock.name}
              </p>
            </div>
            <p className="mt-1 truncate font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {scanCountLabel}
            </p>
          </div>
        </div>
      </header>

      {scanCount > 0 ? (
        <div className="min-w-0 -mx-4 mt-2 w-[calc(100%+2rem)]">
          <ImageDestinationScansClient
            uploads={uploads}
            mode="film"
            stockName={stock.name}
            stockSlug={stock.slug}
            stockSummary={stockSummary}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-[7px] border border-dashed border-border bg-secondary/20 py-10 text-center text-sm text-muted-foreground">
          No uploaded images for this film stock yet.
        </div>
      )}
    </div>
  );
}
