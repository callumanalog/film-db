import type { Metadata } from "next";
import Link from "next/link";
import { Film, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "About FilmDB — your ultimate resource for analog film photography.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[7px] bg-primary">
          <Film className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About FilmDB</h1>
      </div>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p className="text-lg text-foreground">
          FilmDB is a comprehensive database and community resource for analog film
          photography enthusiasts.
        </p>

        <p>
          Whether you&apos;re a seasoned film photographer looking for detailed technical
          specs, or a beginner trying to choose your first roll, FilmDB has you covered.
          We catalog every film stock with detailed descriptions, shooting tips, purchase
          links, and references.
        </p>

        <p>
          Film photography has experienced a remarkable renaissance in recent years. A new
          generation of photographers is discovering the magic of analog — the tactile
          experience of loading a roll, the anticipation of waiting for scans, and the
          unique character that no digital filter can truly replicate.
        </p>

        <p>
          We built FilmDB because we believe this community deserves a dedicated,
          comprehensive resource. Not a subreddit thread, not a scattered blog post —
          a true reference that brings together everything a film photographer needs in
          one place.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          What&apos;s Coming Next
        </h2>

        <ul className="list-inside space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Community uploads</strong> — Share your own references for each film stock</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Roll tracker</strong> — Keep a log of every roll you shoot with notes and scan links</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Lab finder</strong> — Find film development labs near you with reviews and pricing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><strong className="text-foreground">Reviews & ratings</strong> — Rate and review film stocks based on your experience</span>
          </li>
        </ul>
      </div>

      <div className="mt-12 rounded-[7px] border border-primary/20 bg-primary/5 p-6 text-center">
        <p className="font-semibold text-foreground">Ready to explore?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our database of film stocks from Kodak, Fujifilm, Ilford, and more.
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
