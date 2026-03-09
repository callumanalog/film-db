import Link from "next/link";
import { ArrowRight, Film, BookOpen, ShoppingBag, Users } from "lucide-react";
import { getTopBrands, getTopRatedFilmStocks } from "@/lib/supabase/queries";
import { FilmCard } from "@/components/film-card";
import { SearchBar } from "@/components/search-bar";
import { FILM_TYPE_LABELS } from "@/lib/types";
import type { FilmType } from "@/lib/types";

const FEATURES = [
  {
    icon: Film,
    title: "Every Film Stock",
    description: "Comprehensive database covering color negative, slide, black & white, and instant films from all major manufacturers.",
  },
  {
    icon: BookOpen,
    title: "History & Tips",
    description: "Learn the story behind each emulsion and get practical shooting advice from metering to push processing.",
  },
  {
    icon: ShoppingBag,
    title: "Where to Buy",
    description: "Find current retailers and pricing for every film stock, with links to trusted shops worldwide.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Coming soon: upload sample images, track your rolls, and find labs near you.",
  },
];

const FILM_TYPES: { type: FilmType; description: string }[] = [
  { type: "color_negative", description: "The most popular and forgiving type. Produces negatives processed in C-41 chemistry." },
  { type: "color_reversal", description: "Slide film with vivid colors and narrow exposure latitude. Processed in E-6." },
  { type: "bw_negative", description: "Classic monochrome photography. Many can be developed at home." },
];

export default async function HomePage() {
  const [topRatedStocks, topBrands] = await Promise.all([
    getTopRatedFilmStocks(),
    getTopBrands(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8 lg:pt-40">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-advercase">
              Your Ultimate{" "}
              <span className="text-primary">Film Photography</span>{" "}
              Database
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Explore every film stock ever made. Learn the history, get shooting tips,
              find where to buy, and see sample images — all in one place.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <SearchBar
                size="lg"
                placeholder="Search film stocks — try 'Portra', 'Tri-X', or 'slide film'..."
                className="w-full max-w-xl"
              />
              <div className="flex items-center gap-4">
                <Link
                  href="/films"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Browse All Films
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/brands"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  View Brands
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Film Stocks — carousel */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-advercase">
              Top Rated Film Stocks
            </h2>
            <p className="mt-2 text-muted-foreground">
              Community favourites and iconic emulsions.
            </p>
          </div>
          <Link
            href="/films"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:inline-flex"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative -mx-4 sm:mx-0">
          <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth px-4 sm:px-0 sm:gap-4 [scroll-snap-type:x_mandatory] [&>*]:scroll-snap-align-start">
            {topRatedStocks.map((stock) => (
            <div
              key={stock.id}
              className="w-[72%] min-w-[170px] max-w-[220px] shrink-0 sm:min-w-[190px] lg:max-w-[240px]"
            >
                <FilmCard stock={stock} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/films"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            View all film stocks
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Film Types */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl font-advercase">
            Explore by Type
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {FILM_TYPES.map(({ type, description }) => (
              <Link
                key={type}
                href={`/films?type=${type}`}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {FILM_TYPE_LABELS[type]}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Browse
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl font-advercase">
          Shop by Brand
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {topBrands.map((brand) => (
            <a
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-card p-4 sm:p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={`${brand.name} — view film stocks`}
                  className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-2xl font-bold text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {brand.name.charAt(0)}
                </div>
              )}
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:border-primary/30"
          >
            View all brands
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl font-advercase">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/50 bg-card p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
