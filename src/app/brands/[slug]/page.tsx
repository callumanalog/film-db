import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getBrandBySlug, getFilmStocksByBrand, getBrands } from "@/lib/supabase/queries";
import { ScrollToTopOnRouteChange } from "@/components/scroll-to-top";
import { SetBrandMobileHeader } from "@/components/set-brand-mobile-header";
import { BrandDetailMobileToolbar } from "@/components/brand-detail-mobile-toolbar";
import {
  BrandDetailDesktopLogoColumn,
  BrandDetailDesktopTitleBlock,
} from "@/components/brand-detail-desktop-header";
import { StockSearchRow, CameraSearchRow } from "@/components/search-result-rows";
import type { SearchCamerasResult, SearchStocksResult } from "@/app/actions/search";
import { getCameras } from "@/lib/camera-queries";
import { resolveRelatedCameraBrandSlugs } from "@/lib/film-brand-camera-brand-slugs";
import { cn } from "@/lib/utils";
import type { FilmBrand, FilmStock } from "@/lib/types";
import type { FilmCamera, CameraBrand } from "@/lib/types";

interface BrandDetailPageProps {
  params: Promise<{ slug: string }>;
}

function filmStockToSearchRow(stock: FilmStock & { brand: FilmBrand }): SearchStocksResult {
  return {
    slug: stock.slug,
    name: stock.name,
    iso: stock.iso,
    type: stock.type,
    format: stock.format,
    brandName: stock.brand.name,
    imageUrl: stock.image_url,
  };
}

function filmCameraToSearchRow(camera: FilmCamera & { brand: CameraBrand }): SearchCamerasResult {
  return {
    slug: camera.slug,
    name: camera.name,
    brandName: camera.brand?.name ?? "",
    format: (camera.format ?? []).join(", "),
  };
}

function byStockName(
  a: FilmStock & { brand: FilmBrand },
  b: FilmStock & { brand: FilmBrand },
): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export async function generateMetadata({
  params,
}: BrandDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [brand, stocks] = await Promise.all([getBrandBySlug(slug), getFilmStocksByBrand(slug)]);
  if (!brand) return { title: "Brand Not Found" };

  const description =
    brand.description?.slice(0, 155) ||
    `Browse ${stocks.length} ${brand.name} film stocks, linked cameras, and community scans.`;
  const ogImage =
    brand.logo_url?.startsWith("http") ? [{ url: brand.logo_url, alt: brand.name }] : undefined;

  return {
    title: brand.name,
    description,
    openGraph: {
      title: brand.name,
      description,
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: brand.name,
      description,
      images: ogImage?.map((i) => i.url),
    },
  };
}

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ slug: brand.slug }));
}

export default async function BrandDetailPage({ params }: BrandDetailPageProps) {
  const { slug } = await params;
  const [brand, stocks] = await Promise.all([getBrandBySlug(slug), getFilmStocksByBrand(slug)]);

  if (!brand) notFound();

  const cameraBrandSlugs = resolveRelatedCameraBrandSlugs(brand);
  const cameraBlocks = await Promise.all(
    cameraBrandSlugs.map(async (camSlug) => ({
      camSlug,
      cameras: await getCameras({ brand: camSlug }),
    })),
  );
  const allLinkedCameras = cameraBlocks.flatMap((b) => b.cameras);

  const availableStocks = stocks.filter((s) => !s.discontinued).sort(byStockName);
  const discontinuedStocks = stocks.filter((s) => s.discontinued).sort(byStockName);

  return (
    <div className="work-sans-content">
      <SetBrandMobileHeader name={brand.name} />
      <ScrollToTopOnRouteChange />
      <div className="flex flex-col items-start md:contents">
        <div
          className={cn(
            "relative z-20 mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8",
            "overflow-hidden bg-background pt-0",
            "md:overflow-visible md:rounded-none md:bg-transparent md:pt-8 md:shadow-none",
          )}
        >
          <BrandDetailMobileToolbar
            name={brand.name}
            logoUrl={brand.logo_url}
            foundedYear={brand.founded_year ?? null}
            country={brand.country ?? null}
          />

          <nav className="mb-6 hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
            <Link href="/search" className="transition-colors hover:text-foreground">
              Browse stocks
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href="/brands" className="transition-colors hover:text-foreground">
              Brands
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="font-medium text-foreground">{brand.name}</span>
          </nav>

          <Link
            href="/brands"
            className="mb-4 hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            Back to all brands
          </Link>

          <div className="grid grid-cols-1 gap-0 md:grid-cols-[auto_1fr] md:items-start md:gap-8">
            <div className="order-2 min-w-0 md:order-1 md:row-span-2">
              <BrandDetailDesktopLogoColumn name={brand.name} logoUrl={brand.logo_url} />
            </div>
            <div className="order-1 hidden min-w-0 pt-0 md:order-2 md:block md:pt-8">
              <BrandDetailDesktopTitleBlock
                name={brand.name}
                foundedYear={brand.founded_year ?? null}
                country={brand.country ?? null}
              />
            </div>
            <div className="order-3 min-w-0 pt-4 md:pt-0">
              <div className="min-w-0 space-y-8 md:space-y-10">
                {brand.description ? (
                  <section>
                    <p className="text-sm leading-relaxed text-foreground">{brand.description}</p>
                  </section>
                ) : null}

                {availableStocks.length > 0 ? (
                  <section className="space-y-3" aria-labelledby="brand-available-stocks-heading">
                    <h2 id="brand-available-stocks-heading" className="font-sans text-base font-semibold text-foreground">
                      Available film stocks
                    </h2>
                    <div className="min-w-0 divide-y divide-border/50">
                      {availableStocks.map((stock) => (
                        <StockSearchRow key={stock.id} stock={filmStockToSearchRow(stock)} hideTrailing />
                      ))}
                    </div>
                  </section>
                ) : null}

                {discontinuedStocks.length > 0 ? (
                  <section className="space-y-3" aria-labelledby="brand-discontinued-stocks-heading">
                    <h2
                      id="brand-discontinued-stocks-heading"
                      className="font-sans text-base font-semibold text-foreground"
                    >
                      Discontinued film stocks
                    </h2>
                    <div className="min-w-0 divide-y divide-border/50">
                      {discontinuedStocks.map((stock) => (
                        <StockSearchRow key={stock.id} stock={filmStockToSearchRow(stock)} hideTrailing />
                      ))}
                    </div>
                  </section>
                ) : null}

                {stocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No {brand.name} film stocks found.</p>
                ) : null}

                {allLinkedCameras.length > 0 ? (
                  <section className="space-y-3" aria-labelledby="brand-cameras-heading">
                    <h2 id="brand-cameras-heading" className="font-sans text-base font-semibold text-foreground">
                      Cameras
                    </h2>
                    <div className="min-w-0 divide-y divide-border/50">
                      {allLinkedCameras.map((camera) => (
                        <CameraSearchRow key={camera.id} camera={filmCameraToSearchRow(camera)} hideTrailing />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
