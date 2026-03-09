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
import { FILM_TYPE_LABELS, FILM_TYPE_COLORS } from "@/lib/types";
import Image from "next/image";
import {
  Camera,
  ArrowLeft,
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
} from "lucide-react";
import { BestForSection } from "@/components/best-for-section";
import { StarRating } from "@/components/star-rating";

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

  const specs = [
    { icon: Gauge, label: "ISO", value: stock.iso.toString() },
    { icon: ScanLine, label: "Grain", value: stock.grain },
    { icon: Contrast, label: "Contrast", value: stock.contrast },
    { icon: Target, label: "Latitude", value: stock.latitude },
    { icon: Palette, label: "Color Palette", value: stock.color_palette },
    { icon: Aperture, label: "Format", value: stock.format.join(", ") },
  ].filter((s) => s.value);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back navigation */}
      <Link
        href="/films"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all films
      </Link>

      {/* Hero */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl bg-white border border-border/50 overflow-hidden">
          {stock.image_url ? (
            <Image
              src={stock.image_url}
              alt={`${stock.brand.name} ${stock.name}`}
              width={144}
              height={144}
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <Camera className="h-14 w-14 text-muted-foreground/40" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/brands/${stock.brand.slug}`}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {stock.brand.name}
            </Link>
            {stock.discontinued && (
              <Badge variant="secondary" className="text-xs">
                Discontinued
              </Badge>
            )}
          </div>

          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {stock.name}
          </h1>

          {stock.rating > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={stock.rating} />
              <span className="text-xs text-muted-foreground">Editor Rating</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={`${typeColor} text-white border-0`}>
              {FILM_TYPE_LABELS[stock.type]}
            </Badge>
            <Badge variant="outline">ISO {stock.iso}</Badge>
            {(stock.format || []).map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
          </div>

          {stock.description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {stock.description}
            </p>
          )}
        </div>
      </div>

      <Separator className="mb-10" />

      {/* Where to Buy - high placement for affiliate visibility */}
      {stock.purchase_links.length > 0 && (
        <section className="mb-10">
          <SectionHeading icon={ShoppingBag} title="Where to Buy" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...stock.purchase_links]
              .sort(
                (a, b) =>
                  (RETAILER_ORDER.indexOf(a.retailer_name) === -1 ? 999 : RETAILER_ORDER.indexOf(a.retailer_name)) -
                  (RETAILER_ORDER.indexOf(b.retailer_name) === -1 ? 999 : RETAILER_ORDER.indexOf(b.retailer_name))
              )
              .map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {link.retailer_name}
                  </p>
                  {link.price_note && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {link.price_note}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </a>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/60">
            Links may be affiliate links. FilmDB earns a small commission at no extra cost to you, which helps keep the site running.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            Prices vary by retailer — click through for current pricing and availability.
          </p>
        </section>
      )}

      {/* Technical Specs */}
      {specs.length > 0 && (
        <section className="mb-10">
          <SectionHeading icon={Aperture} title="Technical Specs" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <spec.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {spec.label}
                  </span>
                </div>
                <p className="text-sm font-medium">{spec.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best for */}
      {stock.best_for?.length > 0 && (
        <BestForSection items={stock.best_for} />
      )}

      {/* History */}
      {stock.history && (
        <section className="mb-10">
          <SectionHeading icon={BookOpen} title="History" />
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
              {stock.history}
            </p>
          </div>
        </section>
      )}

      {/* Shooting Tips */}
      {stock.shooting_tips && (
        <section className="mb-10">
          <SectionHeading icon={Lightbulb} title="Shooting Tips" />
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <p className="leading-relaxed text-foreground/80 whitespace-pre-line">
              {stock.shooting_tips}
            </p>
          </div>
        </section>
      )}

      {/* Sample Images */}
      {stock.sample_images.length > 0 && (
        <section className="mb-10">
          <SectionHeading icon={Camera} title="Sample Images" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stock.sample_images.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-xl border border-border/50"
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
      <section className="mb-10">
        <SectionHeading icon={Camera} title="Sample Images" />
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
          <Camera className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Community sample images coming soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Users will be able to upload their own shots taken on {stock.name}
          </p>
        </div>
      </section>

      {/* Community placeholder */}
      <section className="mb-10">
        <SectionHeading icon={Camera} title="Sample Images" />
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
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
        <section className="mb-10">
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            Similar Film Stocks
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {relatedStocks.map((related) => (
              <FilmCard key={related.id} stock={related} />
            ))}
          </div>
        </section>
      )}

      {/* More from [Brand] */}
      {moreFromBrandStocks.length > 0 && (
        <section className="mb-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {moreFromBrandStocks.map((s) => (
              <FilmCard key={s.id} stock={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}
