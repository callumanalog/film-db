import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getBrandBySlug,
  getFilmStocksByBrand,
  getBrands,
  getFilmStocks,
} from "@/lib/supabase/queries";
import type { FilmStockStats } from "@/lib/supabase/stats";
import { getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { FilmGrid } from "@/components/film-grid";
import { ChevronRight } from "lucide-react";
import { ScrollToTopOnRouteChange } from "@/components/scroll-to-top";
import { BrandDetailHero } from "@/components/brand-detail-hero";
import { BrandCommunityRail } from "@/components/brand-community-rail";
import { getAllCommunityUploadsForGallery } from "@/app/actions/uploads";
import { getCameras } from "@/lib/camera-queries";
import { CameraGrid } from "@/components/camera-grid";
import { resolveRelatedCameraBrandSlugs } from "@/lib/film-brand-camera-brand-slugs";
import { cn } from "@/lib/utils";

interface BrandDetailPageProps {
  params: Promise<{ slug: string }>;
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
  const [brand, stocks, allFilmStocks] = await Promise.all([
    getBrandBySlug(slug),
    getFilmStocksByBrand(slug),
    getFilmStocks({ sort: "alphabetical" }),
  ]);

  if (!brand) notFound();

  const cameraBrandSlugs = resolveRelatedCameraBrandSlugs(brand);
  const cameraBlocks = await Promise.all(
    cameraBrandSlugs.map(async (camSlug) => ({
      camSlug,
      cameras: await getCameras({ brand: camSlug }),
    }))
  );
  const allLinkedCameras = cameraBlocks.flatMap((b) => b.cameras);
  const cameraModelCount = allLinkedCameras.length;

  const stockSlugs = stocks.map((s) => s.slug);
  const [statsBySlug, communityUploads] = await Promise.all([
    stockSlugs.length > 0
      ? getFilmStockStatsForSlugs(stockSlugs)
      : Promise.resolve({} as Record<string, FilmStockStats>),
    stockSlugs.length > 0
      ? getAllCommunityUploadsForGallery(allFilmStocks, undefined, stockSlugs)
      : Promise.resolve([]),
  ]);

  const communityScanCount = Object.values(statsBySlug).reduce(
    (sum, row: FilmStockStats) => sum + (row.shotsCount ?? 0),
    0,
  );
  const railUploads = communityUploads.filter((u) => u.imageUrl).slice(0, 24);

  return (
    <div className="work-sans-content">
      <ScrollToTopOnRouteChange />
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-0 sm:px-6 md:pb-8 lg:px-8",
          "md:pt-8",
        )}
      >
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

        <BrandDetailHero
          name={brand.name}
          logoUrl={brand.logo_url}
          description={brand.description}
          websiteUrl={brand.website_url}
          stockCount={stocks.length}
          communityScanCount={communityScanCount}
          cameraModelCount={cameraModelCount}
        />

        {railUploads.length > 0 ? (
          <section className="mt-10 border-t border-border/40 pt-8 md:mt-12">
            <BrandCommunityRail brandSlug={slug} uploads={railUploads} />
          </section>
        ) : null}

        {allLinkedCameras.length > 0 ? (
          <section className="mt-10 border-t border-border/40 pt-8 md:mt-12">
            <h2 className="font-sans text-base font-semibold text-foreground">Cameras</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Film cameras in our catalog for {brand.name}.{" "}
              <Link href="/cameras" className="font-medium text-primary hover:underline">
                Browse all cameras
              </Link>
            </p>
            <div className="mt-6">
              <CameraGrid cameras={allLinkedCameras} emptyMessage="No cameras listed." />
            </div>
          </section>
        ) : null}

        <section className="mt-10 border-t border-border/40 pt-8 md:mt-12">
          <h2 className="font-sans text-base font-semibold text-foreground">Film stocks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every {brand.name} stock we currently list.
          </p>
          <div className="mt-6">
            <FilmGrid stocks={stocks} emptyMessage={`No ${brand.name} film stocks found.`} />
          </div>
        </section>
      </div>
    </div>
  );
}
