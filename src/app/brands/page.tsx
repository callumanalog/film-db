import Link from "next/link";
import type { Metadata } from "next";
import { getBrands, getFilmStocksByBrand } from "@/lib/supabase/queries";
import { ArrowRight, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Brands",
  description: "Explore film brands — Kodak, Fujifilm, Ilford, CineStill, and more.",
};

export default async function BrandsPage() {
  const brands = await getBrands();

  const brandsWithCounts = await Promise.all(
    brands.map(async (brand) => {
      const stocks = await getFilmStocksByBrand(brand.slug);
      return { ...brand, stockCount: stocks.length };
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Brands</h1>
        <p className="mt-2 text-muted-foreground">
          The manufacturers behind the world&apos;s film stocks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {brandsWithCounts.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-bold text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {brand.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {brand.name}
                  </h2>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                {brand.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {brand.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    {brand.stockCount} film stock{brand.stockCount !== 1 ? "s" : ""}
                  </span>
                  {brand.website_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                      <Globe className="h-3 w-3" />
                      {new URL(brand.website_url).hostname.replace("www.", "")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
