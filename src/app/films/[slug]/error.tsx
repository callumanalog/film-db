"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function FilmPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Film page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <AlertCircle className="mx-auto mb-6 h-14 w-14 text-destructive/70" aria-hidden />
      <h1 className="text-xl font-bold tracking-tight">Couldn’t load this film</h1>
      <p className="mt-2 text-muted-foreground">
        Something went wrong loading the page. Try again or browse other films.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-card border border-border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/films"
          className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          All film stocks
        </Link>
      </div>
    </div>
  );
}
