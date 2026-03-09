import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getFilmStockBySlug,
  getRelatedStocks,
  getFilmStocks,
  getMoreFromBrand,
} from "@/lib/supabase/queries";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FilmCard } from "@/components/film-card";
import { FILM_TYPE_LABELS, FILM_TYPE_COLORS, BEST_FOR_LABELS, type BestFor } from "@/lib/types";
import Image from "next/image";
import {
  Camera,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  BookOpen,
  ShoppingBag,
  Aperture,
  Gauge,
  Palette,
  Contrast,
  Target,
  ScanLine,
  Grid2x2,
  Building2,
  Film,
  Users,
} from "lucide-react";
import { BestForSection } from "@/components/best-for-section";
import { ExpandableText, InlineExpandableText } from "@/components/expandable-text";
import { StarRating } from "@/components/star-rating";
import { CommunitySection, CommunityReviews, CommunityGallery, QuickActions } from "@/components/community-section";
import { StickyLeftPane, PageTitleHeader, PriceBuyCard, SpecsRightPane } from "@/components/hero-mockups";
import { FilmPageNav } from "@/components/film-page-tabs";

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

  const specs = slug === "cinestill-800t"
    ? [
        { label: "Film Format", value: "35mm" },
        { label: "Film Colour & Type", value: "Colour Negative (C-41)" },
        { label: "ISO", value: "800" },
        { label: "Grain", value: "Normal and Fine" },
        { label: "Contrast", value: "High" },
        { label: "Colour Balance", value: "Tungsten-Balanced Film (\u2248\u00A03200K)" },
        { label: "Exposure Latitude", value: "Wide / Very Wide Latitude" },
        { label: "DX Coding", value: "Yes" },
        { label: "Film Development Process", value: "Colour (C-41)" },
      ]
    : [
        { label: "Film Format", value: stock.format.join(", ") },
        { label: "Film Type", value: FILM_TYPE_LABELS[stock.type] },
        { label: "ISO", value: stock.iso.toString() },
        { label: "Grain", value: stock.grain },
        { label: "Contrast", value: stock.contrast },
        { label: "Color Palette", value: stock.color_palette },
        { label: "Latitude", value: stock.latitude },
      ].filter((s) => s.value) as { label: string; value: string }[];

  const sortedLinks = [...stock.purchase_links].sort(
    (a, b) =>
      (RETAILER_ORDER.indexOf(a.retailer_name) === -1 ? 999 : RETAILER_ORDER.indexOf(a.retailer_name)) -
      (RETAILER_ORDER.indexOf(b.retailer_name) === -1 ? 999 : RETAILER_ORDER.indexOf(b.retailer_name))
  );

  const stockProps = {
    stock: {
      name: stock.name,
      brand: stock.brand,
      type: stock.type,
      typeLabel: FILM_TYPE_LABELS[stock.type],
      typeColor: typeColor,
      iso: stock.iso,
      format: stock.format,
      image_url: stock.image_url,
      description: stock.description,
      discontinued: stock.discontinued,
      price_tier: stock.price_tier,
      base_price_usd: stock.base_price_usd,
      purchase_links: sortedLinks,
      specs: specs.map(({ label, value }) => ({ label, value })),
      best_for: (stock.best_for ?? []).map((k: string) => BEST_FOR_LABELS[k as BestFor] ?? k),
    },
  };

  const allDiscoveryStocks = [
    ...relatedStocks,
    ...moreFromBrandStocks.filter((s) => !relatedStocks.some((r) => r.id === s.id)),
  ].slice(0, 8);

  const cinestillContent = (
    <>
      {/* Description now renders inside PageTitleHeader with float-right actions panel */}

      {/* Gallery */}
      <section className="mb-10">
        <CommunityGallery stockName={stock.name} />
      </section>

      {/* Shooting Tips + Best For */}
      {(stock.shooting_tips || stock.best_for?.length > 0) && (
        <section className="mb-10 rounded-xl border border-border/50 bg-card p-5">
          {stock.shooting_tips && (
            <>
              <SectionHeading title="Shooting Tips" />
              <ul className="mt-1 space-y-2">
                {stock.shooting_tips
                  .split(/\.\s+/)
                  .filter((s) => s.trim().length > 0)
                  .map((tip, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                      {tip.endsWith(".") ? tip : `${tip}.`}
                    </li>
                  ))}
              </ul>
            </>
          )}
          {stock.best_for?.length > 0 && (
            <div className={stock.shooting_tips ? "mt-5 border-t border-border/50 pt-4" : ""}>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best for</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {stockProps.stock.best_for?.map((label) => (
                  <span key={label} className="rounded-lg bg-[#e5e5e5] px-3 py-1 text-xs font-medium text-[#444] dark:bg-[#333] dark:text-[#aaa]">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Reviews */}
      <section className="mb-10">
        <CommunityReviews />
      </section>

    </>
  );

  const mainContent = (
    <>
      {/* Where to Buy */}
      {stock.purchase_links.length > 0 && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5" />
              Buy:
            </span>
            {sortedLinks.map((link, i) => (
              <span key={link.id} className="flex items-center">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/70"
                >
                  {link.retailer_name}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {i < sortedLinks.length - 1 && (
                  <span className="ml-2 text-border">·</span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Technical Specs */}
      {specs.length > 0 && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <SectionHeading title="Specs" />
          <div className="divide-y divide-border/50">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {spec.label}
                </span>
                <span className="text-sm font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {stock.description && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <SectionHeading title="About" />
          <p className="leading-relaxed text-muted-foreground">{stock.description}</p>
        </section>
      )}

      {/* Best for */}
      {stock.best_for?.length > 0 && (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <BestForSection items={stock.best_for} />
        </div>
      )}

      {/* History */}
      {stock.history && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <SectionHeading title="History" />
          <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
            {stock.history}
          </p>
        </section>
      )}

      {/* Shooting Tips */}
      {stock.shooting_tips && (
        <section className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <SectionHeading title="Shooting Tips" />
          <p className="leading-relaxed text-foreground/80 whitespace-pre-line">
            {stock.shooting_tips}
          </p>
        </section>
      )}

      {/* Sample Images */}
      {stock.sample_images.length > 0 && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <SectionHeading title="Sample Images" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {stock.sample_images.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-lg border border-border/50"
              >
                <div className="aspect-[4/3] bg-muted" />
                {(img.caption || img.camera_used) && (
                  <div className="p-3">
                    {img.caption && (
                      <p className="text-sm">{img.caption}</p>
                    )}
                    {img.camera_used && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Shot on {img.camera_used}
                        {img.lens_used && ` with ${img.lens_used}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Community placeholder */}
      <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
        <SectionHeading title="Community" />
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border py-10 text-center">
          <Camera className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Community sample images coming soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Users will be able to upload their own shots taken on {stock.name}
          </p>
        </div>
      </section>

      {/* Related Stocks */}
      {relatedStocks.length > 0 && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-4 text-xl font-bold tracking-tight">
            Similar Film Stocks
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {relatedStocks.map((related) => (
              <FilmCard key={related.id} stock={related} />
            ))}
          </div>
        </section>
      )}

      {/* More from [Brand] */}
      {moreFromBrandStocks.length > 0 && (
        <section className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              More from {stock.brand.name}
            </h2>
            <Link
              href={`/brands/${stock.brand.slug}`}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all {stock.brand.name} films
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {moreFromBrandStocks.map((s) => (
              <FilmCard key={s.id} stock={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );

  if (slug === "cinestill-800t") {
    return (
      <>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/films" className="transition-colors hover:text-foreground">Film Stocks</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/brands/${stock.brand.slug}`} className="transition-colors hover:text-foreground">{stock.brand.name}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{stock.name}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <StickyLeftPane {...stockProps} />
            <div className="min-w-0 flex-1">
              <div className="flex gap-8">
                <div className="min-w-0 flex-1">
                  <PageTitleHeader {...stockProps} />
                  {cinestillContent}
                </div>
                <div className="hidden w-52 shrink-0 self-start lg:block">
                  <SpecsRightPane specs={stockProps.stock.specs ?? []} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {allDiscoveryStocks.length > 0 && (
          <section className="border-t border-border/50 bg-secondary/30 py-12">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">You might also like</h2>
                <Link
                  href={`/brands/${stock.brand.slug}`}
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  View all {stock.brand.name} films
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {allDiscoveryStocks.map((s) => (
                  <FilmCard key={s.id} stock={s} />
                ))}
              </div>
            </div>
          </section>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/films" className="transition-colors hover:text-foreground">Film Stocks</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/brands/${stock.brand.slug}`} className="transition-colors hover:text-foreground">{stock.brand.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{stock.name}</span>
      </nav>

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="shrink-0 rounded-2xl border border-border/50 bg-card p-5 sm:w-64">
          <div className="flex h-40 items-center justify-center overflow-hidden">
            {stock.image_url ? (
              <Image
                src={stock.image_url}
                alt={`${stock.brand.name} ${stock.name}`}
                width={160}
                height={160}
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <Camera className="h-14 w-14 text-muted-foreground/40" />
            )}
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">
            {stock.brand.name} {stock.name}
          </h1>
          {stock.discontinued && (
            <Badge variant="secondary" className="mt-1.5 text-xs">
              Discontinued
            </Badge>
          )}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="flex items-center gap-2">
              <Grid2x2 className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs font-medium">{FILM_TYPE_LABELS[stock.type]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground/50" />
              <Link
                href={`/brands/${stock.brand.slug}`}
                className="text-xs font-medium transition-colors hover:text-primary"
              >
                {stock.brand.name}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs font-medium">{stock.format.join(", ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-xs font-medium">ISO {stock.iso}</span>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {stock.description && (
            <>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">Description</h2>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                {stock.description}
              </p>
            </>
          )}
        </div>
      </div>

      {mainContent}
    </div>
  );
}

function SectionHeading({
  title,
}: {
  icon?: React.ElementType;
  title: string;
}) {
  return (
    <h2 className="mb-4 text-xl font-bold tracking-tight">{title}</h2>
  );
}
