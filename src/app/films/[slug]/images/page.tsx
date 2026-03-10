import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFilmStockBySlug, getFilmStocks } from "@/lib/supabase/queries";
import { getSampleImagesForPage } from "@/lib/sample-images";
import { SampleImagesGrid } from "@/components/sample-images-grid";

interface FilmImagesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: FilmImagesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) return { title: "Film Stock Not Found" };
  return {
    title: `${stock.brand.name} ${stock.name} — References`,
    description: `References shot on ${stock.brand.name} ${stock.name}, from Flickr and community.`,
  };
}

export async function generateStaticParams() {
  const stocks = await getFilmStocks();
  return stocks.map((stock) => ({ slug: stock.slug }));
}

export default async function FilmSampleImagesPage({ params }: FilmImagesPageProps) {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) notFound();

  const images = getSampleImagesForPage(slug);
  const stockDisplayName = `${stock.brand.name} ${stock.name}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {stockDisplayName} — References
        </h1>
        <p className="mt-2 text-muted-foreground">
          References tagged with this film on Flickr and from community reviews.
        </p>
      </header>

      <SampleImagesGrid
        images={images}
        stockDisplayName={stockDisplayName}
        slug={slug}
      />
    </div>
  );
}
