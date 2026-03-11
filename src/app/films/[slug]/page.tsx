import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getFilmStockBySlug, getRelatedStocks, getFilmStocks, getMoreFromBrand } from "@/lib/supabase/queries";
import { getFlickrSampleImagesForStock } from "@/lib/flickr";
import { FilmCard } from "@/components/film-card";
import { FILM_TYPE_LABELS, FILM_TYPE_COLORS, BEST_FOR_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, DEVELOPMENT_PROCESS_LABELS, COLOR_BALANCE_LABELS } from "@/lib/types";
import type { LatitudeLevel, DevelopmentProcess, ColorBalanceType } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { CommunityReviews, CommunityGallery } from "@/components/community-section";
import { StickyLeftPane, PageTitleHeader } from "@/components/hero-mockups";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import { OverviewTabContent } from "@/components/overview-tab-content";
import { reviewsFromWebBySlug, videoReviewsBySlug } from "@/lib/seed-film-reviews";

/** Display order for Where to Buy: Amazon, Adorama, Analogue Wonderland, B&H Photo. */
const RETAILER_ORDER = ["Amazon", "Adorama", "Analogue Wonderland", "B&H Photo"];

interface FilmDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: FilmDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) return { title: "Film Stock Not Found" };

  return {
    title: `${stock.brand.name} ${stock.name}`,
    description: stock.description || `Learn about ${stock.brand.name} ${stock.name} film stock.`,
  };
}

export async function generateStaticParams() {
  const stocks = await getFilmStocks();
  return stocks.map((stock) => ({ slug: stock.slug }));
}

export default async function FilmDetailPage({ params }: FilmDetailPageProps) {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);

  if (!stock) notFound();

  const relatedStocks = await getRelatedStocks(stock, 6);
  const moreFromBrandStocks = await getMoreFromBrand(stock, 6);
  const typeColor = FILM_TYPE_COLORS[stock.type];

  /** Development process: from stock or derive from type (C-41, E-6, B&W). CineStill films are C-41. */
  const developmentProcessValue: DevelopmentProcess | null =
    stock.development_process ?? (stock.type === "color_negative" ? "c41" : stock.type === "color_reversal" ? "e6" : stock.type === "instant" ? "c41" : "bw");

  /** Color Balance: only for color films; show "X-Balanced (≈xxxxK)". B&W has no color balance — omit. */
  const colorBalanceValue: string | null =
    (stock.type !== "bw_negative" && stock.type !== "bw_reversal" &&
      stock.color_balance_type != null &&
      stock.color_balance_kelvin != null)
      ? `${COLOR_BALANCE_LABELS[stock.color_balance_type as ColorBalanceType]}-Balanced (≈${stock.color_balance_kelvin}K)`
      : null;

  /** Latitude: only one of the 5 categories when we have latitude_level; otherwise omit. */
  const latitudeValue: string | null =
    stock.latitude_level != null ? LATITUDE_LABELS[stock.latitude_level as LatitudeLevel] : null;

  /** DX coding: default true if 35mm in format. */
  const dxCoding = stock.dx_coding ?? (stock.format ?? []).includes("35mm");

  /** Build specs in display order:
   * Row 1: Film Format | Use case
   * Row 2: Film Type | Latitude
   * Row 3: ISO | Color Balance
   * Row 4: Grain | DX Coding
   * Row 5: Contrast | Development Process
   */
  const leftCol: { label: string; value: string }[] = [
    { label: "Film Format", value: (stock.format ?? []).join(", ") },
    { label: "Film Type", value: FILM_TYPE_LABELS[stock.type] },
    { label: "ISO", value: stock.iso?.toString() ?? "" },
    { label: "Grain", value: GRAIN_LABELS[stock.grain_level] },
    { label: "Contrast", value: CONTRAST_LABELS[stock.contrast_level] },
  ];
  const rightCol: { label: string; value: string }[] = [
    { label: "Use case", value: (stock.best_for ?? []).map((k) => BEST_FOR_LABELS[k]).join(", ") },
    { label: "Latitude", value: latitudeValue ?? "—" },
    { label: "Color Balance", value: colorBalanceValue ?? "—" },
    { label: "DX Coding", value: dxCoding ? "Yes" : "No" },
    { label: "Development Process", value: developmentProcessValue ? DEVELOPMENT_PROCESS_LABELS[developmentProcessValue] : "—" },
  ];
  /** Interleave for grid: row i = leftCol[i] | rightCol[i]. */
  const overviewSpecs = leftCol.flatMap((l, i) => [l, rightCol[i]]);

  /** Specs for sticky pane: same row order as overview, omit placeholder "—". */
  const specs = overviewSpecs.filter((s) => s.value != null && s.value !== "" && s.value !== "—") as { label: string; value: string }[];

  const purchaseLinks = stock.purchase_links ?? [];
  const sortedLinks = [...purchaseLinks].sort(
    (a, b) =>
      (RETAILER_ORDER.indexOf(a.retailer_name) === -1 ? 999 : RETAILER_ORDER.indexOf(a.retailer_name)) -
      (RETAILER_ORDER.indexOf(b.retailer_name) === -1 ? 999 : RETAILER_ORDER.indexOf(b.retailer_name))
  );

  const stockProps = {
    stock: {
      slug,
      name: stock.name,
      brand: stock.brand,
      type: stock.type,
      typeLabel: FILM_TYPE_LABELS[stock.type],
      typeColor: typeColor,
      iso: stock.iso,
      format: stock.format ?? [],
      image_url: stock.image_url,
      description: stock.description,
      discontinued: stock.discontinued,
      price_tier: stock.price_tier,
      base_price_usd: stock.base_price_usd,
      purchase_links: sortedLinks,
      specs: specs.map(({ label, value }) => ({ label, value })),
      best_for: stock.best_for ?? [],
    },
  };

  const allDiscoveryStocks = [
    ...relatedStocks,
    ...moreFromBrandStocks.filter((s) => !relatedStocks.some((r) => r.id === s.id)),
  ].slice(0, 8);

  const flickrImages = await getFlickrSampleImagesForStock(slug).catch(() => []);

  const reviewsFromWeb = reviewsFromWebBySlug[slug] ?? [];
  const videoReviews = videoReviewsBySlug[slug] ?? [];

  const filmTabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <OverviewTabContent
          description={stock.description}
          flickrImages={flickrImages}
          shootingTips={stock.shooting_tips}
          reviewsFromWeb={reviewsFromWeb}
          videoReviews={videoReviews}
          purchaseLinks={sortedLinks}
          stockName={`${stock.brand.name} ${stock.name}`}
          bestFor={stock.best_for ?? []}
          specs={overviewSpecs}
        />
      ),
    },
    {
      id: "gallery",
      label: "Example images",
      content: (
        <section>
          <CommunityGallery stockName={stock.name} slug={slug} flickrImages={flickrImages} variant="tab" />
        </section>
      ),
    },
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <section className="space-y-10">
          <CommunityReviews />
        </section>
      ),
    },
  ];

  // All film stocks use the same template: sticky left pane + tabs (Overview, Example images, Reviews)
  return (
    <div className="work-sans-content">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/films" className="transition-colors hover:text-foreground">Film Stocks</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/brands/${stock.brand.slug}`} className="transition-colors hover:text-foreground">{stock.brand.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{stock.name}</span>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <StickyLeftPane {...stockProps} />
          <div className="min-w-0 flex-1 pt-6 sm:pt-8">
            <PageTitleHeader {...stockProps} />
            <div className="min-w-0">
              <FilmDetailTabs
                tabs={filmTabs}
                defaultId="overview"
                fullWidthTabBar
              />
            </div>
          </div>
        </div>
      </div>

      {allDiscoveryStocks.length > 0 && (
        <section className="w-full border-t border-border/50 bg-secondary/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h3 className="mb-6 text-xl font-bold tracking-tight text-foreground">Similar stocks</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {allDiscoveryStocks.map((s) => (
                <FilmCard key={s.id} stock={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

