import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getFilmStockBySlug, getRelatedStocks, getFilmStocks, getMoreFromBrand } from "@/lib/supabase/queries";
import { getFilmStockStats, getFilmStockStatsForSlugs } from "@/lib/supabase/stats";
import { getFlickrSampleImagesForStock } from "@/lib/flickr";
import { SimilarStocksGrid } from "@/components/similar-stocks-grid";
import { FILM_TYPE_LABELS, FILM_TYPE_COLORS, BEST_FOR_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, SATURATION_LABELS, DEVELOPMENT_PROCESS_LABELS, COLOR_BALANCE_LABELS, COLOR_SENSITIVITY_LABELS, isBlackAndWhiteFilm } from "@/lib/types";
import type { LatitudeFilter, DevelopmentProcess } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { CommunityReviews, CommunityGallery } from "@/components/community-section";
import { StickyLeftPane, PageTitleHeader, MobileFilmHero } from "@/components/hero-mockups";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import { OverviewTabContent } from "@/components/overview-tab-content";
import { ScrollToTopOnRouteChange } from "@/components/scroll-to-top";
import { getReviewsForSlug } from "@/lib/seed-film-reviews";
import { getLoggedRollsForFilm } from "@/app/actions/user-actions";
import { LoggedRollMenu } from "@/components/logged-roll-menu";
import { SetFilmMobileHeader } from "@/components/set-film-mobile-header";

/** Display order for Where to Buy: Amazon, Adorama, Analogue Wonderland, B&H Photo. */
const RETAILER_ORDER = ["Amazon", "Adorama", "Analogue Wonderland", "B&H Photo"];

/** Always fetch fresh stats (shot by, favourites, avg rating) when the page is loaded or refreshed. */
export const dynamic = "force-dynamic";

interface FilmDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({
  params,
}: FilmDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const stock = await getFilmStockBySlug(slug);
  if (!stock) return { title: "Film Stock Not Found" };

  return {
    title: stock.name,
    description: stock.description || `Learn about ${stock.name} film stock.`,
  };
}

export async function generateStaticParams() {
  const stocks = await getFilmStocks();
  return stocks.map((stock) => ({ slug: stock.slug }));
}

export default async function FilmDetailPage({ params, searchParams }: FilmDetailPageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const stock = await getFilmStockBySlug(slug);

  if (!stock) notFound();

  const [stats, relatedStocks, moreFromBrandStocks] = await Promise.all([
    getFilmStockStats(slug),
    getRelatedStocks(stock, 6),
    getMoreFromBrand(stock, 6),
  ]);
  const typeColor = FILM_TYPE_COLORS[stock.type];

  /** Development process: from stock or derive from type (C-41, E-6, B&W). CineStill films are C-41. */
  const developmentProcessValue: DevelopmentProcess | null =
    stock.development_process ?? (stock.type === "color_negative" ? "c41" : stock.type === "color_reversal" ? "e6" : stock.type === "instant" ? "c41" : "bw");

  /** Color Balance: use color_balance text, else type+kelvin (e.g. "Daylight (5500K)"), else — */
  const colorBalanceValue: string = (() => {
    const explicit = stock.color_balance?.trim();
    if (explicit) return explicit;
    if (stock.color_balance_type && stock.color_balance_type in COLOR_BALANCE_LABELS) {
      const label = COLOR_BALANCE_LABELS[stock.color_balance_type as keyof typeof COLOR_BALANCE_LABELS];
      return stock.color_balance_kelvin != null ? `${label} (${stock.color_balance_kelvin}K)` : label;
    }
    return "—";
  })();

  /** Latitude: filter bucket label when we have latitude_level. */
  const latitudeValue: string | null =
    stock.latitude_level != null ? LATITUDE_LABELS[stock.latitude_level] : null;

  /** Saturation (color) or Color Sensitivity (B&W): display value for specs. */
  const saturationOrColorSensitivityValue: string | null =
    stock.saturation != null && stock.saturation >= 1 && stock.saturation <= 5
      ? isBlackAndWhiteFilm(stock.type)
        ? COLOR_SENSITIVITY_LABELS[stock.saturation] ?? null
        : stock.saturation_filter != null
          ? SATURATION_LABELS[stock.saturation_filter]
          : null
      : null;
  /** Label for the saturation/color-sensitivity spec row. */
  const saturationSpecLabel = isBlackAndWhiteFilm(stock.type) ? "Color Sensitivity" : "Saturation";

  /** DX coding: default true if 35mm in format. */
  const dxCoding = stock.dx_coding ?? (stock.format ?? []).includes("35mm");

  /** Release date: year only from year_introduced. */
  const releaseDateValue = stock.year_introduced != null ? String(stock.year_introduced) : "—";

  /** Build specs for overview tab:
   * Row 1: Format | Release Date
   * Row 2: Film Type | Latitude
   * Row 3: ISO | Color Balance
   * Row 4: Grain | DX Coding
   * Row 5: Contrast | Development Process
   * Row 6: Saturation or Color Sensitivity (when set) | —
   * Row 7: Use case (full width, no dividing line)
   */
  const pairedSpecsRows: { label: string; value: string }[][] = [
    [
      { label: "Format", value: (stock.format ?? []).join(", ") },
      { label: "Release Date", value: releaseDateValue },
    ],
    [
      { label: "Film Type", value: FILM_TYPE_LABELS[stock.type] },
      { label: "Latitude", value: latitudeValue ?? "—" },
    ],
    [
      { label: "ISO", value: stock.iso?.toString() ?? "" },
      { label: "Color Balance", value: colorBalanceValue },
    ],
    [
      { label: "Grain", value: GRAIN_LABELS[stock.grain_level] },
      { label: "DX Coding", value: dxCoding ? "Yes" : "No" },
    ],
    [
      { label: "Contrast", value: CONTRAST_LABELS[stock.contrast_level] },
      { label: "Development Process", value: developmentProcessValue ? DEVELOPMENT_PROCESS_LABELS[developmentProcessValue] : "—" },
    ],
    ...(saturationOrColorSensitivityValue ? [[{ label: saturationSpecLabel, value: saturationOrColorSensitivityValue }, { label: "", value: "—" }] as { label: string; value: string }[]] : []),
  ];
  const useCaseSpec: { label: string; value: string } = {
    label: "Use case",
    value: (stock.best_for ?? []).map((k) => BEST_FOR_LABELS[k]).join(", ") || "—",
  };

  /** Flat list for sticky pane (all specs in order, then filtered for "—"). */
  const overviewSpecsFlat = pairedSpecsRows.flatMap((row) => row).concat([useCaseSpec]);

  /** Specs for sticky pane: same order, omit placeholder "—". */
  const specs = overviewSpecsFlat.filter((s) => s.value != null && s.value !== "" && s.value !== "—") as { label: string; value: string }[];

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
    stats: {
      avgRating: stats.avgRating,
      shotByCount: stats.shotByCount,
      favouritesCount: stats.favouritesCount,
      shotsCount: stats.shotsCount,
    },
  };

  const allDiscoveryStocks = [
    ...relatedStocks,
    ...moreFromBrandStocks.filter((s) => !relatedStocks.some((r) => r.id === s.id)),
  ].slice(0, 8);

  const discoverySlugs = allDiscoveryStocks.map((s) => s.slug);
  const discoveryStatsBySlug = discoverySlugs.length > 0 ? await getFilmStockStatsForSlugs(discoverySlugs) : {};

  const flickrImages = await getFlickrSampleImagesForStock(slug).catch(() => []);
  const loggedRolls = await getLoggedRollsForFilm(slug);

  const { web: reviewsFromWeb, video: videoReviews } = getReviewsForSlug(slug);

  const filmTabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <OverviewTabContent
          description={stock.description}
          flickrImages={flickrImages}
          shootingNotes={stock.shooting_notes}
          reviewsFromWeb={reviewsFromWeb}
          videoReviews={videoReviews}
          purchaseLinks={sortedLinks}
          stockName={stock.name}
          bestFor={stock.best_for ?? []}
          specs={overviewSpecsFlat}
          useCaseSpec={useCaseSpec}
          characterScales={{
            grain: stock.grain ?? undefined,
            contrast: stock.contrast ?? undefined,
            saturation: stock.saturation ?? undefined,
            latitude: stock.latitude ?? undefined,
          }}
          filmType={stock.type}
        />
      ),
    },
    {
      id: "rolls",
      label: "Rolls",
      content: (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Your rolls</h2>
          <p className="text-sm text-muted-foreground">
            Rolls you&apos;ve logged for this stock (e.g. In Fridge). Log a roll from the button on this page.
          </p>
          {loggedRolls.length === 0 ? (
            <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No rolls yet. Use &quot;Log a roll&quot; above to add one and track it through the fridge, camera, processing, and beyond.
            </p>
          ) : (
            <ul className="space-y-3">
              {loggedRolls.map((roll) => (
                <li
                  key={roll.id}
                  className="rounded-[7px] border border-border/50 bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                        {roll.format && <span>Format: {roll.format}</span>}
                        {roll.status && <span>Status: {roll.status}</span>}
                        {roll.expiry_date && <span>Expiry: {roll.expiry_date}</span>}
                        {roll.quantity > 1 && <span>Qty: {roll.quantity}</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Logged {new Date(roll.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </p>
                    </div>
                    <LoggedRollMenu rollId={roll.id} filmSlug={slug} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ),
    },
    {
      id: "shots",
      label: "Shots",
      content: (
        <section>
          <CommunityGallery stockName={stock.name} slug={slug} flickrImages={flickrImages} variant="tab" />
        </section>
      ),
    },
    {
      id: "notes",
      label: "Notes",
      content: (
        <section className="space-y-10">
          <CommunityReviews slug={slug} />
        </section>
      ),
    },
  ];

  // Film stock page tabs: Overview, Rolls, Shots, Notes
  return (
    <div className="work-sans-content">
      <SetFilmMobileHeader
        name={stock.name}
        typeLabel={FILM_TYPE_LABELS[stock.type]}
        iso={stock.iso}
        format={stock.format ?? []}
      />
      <ScrollToTopOnRouteChange />
      <MobileFilmHero stock={stockProps.stock} />
      <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:hidden">
        {(FILM_TYPE_LABELS[stock.type] ?? "—").toUpperCase()} | {stock.iso != null ? `ISO ${stock.iso}` : "ISO —"} | {(stock.format ?? []).length ? (stock.format ?? []).map((f) => f.toUpperCase()).join(", ") : "—"}
      </p>
      <div className="mx-auto max-w-6xl px-4 pt-0 pb-8 sm:px-6 md:py-8 lg:px-8">
        <nav className="mb-6 hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
          <Link href="/films" className="transition-colors hover:text-foreground">Film Stocks</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/brands/${stock.brand.slug}`} className="transition-colors hover:text-foreground">{stock.brand.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{stock.name}</span>
        </nav>

        {/* Mobile: full-bleed image above; no H1; stats card + tabs. md+: Sidebar left, Title+Tabs right. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-8">
          <div className="order-2 min-w-0 md:order-1 md:row-span-2">
            <StickyLeftPane {...stockProps} />
          </div>
          <div className="order-1 hidden min-w-0 pt-0 md:order-2 md:block md:pt-8">
            <PageTitleHeader {...stockProps} />
          </div>
          <div className="order-3 min-w-0 -mt-2 md:mt-0">
            <FilmDetailTabs
              tabs={filmTabs}
              defaultId={tab === "rolls" || tab === "logged-rolls" ? "rolls" : tab === "shots" || tab === "gallery" ? "shots" : tab === "notes" || tab === "reviews" ? "notes" : "overview"}
              fullWidthTabBar
            />
          </div>
        </div>
      </div>

      {allDiscoveryStocks.length > 0 && (
        <section className="w-full border-t border-border/50 bg-secondary/30 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h3 className="mb-6 text-xl font-bold tracking-tight text-foreground">Similar stocks</h3>
            <SimilarStocksGrid stocks={allDiscoveryStocks} statsBySlug={discoveryStatsBySlug} />
          </div>
        </section>
      )}
    </div>
  );
}

