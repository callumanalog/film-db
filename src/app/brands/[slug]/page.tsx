import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getBrandBySlug,
  getFilmStocksByBrand,
  getBrands,
} from "@/lib/supabase/queries";
import { FilmGrid } from "@/components/film-grid";
import { ArrowLeft, Globe, ExternalLink } from "lucide-react";

interface BrandDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };

  return {
    title: brand.name,
    description: brand.description || `Browse all ${brand.name} film stocks.`,
  };
}

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ slug: brand.slug }));
}

export default async function BrandDetailPage({
  params,
}: BrandDetailPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) notFound();

  const stocks = await getFilmStocksByBrand(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/brands"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all brands
      </Link>

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl font-bold text-foreground">
          {brand.name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {brand.name}
          </h1>

          {brand.description && (
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              {brand.description}
            </p>
          )}

          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-primary/80"
            >
              <Globe className="h-3.5 w-3.5" />
              {new URL(brand.website_url).hostname.replace("www.", "")}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <p className="mt-3 text-sm text-muted-foreground">
            {stocks.length} film stock{stocks.length !== 1 ? "s" : ""} in our database
          </p>
        </div>
      </div>

      <FilmGrid
        stocks={stocks}
        emptyMessage={`No ${brand.name} film stocks found.`}
      />
    </div>
  );
}
