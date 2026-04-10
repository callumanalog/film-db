import { notFound } from "next/navigation";
import { getFilmStockBySlug } from "@/lib/supabase/queries";
import { ReviewsTabContent } from "@/components/reviews-tab-content";

type Props = { params: Promise<{ slug: string }> };

export default async function FilmStockReviewsPage({ params }: Props) {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) notFound();

  const reviewFilmStock = {
    slug: stock.slug,
    name: stock.name,
    format: stock.format ?? [],
    image_url: stock.image_url ?? null,
    brand: { name: stock.brand.name, slug: stock.brand.slug },
    iso: stock.iso,
  };

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden px-4 pt-4 pb-8 sm:px-6 lg:px-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{stock.name} Reviews</h1>
      </header>
      <ReviewsTabContent slug={slug} filmStock={reviewFilmStock} />
    </div>
  );
}
