import { notFound } from "next/navigation";
import { getFilmStockBySlug } from "@/lib/supabase/queries";
import { fetchStockListsForFilmPage } from "@/app/actions/stock-lists";
import { FilmStockListsAllClient } from "./film-stock-lists-all-client";

type Props = { params: Promise<{ slug: string }> };

export default async function FilmStockListsAllPage({ params }: Props) {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) notFound();

  const rows = await fetchStockListsForFilmPage(slug, 200);

  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden px-0 pt-0 pb-8 sm:px-6 lg:px-8 md:flex-none md:pb-8">
      <FilmStockListsAllClient filmSlug={slug} stockName={stock.name} rows={rows} />
    </div>
  );
}
