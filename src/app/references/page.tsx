import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "References",
  description:
    "Browse references by film stock and brand. Community shots and references are in the Community section.",
};

export default async function ReferencesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">References</h1>
        <p className="mt-2 text-muted-foreground">
          References from across the database. Filter by brand and stock to find shots from a specific film.
        </p>
      </header>

      <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Reference images have moved to the Community section.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Browse community uploads and filter by film stock or brand there.
        </p>
        <Link
          href="/community"
          className="mt-6 inline-flex items-center rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Community
        </Link>
      </div>
    </div>
  );
}
