import { NextResponse } from "next/server";
import type { FilmReviewsBySlug } from "@/lib/editable-film-reviews";
import { getFilmReviewsFromFile, writeFilmReviewsToFile } from "@/lib/editable-film-reviews";
import { getFilmStocks } from "@/lib/supabase/queries";
import { getReviewsForSlug } from "@/lib/seed-film-reviews";
import { requireAdmin } from "@/lib/admin-auth";

/** GET returns merged reviews (file overrides seed) for all film stock slugs. */
export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const fromFile = getFilmReviewsFromFile();
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const merged: FilmReviewsBySlug = {};
  for (const s of stocks) {
    if (fromFile && fromFile[s.slug]) {
      merged[s.slug] = fromFile[s.slug];
    } else {
      merged[s.slug] = getReviewsForSlug(s.slug);
    }
  }
  return NextResponse.json(merged);
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  try {
    const body = (await request.json()) as unknown;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an object (slug -> { web, video })" }, { status: 400 });
    }
    const reviews = body as FilmReviewsBySlug;
    writeFilmReviewsToFile(reviews);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin film-reviews] write failed:", err);
    return NextResponse.json({ error: "Failed to save film reviews" }, { status: 500 });
  }
}
