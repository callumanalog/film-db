import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE_NAME} — film stocks, community, and analog photography.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About {SITE_NAME}</h1>
      </div>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p className="text-lg text-foreground">
          {SITE_NAME} is a database and community for analog film photography — film stocks, references,
          reviews, and discovery in one place.
        </p>

        <p>
          Whether you&apos;re chasing technical specs or choosing your first roll, we bring together
          descriptions, shooting context, purchase links, community uploads, and ratings so you can decide
          what to load next.
        </p>

        <p>
          Film photography has had a remarkable renaissance. {SITE_NAME} exists so that enthusiasm has a
          dedicated home: not a scattered thread or one-off blog, but a shared reference built with the
          community.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">What you can do today</h2>

        <ul className="list-inside space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-foreground">Browse &amp; filter</strong> — Explore stocks, brands,
              cameras, and discovery vibes.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-foreground">Community</strong> — Upload references, read reviews, and
              see what others shot on each stock.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-foreground">Your profile</strong> — Track shot stocks, favourites,
              ratings, and in-camera rolls.
            </span>
          </li>
        </ul>

        <h2 className="pt-4 text-xl font-semibold text-foreground">On the roadmap</h2>

        <ul className="list-inside space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-foreground">Lab finder</strong> — Map-based search with community
              notes (see our{" "}
              <Link href="/labs" className="font-medium text-primary underline-offset-2 hover:underline">
                Labs
              </Link>{" "}
              page for interim resources).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-foreground">Lists &amp; saved references</strong> — Curate stocks and
              community shots.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>
              <strong className="text-foreground">Roll tracking</strong> — Log rolls, notes, and scan links.
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-12 rounded-[7px] border border-primary/20 bg-primary/5 p-6 text-center">
        <p className="font-semibold text-foreground">Ready to explore?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse film stocks from Kodak, Fujifilm, Ilford, and more.
        </p>
        <Link
          href="/films"
          className="mt-4 inline-flex items-center gap-2 rounded-card bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse Film Stocks
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
